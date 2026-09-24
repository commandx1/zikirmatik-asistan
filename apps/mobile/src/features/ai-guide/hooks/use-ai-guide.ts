// AI Rehber ekranının kompozisyon kökü. Parçalar:
//   - use-ai-guide-request.ts: girdi + istek durum makinesi (kredi, soket, 503, satın alma sonrası devam)
//   - use-ai-guide-history.ts: aktif sonuç + geçmiş + backend/cache hidrasyonu
//   - ../services/ai-guide-localize.ts: RAW → ekran metni (render anında, aktif dile göre)
// Burada yalnızca bunların birleşimi, çözümleme memo'ları ve küçük UI anahtarları var.
import { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiGuideHistoryItem, AiGuideRecommendation, AiGuideRecommendationRaw } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useProfileStore } from "../../../store/profile-store";
import { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import { AiApiError, selectAiRecommendation } from "../services/ai-api-client";
import { resolveVisibleAiGuideHistory } from "../services/ai-guide-history-service";
import { resolveRecommendation } from "../services/ai-guide-localize";
import { useAiGuideHistory } from "./use-ai-guide-history";
import { useAiGuideRequest } from "./use-ai-guide-request";

export function useAiGuide(onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
  const [showInfo, setShowInfo] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const authStatus = useAuthStore((s) => s.status);
  // Canonical locale kaynağı: useProfileStore.locale (reactive selector) —
  // dil değişince re-render'ı garanti eder.
  const locale = useProfileStore((s) => s.locale);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);

  const credits = useAiCredits({ onOpenPremiumSheet });
  const history = useAiGuideHistory(credits.refreshCredits);
  const request = useAiGuideRequest({ credits, history, onOpenPremiumSheet });
  const { recommendationId, lastPrompt, assistantNote, isHistoryExpanded } = history;
  const { setError } = request;

  const closeInfo = () => setShowInfo(false);
  const toggleInfo = () => setShowInfo((value) => !value);

  // `locale` veya `t` değişince yeniden oluşur → aşağıdaki memo'lar da.
  const resolve = useCallback(
    (raw: AiGuideRecommendationRaw, index: number) => resolveRecommendation(raw, index, locale, t),
    [locale, t]
  );

  const resolvedRecommendations = useMemo(
    () => history.recommendations.map((raw, index) => resolve(raw, index)),
    [history.recommendations, resolve]
  );

  const resolvedHistoryItems = useMemo<AiGuideHistoryItem[]>(
    () =>
      history.historyItems.map((item) => ({
        id: item.id,
        prompt: item.prompt,
        assistantNote: item.assistantNote,
        createdAt: item.createdAt,
        recommendations: item.recommendations.map((raw, index) => resolve(raw, index))
      })),
    [history.historyItems, resolve]
  );

  const visibleHistoryItems = useMemo(
    () => resolveVisibleAiGuideHistory(resolvedHistoryItems, isHistoryExpanded),
    [resolvedHistoryItems, isHistoryExpanded]
  );

  const selectRecommendation = (recommendation: AiGuideRecommendation) => {
    selectDhikr(
      recommendation.id,
      recommendationId
        ? { recommendationId, prompt: lastPrompt.trim() || t("ai-guide:genericPrompt"), assistantNote }
        : undefined
    );

    if (authStatus !== "authenticated" || !recommendationId) {
      return;
    }

    void selectAiRecommendation(recommendationId, recommendation.id).catch((error) => {
      if (error instanceof AiApiError) {
        setError(error.message);
      }
    });
  };

  const openHistoryItem = (item: AiGuideHistoryItem) => {
    history.openHistoryItem(item);
    setError(undefined);
  };

  const refresh = async () => {
    closeInfo();
    setIsRefreshing(true);
    try {
      await credits.refreshCredits();
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    intentInput: request.intentInput,
    showInfo,
    isLoading: request.isLoading,
    loadingStep: request.loadingStep,
    isRefreshing,
    error: request.error,
    postPurchaseNotice: request.postPurchaseNotice,
    resumeAfterCreditPurchase: request.resumeAfterCreditPurchase,
    offTopicMessage: request.offTopicMessage,
    clarification: request.clarification,
    aiUnavailable: request.aiUnavailable,
    retryLastRequest: request.retryLastRequest,
    recommendationId,
    assistantNote,
    recommendations: resolvedRecommendations,
    historyItems: resolvedHistoryItems,
    visibleHistoryItems,
    isHistoryExpanded,
    creditBalance: credits.creditBalance,
    closeInfo,
    toggleInfo,
    applyPrompt: request.applyPrompt,
    applySpecialDayIntent: request.applySpecialDayIntent,
    onIntentInputChange: request.onIntentInputChange,
    submitIntent: request.submitIntent,
    refresh,
    selectRecommendation,
    openHistoryItem,
    toggleHistoryExpanded: history.toggleHistoryExpanded
  };
}
