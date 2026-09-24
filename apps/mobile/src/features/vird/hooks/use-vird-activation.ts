// AI programının aktivasyonu (POST /v1/vird/programs/:id/activate) ve
// 403 VIRD_FREE_LIMIT_ACTIVE çakışma akışı: mevcut aktifi duraklatıp tekrar
// dene, vazgeç (taslak kalır) ya da premium'a geç.
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useVirdStore } from "../../../store/vird-store";
import { trackEvent } from "../../../lib/analytics";
import { fetchDhikrCatalog } from "../../dhikrs/services/dhikr-queries";
import { activateVirdProgram, fetchVirdPrograms, updateVirdProgram, VirdApiError } from "../services/vird-api-client";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import { selectProgramsToPause, toActivatedAiVirdProgramLocal } from "../services/vird-ai-create-service";

export function useVirdActivation(programId: string | undefined, onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
  const authStatus = useAuthStore((s) => s.status);

  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string>();
  const [activationConflict, setActivationConflict] = useState(false);
  // Çakışma modalından premium sheet'e geçildi: modal kapanır, satın alma
  // sonrası retryActivationAfterPremium aktivasyonu yalnız bu bayrakla tekrar dener.
  const conflictRetryPendingRef = useRef(false);

  const performActivation = useCallback(
    async (targetProgramId: string, options?: { conflictAsError?: boolean }): Promise<boolean> => {
      if (authStatus !== "authenticated") {
        return false;
      }

      conflictRetryPendingRef.current = false;
      setIsActivating(true);
      setActivationError(undefined);
      setActivationConflict(false);

      try {
        const activated = await activateVirdProgram(targetProgramId);
        // AI programı sunucuda bare {dhikrId,target} taşır — ana ekranın kartı
        // içerik gösterebilsin diye katalogdan taze çözülüp dhikrs snapshot'ı
        // olarak yazılır (bkz. vird-ai-create-service.ts toActivatedAiVirdProgramLocal).
        const catalog = await fetchDhikrCatalog();
        const local = toActivatedAiVirdProgramLocal(activated, catalog);
        useVirdStore.getState().upsertProgram(local);
        useVirdStore.getState().setActiveProgram(local.id);
        void trackEvent("program_activated", { source: "ai" });
        return true;
      } catch (error) {
        // Duraklatma turundan sonra hâlâ limit: modalı sonsuza dek yeniden
        // açmak yerine hata gösterilir (aşağıdaki genel dal).
        if (
          error instanceof VirdApiError &&
          error.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE &&
          !options?.conflictAsError
        ) {
          setActivationConflict(true);
          return false;
        }

        const fallback = t("ai-guide:virdProgram.errors.activationFailed");
        setActivationError(
          error instanceof VirdApiError ? resolveVirdErrorMessage(error.code, error.message || fallback) : fallback
        );
        return false;
      } finally {
        setIsActivating(false);
      }
    },
    [authStatus, t]
  );

  const activateProgram = useCallback(async (): Promise<boolean> => {
    if (isActivating || !programId) {
      return false;
    }
    return performActivation(programId);
  }, [isActivating, performActivation, programId]);

  /**
   * Çakışma çözümü: sunucudaki hedef dışı TÜM aktif programları sırayla
   * duraklatıp yeni programı tekrar aktifleştirir. Liste sunucudan taze
   * çekilir — yerel store yalnız activeProgramId'yi bilir; premium'dan
   * düşen kullanıcının başka aktif programları kalmış olabilir.
   */
  const resolveActivationConflictByPausingExisting = useCallback(async (): Promise<boolean> => {
    if (!programId || authStatus !== "authenticated") {
      return false;
    }

    try {
      const toPause = selectProgramsToPause(await fetchVirdPrograms(), programId);
      for (const server of toPause) {
        const paused = await updateVirdProgram(server.id, { status: "paused" });
        const previousLocal = useVirdStore.getState().programs.find((program) => program.id === server.id);
        useVirdStore.getState().upsertProgram(toLocalVirdProgram(paused, previousLocal));
      }
    } catch (error) {
      setActivationError(
        error instanceof VirdApiError ? error.message : t("ai-guide:virdProgram.errors.activationFailed")
      );
      return false;
    }

    return performActivation(programId, { conflictAsError: true });
  }, [authStatus, performActivation, programId, t]);

  const openPremiumSheetForActivationConflict = useCallback(() => {
    conflictRetryPendingRef.current = true;
    setActivationConflict(false);
    onOpenPremiumSheet?.();
  }, [onOpenPremiumSheet]);

  /**
   * Çakışmadan vazgeçip programı taslak bırakır (components/vird-swap-active-modal.tsx
   * "taslak olarak bırak"). Program sunucuda zaten var; bir sonraki
   * use-vird-backend-sync.ts senkronunda hub listesinde belirir.
   */
  const dismissActivationConflict = useCallback(() => {
    setActivationConflict(false);
  }, []);

  /** Yalnız çakışma modalından premium'a geçildiyse aktivasyonu tekrar dener. */
  const retryActivationAfterPremium = useCallback(async (): Promise<boolean> => {
    if (!conflictRetryPendingRef.current || !programId) {
      return false;
    }
    return performActivation(programId);
  }, [performActivation, programId]);

  /** Taslak atıldığında aktivasyon durumunu temizler. */
  const resetActivation = useCallback(() => {
    conflictRetryPendingRef.current = false;
    setActivationConflict(false);
    setActivationError(undefined);
  }, []);

  return {
    isActivating,
    activationError,
    activationConflict,
    activateProgram,
    resolveActivationConflictByPausingExisting,
    openPremiumSheetForActivationConflict,
    dismissActivationConflict,
    retryActivationAfterPremium,
    resetActivation
  };
}
