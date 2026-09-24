// "AI ile Program Oluştur" akışının durum/orkestrasyon katmanı —
// hooks/use-ai-guide.ts'in bu akışa daraltılmış kopyası (bilerek: her akış
// kendi küçük kopyasını taşır, bkz. vird-api-client.ts dosya başı notu).
// Saf parçalar (payload kurma, hata eşleme, dhikr snapshot çözümü)
// services/vird-ai-create-service.ts'de tutulur ve orada test edilir; burada
// yalnızca state + ağ çağrıları vardır.
//
// Akış: generate (POST /v1/ai/vird-programs, 3 kredi, socketId YOK → basit
// spinner) → önizleme → activate (POST /v1/vird/programs/:id/activate).
// activate 403 VIRD_FREE_LIMIT_ACTIVE dönerse ekrana iki seçenek sunulur:
// mevcut aktif programı duraklatıp tekrar dene, ya da premium'a geç.
import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VirdSlotKey } from "@zikirmatik/shared";
import { useAppLocale } from "../../../i18n";
import { createFlowId } from "../../../lib/ids";
import { useAuthStore } from "../../../store/auth-store";
import { useVirdStore } from "../../../store/vird-store";
import { trackEvent } from "../../../lib/analytics";
import { fetchDhikrCatalog } from "../../dhikrs/services/dhikr-queries";
import { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import {
  AiApiError,
  createAiVirdProgram,
  isAiVirdProgramOffTopicResponse,
  type AiVirdProgramPreview,
  type CreateAiVirdProgramPayload
} from "../../ai-guide/services/ai-api-client";
import { activateVirdProgram, updateVirdProgram, VirdApiError } from "../services/vird-api-client";
import { VIRD_ERROR_CODE, resolveVirdErrorMessage } from "../services/vird-error-codes";
import { toLocalVirdProgram } from "../services/vird-sync";
import {
  buildCreateAiVirdProgramPayload,
  mapAiVirdCreateError,
  toActivatedAiVirdProgramLocal
} from "../services/vird-ai-create-service";

// Sunucudaki AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT maliyeti (bkz.
// apps/api/src/modules/ai/credits.constants.ts VIRD_PROGRAM_CREDIT_COST,
// docs/vird-programi.md §3). Bu değer yalnızca istemci tarafı "yeterli kredi
// var mı" ön kontrolü/gösterimi içindir — asıl zorlama her zaman sunucudadır
// (403 AI_CREDIT_INSUFFICIENT).
const VIRD_AI_PROGRAM_CREDIT_COST = 3;

type AiUnavailableState = { message: string };

export function useVirdAiCreate(onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
  const locale = useAppLocale();

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);

  // --- form state ---
  const [freeText, setFreeText] = useState("");
  const [durationDays, setDurationDays] = useState<7 | 14 | 30>(7);
  const [slots, setSlots] = useState<VirdSlotKey[]>(["morning"]);
  const [prayerSelection, setPrayerSelection] = useState<number[]>([1, 2, 3, 4, 5]);

  // --- credits --- (ön kontrol her seferinde tazeler; eşik 3 kredi)
  const {
    creditBalance,
    refreshCredits,
    ensureCreditsAvailable,
    applyRemainingCredits,
    markInsufficient,
    waitForCredits
  } = useAiCredits({ requiredCredits: VIRD_AI_PROGRAM_CREDIT_COST, alwaysRefresh: true, onOpenPremiumSheet });

  // --- generation ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>();
  const [offTopicMessage, setOffTopicMessage] = useState<string>();
  const [aiUnavailable, setAiUnavailable] = useState<AiUnavailableState | null>(null);
  const [postPurchaseNotice, setPostPurchaseNotice] = useState<string>();
  const [programId, setProgramId] = useState<string>();
  const [programPreview, setProgramPreview] = useState<AiVirdProgramPreview>();
  const pendingGenerateRequestRef = useRef<CreateAiVirdProgramPayload | null>(null);
  const aiUnavailableRequestRef = useRef<CreateAiVirdProgramPayload | null>(null);

  // --- activation ---
  const [isActivating, setIsActivating] = useState(false);
  const [activationError, setActivationError] = useState<string>();
  const [activationConflict, setActivationConflict] = useState(false);

  const toggleSlot = useCallback((slot: VirdSlotKey) => {
    setSlots((prev) => (prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot]));
  }, []);

  const togglePrayerIndex = useCallback((index: number) => {
    setPrayerSelection((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index].sort((a, b) => a - b)
    );
  }, []);

  useEffect(() => {
    void refreshCredits();
  }, [authStatus, refreshCredits]);

  const executeGenerate = useCallback(
    async (payload: CreateAiVirdProgramPayload) => {
      pendingGenerateRequestRef.current = null;
      setIsGenerating(true);
      setGenerationError(undefined);
      setOffTopicMessage(undefined);
      setAiUnavailable(null);
      void trackEvent("program_generate_started", { durationDays: payload.durationDays });

      try {
        if (authStatus !== "authenticated" || !userId) {
          return;
        }

        const response = await createAiVirdProgram(payload);

        if (isAiVirdProgramOffTopicResponse(response)) {
          setOffTopicMessage(response.message);
          setProgramId(undefined);
          setProgramPreview(undefined);
          return;
        }

        setProgramId(response.programId);
        setProgramPreview(response.program);
        applyRemainingCredits(response.remainingCredits);
        void trackEvent("program_generated", { durationDays: payload.durationDays });
      } catch (error) {
        const fallbackMessage = t("ai-guide:virdProgram.errors.generationFailed");
        const classification = mapAiVirdCreateError(error, fallbackMessage);

        if (classification.kind === "creditInsufficient") {
          markInsufficient();
          pendingGenerateRequestRef.current = payload;
          onOpenPremiumSheet?.();
        } else if (classification.kind === "unavailable") {
          aiUnavailableRequestRef.current = payload;
          setAiUnavailable({ message: classification.message });
        } else {
          setGenerationError(classification.message);
        }

        void trackEvent("program_generation_failed", {
          code: error instanceof AiApiError && error.code ? error.code : "unknown"
        });
      } finally {
        setIsGenerating(false);
      }
    },
    [applyRemainingCredits, authStatus, markInsufficient, onOpenPremiumSheet, t, userId]
  );

  const submitGenerate = useCallback(async () => {
    if (isGenerating || slots.length === 0) {
      return;
    }

    setPostPurchaseNotice(undefined);
    setAiUnavailable(null);
    setGenerationError(undefined);
    setOffTopicMessage(undefined);

    const flowId = createFlowId();
    const payload = buildCreateAiVirdProgramPayload({ freeText, durationDays, slots, prayerSelection, locale }, flowId);

    if (!(await ensureCreditsAvailable())) {
      pendingGenerateRequestRef.current = payload;
      return;
    }

    await executeGenerate(payload);
  }, [durationDays, ensureCreditsAvailable, executeGenerate, freeText, isGenerating, locale, prayerSelection, slots]);

  const retryGenerateAfterUnavailable = useCallback(async () => {
    if (isGenerating) {
      return;
    }

    const payload = aiUnavailableRequestRef.current;
    if (!payload) {
      return;
    }

    setPostPurchaseNotice(undefined);

    if (!(await ensureCreditsAvailable())) {
      pendingGenerateRequestRef.current = payload;
      return;
    }

    await executeGenerate(payload);
  }, [ensureCreditsAvailable, executeGenerate, isGenerating]);

  const resumeGenerateAfterCreditPurchase = useCallback(async () => {
    if (isGenerating) {
      return;
    }

    setPostPurchaseNotice(undefined);
    setIsGenerating(true);

    if (!(await waitForCredits())) {
      setIsGenerating(false);
      setPostPurchaseNotice(t("ai-guide:virdProgram.loading.creditsLoadingRetry"));
      return;
    }

    const payload = pendingGenerateRequestRef.current;
    pendingGenerateRequestRef.current = null;
    setIsGenerating(false);
    if (payload) {
      await executeGenerate(payload);
    }
  }, [executeGenerate, isGenerating, t, waitForCredits]);

  const discardDraft = useCallback(() => {
    setProgramId(undefined);
    setProgramPreview(undefined);
    setActivationConflict(false);
    setActivationError(undefined);
  }, []);

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
        // AI programı sunucuda bare {dhikrId,target} taşır (ad/anlam denormalize
        // EDİLMEZ) — ana ekranın kartı (todays-vird-card.tsx) içerik gösterebilsin
        // diye katalogdan taze çözülüp dhikrs snapshot'ı olarak yazılır (bkz.
        // vird-ai-create-service.ts toActivatedAiVirdProgramLocal).
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

  /**
   * Aktivasyon çakışması (403 VIRD_FREE_LIMIT_ACTIVE) çözümü: mevcut aktif
   * programı duraklatıp yeni (AI) programı tekrar aktifleştirmeyi dener.
   */
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
   * Aktivasyon çakışmasından (403 VIRD_FREE_LIMIT_ACTIVE) vazgeçip yeni
   * (AI) programı taslak olarak bırakır — bkz. components/vird-swap-active-modal.tsx
   * "taslak olarak bırak" seçeneği. Program zaten sunucuda oluşturulmuş
   * (createAiVirdProgram) ama hiç aktifleştirilmediğinden ek bir yazıma
   * gerek yok; bir sonraki `use-vird-backend-sync.ts` senkronunda hub'ın
   * program listesinde belirir.
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

  /**
   * ProfilePremiumSheet'in `onPremiumActivated` callback'i için tek giriş
   * noktası — hangi akışın (kredi yetersizliği sırasında üretim, ya da
   * aktivasyon çakışması) beklemede olduğuna bakıp doğru devam fonksiyonunu
   * çalıştırır (bkz. features/ai-guide/screen.tsx'teki eşdeğer desen).
   */
  const resumeAfterPremiumPurchase = useCallback(async () => {
    if (pendingGenerateRequestRef.current) {
      await resumeGenerateAfterCreditPurchase();
      return;
    }
    if (activationConflict) {
      await retryActivationAfterPremium();
    }
  }, [activationConflict, resumeGenerateAfterCreditPurchase, retryActivationAfterPremium]);

  return {
    // form
    freeText,
    setFreeText,
    durationDays,
    setDurationDays,
    slots,
    toggleSlot,
    prayerSelection,
    togglePrayerIndex,
    // credits
    creditBalance,
    // generation
    isGenerating,
    generationError,
    offTopicMessage,
    aiUnavailable,
    postPurchaseNotice,
    programPreview,
    submitGenerate,
    retryGenerateAfterUnavailable,
    discardDraft,
    // activation
    isActivating,
    activationError,
    activationConflict,
    activateProgram,
    resolveActivationConflictByPausingExisting,
    openPremiumSheetForActivationConflict,
    dismissActivationConflict,
    // premium sheet purchase resume (hem üretim hem aktivasyon için ortak)
    resumeAfterPremiumPurchase
  };
}
