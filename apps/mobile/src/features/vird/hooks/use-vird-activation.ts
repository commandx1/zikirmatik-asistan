// AI programının aktivasyonu (POST /v1/vird/programs/:id/activate) ve
// 403 VIRD_FREE_LIMIT_ACTIVE çakışma akışı: mevcut aktifi duraklatıp tekrar
// dene, vazgeç (taslak kalır) ya da premium'a geç.
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useVirdStore } from "../../../store/vird-store";
import { trackEvent } from "../../../lib/analytics";
import { fetchDhikrCatalog } from "../../dhikrs/services/dhikr-queries";
import { activateVirdProgram, updateVirdProgram, VirdApiError } from "../services/vird-api-client";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import { toActivatedAiVirdProgramLocal } from "../services/vird-ai-create-service";

export function useVirdActivation(programId: string | undefined, onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
  const authStatus = useAuthStore((s) => s.status);

  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string>();
  const [activationConflict, setActivationConflict] = useState(false);

  const performActivation = useCallback(
    async (targetProgramId: string): Promise<boolean> => {
      if (authStatus !== "authenticated") {
        return false;
      }

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
        if (error instanceof VirdApiError && error.code === VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE) {
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

  /** Çakışma çözümü: mevcut aktif programı duraklatıp yeni programı tekrar aktifleştirir. */
  const resolveActivationConflictByPausingExisting = useCallback(async (): Promise<boolean> => {
    if (!programId || authStatus !== "authenticated") {
      return false;
    }

    const currentActiveId = useVirdStore.getState().activeProgramId;
    const currentActive = useVirdStore.getState().programs.find((program) => program.id === currentActiveId);

    if (currentActive) {
      try {
        const paused = await updateVirdProgram(currentActive.id, { status: "paused" });
        useVirdStore.getState().upsertProgram(toLocalVirdProgram(paused, currentActive));
      } catch (error) {
        setActivationError(
          error instanceof VirdApiError ? error.message : t("ai-guide:virdProgram.errors.activationFailed")
        );
        return false;
      }
    }

    return performActivation(programId);
  }, [authStatus, performActivation, programId, t]);

  const openPremiumSheetForActivationConflict = useCallback(() => {
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

  const retryActivationAfterPremium = useCallback(async (): Promise<boolean> => {
    setActivationConflict(false);
    if (!programId) {
      return false;
    }
    return performActivation(programId);
  }, [performActivation, programId]);

  /** Taslak atıldığında aktivasyon durumunu temizler. */
  const resetActivation = useCallback(() => {
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
