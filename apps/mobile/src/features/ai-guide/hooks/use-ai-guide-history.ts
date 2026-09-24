// Rehber'in "son sonuç + geçmiş" durumu: aktif öneri seti, geçmiş listesi,
// açılış hidrasyonu (önce backend, düşerse AsyncStorage cache) ve başarılı
// istek sonrası yazım. Dil-bağımlı alanlar RAW (LocalizedText) saklanır;
// çözüm render anında use-ai-guide.ts'te yapılır.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import type { AiGuideHistoryItem, AiGuideHistoryItemRaw, AiGuideRecommendationRaw } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { fetchDhikrCatalog } from "../../dhikrs/services/dhikr-queries";
import { fetchAiRecommendations } from "../../ai-shared/services/ai-queries";
import { buildAiGuideHistoryItems } from "../services/ai-guide-history-service";
import { readAiGuideCache, writeAiGuideCache, type LastAiGuideResult } from "../services/ai-guide-cache";

export function useAiGuideHistory(refreshCredits: () => Promise<unknown>) {
  const { t } = useTranslation("ai-guide");
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);

  const [recommendationId, setRecommendationId] = useState<string>();
  const [recommendations, setRecommendations] = useState<AiGuideRecommendationRaw[]>([]);
  const [assistantNote, setAssistantNote] = useState<string>();
  const [historyItems, setHistoryItems] = useState<AiGuideHistoryItemRaw[]>([]);
  const [isHistoryExpanded, setHistoryExpanded] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");

  useEffect(() => {
    setRecommendationId(undefined);
    setRecommendations([]);
    setAssistantNote(undefined);
    setHistoryItems([]);
    setHistoryExpanded(false);
    setLastPrompt("");
  }, [authStatus, userId]);

  const hydrateLastResultFromCache = useCallback(async () => {
    if (!userId) {
      return false;
    }

    const cached = await readAiGuideCache(userId);
    if (!cached) {
      return false;
    }

    setLastPrompt(cached.prompt || "");
    setAssistantNote(cached.assistantNote?.trim() || undefined);
    setRecommendationId(cached.recommendationId);
    setRecommendations(cached.recommendations);
    setHistoryItems(
      cached.recommendationId
        ? [
            {
              id: cached.recommendationId,
              prompt: cached.prompt?.trim() || t("ai-guide:genericPrompt"),
              assistantNote: cached.assistantNote?.trim() || undefined,
              createdAt: "",
              recommendations: cached.recommendations
            }
          ]
        : []
    );
    setHistoryExpanded(false);
    return true;
  }, [userId, t]);

  const hydrateLastResultFromBackend = useCallback(async () => {
    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    const [recommendationRows, catalog] = await Promise.all([fetchAiRecommendations(userId), fetchDhikrCatalog()]);
    await refreshCredits();

    const nextHistoryItems = buildAiGuideHistoryItems(recommendationRows, catalog);
    setHistoryItems(nextHistoryItems);

    const latest = nextHistoryItems[0];
    if (!latest) {
      return false;
    }

    const prompt = latest.prompt === t("ai-guide:genericPrompt") ? "" : latest.prompt;
    setLastPrompt(prompt);
    setAssistantNote(latest.assistantNote);
    setRecommendationId(latest.id);
    setRecommendations(latest.recommendations);

    void writeAiGuideCache(userId, {
      prompt,
      assistantNote: latest.assistantNote,
      recommendationId: latest.id,
      recommendations: latest.recommendations
    });

    return true;
  }, [authStatus, refreshCredits, userId, t]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) {
      return;
    }

    let isCancelled = false;
    const run = async () => {
      try {
        const loadedFromBackend = await hydrateLastResultFromBackend();
        if (isCancelled || loadedFromBackend) {
          return;
        }
      } catch {
        // fallback to local cache
      }

      if (!isCancelled) {
        await hydrateLastResultFromCache();
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, userId, hydrateLastResultFromBackend, hydrateLastResultFromCache]);

  /** Başarılı istek: aktif sonucu yaz, geçmişin başına ekle, cache'le. */
  const applyResult = useCallback(
    (result: LastAiGuideResult & { recommendationId: string }) => {
      setRecommendationId(result.recommendationId);
      setLastPrompt(result.prompt);
      setAssistantNote(result.assistantNote);
      setRecommendations(result.recommendations);
      setHistoryItems((prev) => [
        {
          id: result.recommendationId,
          prompt: result.prompt || t("ai-guide:genericPrompt"),
          assistantNote: result.assistantNote,
          createdAt: new Date().toISOString(),
          recommendations: result.recommendations
        },
        ...prev.filter((item) => item.id !== result.recommendationId)
      ]);
      setHistoryExpanded(false);

      if (userId) {
        void writeAiGuideCache(userId, result);
      }
    },
    [userId, t]
  );

  /** Konu dışı / netleştirme yanıtı: aktif öneri setini boşalt. */
  const clearResult = useCallback(() => {
    setRecommendations([]);
    setAssistantNote(undefined);
    setRecommendationId(undefined);
  }, []);

  const openHistoryItem = (item: AiGuideHistoryItem) => {
    // `item` çözülmüş (display) tipte gelir; state'e raw kaynağı id ile
    // buluyoruz ki dil değişince bu kayıt da yeniden çözülsün.
    const rawItem = historyItems.find((entry) => entry.id === item.id);
    setRecommendationId(item.id);
    setLastPrompt(item.prompt === t("ai-guide:genericPrompt") ? "" : item.prompt);
    setAssistantNote(item.assistantNote);
    setRecommendations(rawItem?.recommendations ?? []);
  };

  return {
    recommendationId,
    recommendations,
    assistantNote,
    lastPrompt,
    historyItems,
    isHistoryExpanded,
    toggleHistoryExpanded: () => setHistoryExpanded((value) => !value),
    applyResult,
    clearResult,
    openHistoryItem
  };
}
