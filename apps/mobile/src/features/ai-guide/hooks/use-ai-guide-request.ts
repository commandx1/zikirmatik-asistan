// Rehber isteğinin durum makinesi: girdi, kredi ön kontrolü, ilerleme soketi,
// yanıt sınıflandırma (konu dışı / netleştirme / başarı / kredi yetersiz /
// 503 / genel hata) ve tekrar-dene / satın-alma-sonrası devam akışları.
// Başarılı sonuç ve sonuç temizliği use-ai-guide-history.ts'e devredilir.
import { useCallback, useEffect, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { createFlowId } from "../../../lib/ids";
import type { AiGuideRecommendationRaw } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { useStableCallback } from "../../../hooks/use-stable-callback";
import type { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import { useAiProgressSteps } from "../../ai-shared/hooks/use-ai-progress-steps";
import {
  AiApiError,
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  DAILY_LIMIT_REACHED_CODE,
  createAiRecommendation,
  isAiClarificationResponse,
  isAiOffTopicResponse
} from "../services/ai-api-client";
import type { useAiGuideHistory } from "./use-ai-guide-history";

type PendingAiRequest = {
  freeText?: string;
  flowId: string;
};

type Options = {
  credits: ReturnType<typeof useAiCredits>;
  history: Pick<ReturnType<typeof useAiGuideHistory>, "applyResult" | "clearResult">;
  onOpenPremiumSheet?: () => void;
};

export function useAiGuideRequest({ credits, history, onOpenPremiumSheet }: Options) {
  const { t } = useTranslation("ai-guide");
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const { resetCredits, ensureCreditsAvailable, applyRemainingCredits, markInsufficient, waitForCredits } = credits;
  const { applyResult, clearResult } = history;
  const { loadingStep, setLoadingStep, withProgress } = useAiProgressSteps("guide");

  const [intentInput, setIntentInput] = useState("");
  // Özel gün detayından taşınan bağlam. State değil ref: yalnızca istek
  // gönderilirken okunur, render'ı etkilemez.
  const specialDayNameRef = useRef<string | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();
  const [offTopicMessage, setOffTopicMessage] = useState<string>();
  const [clarification, setClarification] = useState<{ message: string }>();
  const [aiUnavailable, setAiUnavailable] = useState<{ message: string } | null>(null);
  const [activeFlowId, setActiveFlowId] = useState<string>();
  const [postPurchaseNotice, setPostPurchaseNotice] = useState<string>();
  const pendingRequestRef = useRef<PendingAiRequest | null>(null);
  // AI_UNAVAILABLE (503) alındığında son isteği burada saklarız — kredi
  // düşülmediği için pendingRequestRef'ten (kredi satın alma akışı) ayrı
  // tutulur; retryLastRequest aynı flowId ile aynı isteği tekrar gönderir.
  const aiUnavailableRequestRef = useRef<PendingAiRequest | null>(null);

  useEffect(() => {
    setError(undefined);
    setIntentInput("");
    resetCredits();
    setActiveFlowId(undefined);
  }, [authStatus, userId, resetCredits]);

  const applyPrompt = (value: string) => {
    setIntentInput(value);
  };

  /**
   * Özel gün detayından gelen niyeti girdi alanına yazar. Otomatik submit
   * YOK: istek atmak 1 kredi yakar, kullanıcı butona kendisi basmalı.
   */
  const applySpecialDayIntent = useStableCallback((intent: { freeText: string; specialDayName: string }) => {
    setIntentInput(intent.freeText);
    specialDayNameRef.current = intent.specialDayName;
  });

  const onIntentInputChange = (value: string) => {
    setIntentInput(value);
    setPostPurchaseNotice(undefined);
  };

  const executeRecommendationRequest = useCallback(
    async (request: PendingAiRequest) => {
      pendingRequestRef.current = null;
      setIsLoading(true);
      setError(undefined);
      setOffTopicMessage(undefined);
      setClarification(undefined);
      setAiUnavailable(null);

      const stepLabel = (key: string) =>
        t(`ai-guide:loading.steps.${key}`, { defaultValue: t("ai-guide:loading.defaultStep") });

      await withProgress(stepLabel, async (socketId) => {
        try {
          if (authStatus !== "authenticated" || !userId) {
            clearResult();
            setIntentInput("");
            return;
          }

          const now = new Date();
          const matchedSpecialDayName = resolveSpecialDayContext(specialDayNameRef.current, request.freeText);
          const response = await createAiRecommendation({
            userId,
            flowId: request.flowId,
            freeText: request.freeText,
            maxRecommendations: 3,
            socketId,
            timeContext: {
              hour: now.getHours(),
              dayOfWeek: now.getDay(),
              // Özel gün bağlamı yalnızca gün adı metinde hâlâ duruyorsa
              // gönderilir; kullanıcı adı silip başka bir şey sorduğunda
              // retrieval yanlış güne kaymasın.
              isSpecialDay: Boolean(matchedSpecialDayName),
              ...(matchedSpecialDayName ? { specialDayName: matchedSpecialDayName } : {})
            }
          });

          if (isAiOffTopicResponse(response)) {
            setOffTopicMessage(response.message);
            clearResult();
            setActiveFlowId(undefined);
            setIntentInput("");
            return;
          }

          if (isAiClarificationResponse(response)) {
            setClarification({ message: response.message });
            clearResult();
            return;
          }

          // Dil-bağımlı alanlar RAW (LocalizedText) saklanır — çözüm render
          // anında aktif dile göre yapılır.
          const rawItems: AiGuideRecommendationRaw[] = response.items.map((item) => ({
            id: item.id,
            name: item.name,
            arabic: item.nameArabic,
            transliteration: item.transliteration,
            meaning: item.meaning,
            virtue: item.virtue,
            source: item.source,
            recommendedCount: item.recommendedCount
          }));
          applyResult({
            prompt: request.freeText?.trim() || "",
            assistantNote: response.reasoning?.trim() || undefined,
            recommendationId: response.recommendationId,
            recommendations: rawItems
          });
          applyRemainingCredits(response.remainingCredits);

          setActiveFlowId(undefined);
          setIntentInput("");
        } catch (error) {
          if (
            error instanceof AiApiError &&
            (error.code === AI_CREDIT_INSUFFICIENT_CODE || error.code === DAILY_LIMIT_REACHED_CODE)
          ) {
            markInsufficient();
            pendingRequestRef.current = request;
            onOpenPremiumSheet?.();
          } else if (error instanceof AiApiError && error.code === AI_UNAVAILABLE_CODE) {
            // 503: kredi düşülmedi, bakiyeye ya da premium sheet'e dokunma —
            // yalnızca aynı flowId ile tekrar denemeyi teklif et.
            aiUnavailableRequestRef.current = request;
            setAiUnavailable({ message: error.message || t("ai-guide:errors.aiUnavailable") });
          } else if (error instanceof AiApiError) {
            setError(error.message);
          } else {
            setError(t("ai-guide:errors.recommendationFailed"));
          }
        } finally {
          setIsLoading(false);
        }
      });
    },
    [applyRemainingCredits, applyResult, authStatus, clearResult, markInsufficient, onOpenPremiumSheet, userId, t, withProgress]
  );

  const submitIntent = async () => {
    if (isLoading) {
      return;
    }

    Keyboard.dismiss();
    setPostPurchaseNotice(undefined);
    setAiUnavailable(null);
    const flowId = createFlowId();
    setActiveFlowId(flowId);
    const request = { freeText: intentInput.trim() || undefined, flowId };

    if (!(await ensureCreditsAvailable())) {
      pendingRequestRef.current = request;
      return;
    }

    await executeRecommendationRequest(request);
  };

  /**
   * AI_UNAVAILABLE (503) sonrası "Tekrar dene" — aynı istek nesnesini
   * (dolayısıyla aynı flowId'yi) yeniden gönderir. Sunucu flowId+promptHash
   * üzerinden idempotency uyguladığı için güvenli; kredi zaten düşülmemişti.
   */
  const retryLastRequest = async () => {
    if (isLoading) {
      return;
    }

    const request = aiUnavailableRequestRef.current;
    if (!request) {
      return;
    }

    setPostPurchaseNotice(undefined);

    if (!(await ensureCreditsAvailable())) {
      pendingRequestRef.current = request;
      return;
    }

    await executeRecommendationRequest(request);
  };

  const resumeAfterCreditPurchase = async () => {
    if (isLoading) {
      return;
    }

    setPostPurchaseNotice(undefined);
    setIsLoading(true);
    setLoadingStep(t("ai-guide:loading.creditsLoading"));

    if (!(await waitForCredits())) {
      setIsLoading(false);
      setLoadingStep("");
      setPostPurchaseNotice(t("ai-guide:loading.creditsLoadingRetry"));
      return;
    }

    const request =
      pendingRequestRef.current ??
      (intentInput.trim() ? { freeText: intentInput.trim(), flowId: activeFlowId || createFlowId() } : null);
    pendingRequestRef.current = null;
    setIsLoading(false);
    setLoadingStep("");
    if (request) {
      await executeRecommendationRequest(request);
    }
  };

  return {
    intentInput,
    isLoading,
    loadingStep,
    error,
    setError,
    postPurchaseNotice,
    offTopicMessage,
    clarification,
    aiUnavailable,
    applyPrompt,
    applySpecialDayIntent,
    onIntentInputChange,
    submitIntent,
    retryLastRequest,
    resumeAfterCreditPurchase
  };
}

function resolveSpecialDayContext(specialDayName?: string, freeText?: string) {
  const name = specialDayName?.trim();
  if (!name || !freeText) {
    return undefined;
  }

  return freeText.toLocaleLowerCase("tr-TR").includes(name.toLocaleLowerCase("tr-TR")) ? name : undefined;
}
