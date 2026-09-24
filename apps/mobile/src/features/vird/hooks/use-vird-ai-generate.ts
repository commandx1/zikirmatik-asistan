// AI Vird programı üretimi: form durumu ve POST /v1/ai/vird-programs (3 kredi,
// socketId YOK → basit spinner), 503 tekrar dene, kredi satın alma sonrası
// devam, taslağı atma. Saf parçalar ../services/vird-ai-create-service.ts'de.
import { useCallback, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { VirdSlotKey } from "@zikirmatik/shared";
import { useAppLocale } from "../../../i18n";
import { createFlowId } from "../../../lib/ids";
import { useAuthStore } from "../../../store/auth-store";
import { trackEvent } from "../../../lib/analytics";
import type { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import {
  AiApiError,
  createAiVirdProgram,
  isAiVirdProgramOffTopicResponse,
  type AiVirdProgramPreview,
  type CreateAiVirdProgramPayload
} from "../../ai-guide/services/ai-api-client";
import { buildCreateAiVirdProgramPayload, mapAiVirdCreateError } from "../services/vird-ai-create-service";

export function useVirdAiGenerate(credits: ReturnType<typeof useAiCredits>, onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
  const locale = useAppLocale();
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const { ensureCreditsAvailable, applyRemainingCredits, markInsufficient, waitForCredits } = credits;

  // --- form ---
  const [freeText, setFreeText] = useState("");
  const [durationDays, setDurationDays] = useState<7 | 14 | 30>(7);
  const [slots, setSlots] = useState<VirdSlotKey[]>(["morning"]);
  const [prayerSelection, setPrayerSelection] = useState<number[]>([1, 2, 3, 4, 5]);

  // --- generation ---
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationError, setGenerationError] = useState<string>();
  const [offTopicMessage, setOffTopicMessage] = useState<string>();
  const [aiUnavailable, setAiUnavailable] = useState<{ message: string } | null>(null);
  const [postPurchaseNotice, setPostPurchaseNotice] = useState<string>();
  const [programId, setProgramId] = useState<string>();
  const [programPreview, setProgramPreview] = useState<AiVirdProgramPreview>();
  const pendingGenerateRequestRef = useRef<CreateAiVirdProgramPayload | null>(null);
  const aiUnavailableRequestRef = useRef<CreateAiVirdProgramPayload | null>(null);

  const toggleSlot = useCallback((slot: VirdSlotKey) => {
    setSlots((prev) => (prev.includes(slot) ? prev.filter((item) => item !== slot) : [...prev, slot]));
  }, []);

  const togglePrayerIndex = useCallback((index: number) => {
    setPrayerSelection((prev) =>
      prev.includes(index) ? prev.filter((item) => item !== index) : [...prev, index].sort((a, b) => a - b)
    );
  }, []);

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

  /** Kredi yetersizliği yüzünden bekleyen bir üretim isteği var mı. */
  const hasPendingGenerate = useCallback(() => pendingGenerateRequestRef.current !== null, []);

  const clearDraft = useCallback(() => {
    setProgramId(undefined);
    setProgramPreview(undefined);
  }, []);

  return {
    freeText,
    setFreeText,
    durationDays,
    setDurationDays,
    slots,
    toggleSlot,
    prayerSelection,
    togglePrayerIndex,
    isGenerating,
    generationError,
    offTopicMessage,
    aiUnavailable,
    postPurchaseNotice,
    programId,
    programPreview,
    submitGenerate,
    retryGenerateAfterUnavailable,
    resumeGenerateAfterCreditPurchase,
    hasPendingGenerate,
    clearDraft
  };
}
