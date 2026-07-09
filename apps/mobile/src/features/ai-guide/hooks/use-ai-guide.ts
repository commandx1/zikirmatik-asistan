import { useCallback, useEffect, useMemo, useState } from "react";
import { Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AiGuideHistoryItem, AiGuideRecommendation } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { listVerifiedActiveDhikrs } from "../../dhikrs/services/dhikrs-api-client";
import {
  AiApiError,
  AI_CREDIT_INSUFFICIENT_CODE,
  DAILY_LIMIT_REACHED_CODE,
  createAiRecommendation,
  getAiCredits,
  getAiDailyQuota,
  listAiRecommendations,
  selectAiRecommendation
} from "../services/ai-api-client";
import { createAiProgressSocket } from "../services/ai-progress-socket";
import { buildAiGuideHistoryItems, resolveVisibleAiGuideHistory } from "../services/ai-guide-history-service";
import { useProfileStore } from "../../../store/profile-store";
import { getUserById } from "../../users/services/users-api-client";
import { getPrayerTimesByCity } from "../../prayer-times/services/prayer-times-api-client";
import { formatCurrentPrayerLabel, formatWeekdayLabel } from "../../../lib/prayer-time";

type LastAiGuideResult = {
  prompt: string;
  assistantNote?: string;
  recommendationId?: string;
  recommendations: AiGuideRecommendation[];
};

type ClarificationState = {
  message: string;
  suggestedCategories: string[];
};

export function useAiGuide(onOpenPremiumSheet?: () => void) {
  const [intentInput, setIntentInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string>();
  const [offTopicMessage, setOffTopicMessage] = useState<string>();
  const [clarification, setClarification] = useState<ClarificationState>();
  const [recommendationId, setRecommendationId] = useState<string>();
  const [recommendations, setRecommendations] = useState<AiGuideRecommendation[]>([]);
  const [assistantNote, setAssistantNote] = useState<string>();
  const [historyItems, setHistoryItems] = useState<AiGuideHistoryItem[]>([]);
  const [isHistoryExpanded, setHistoryExpanded] = useState(false);
  const [lastPrompt, setLastPrompt] = useState("");
  const [prayerTimeLabel, setPrayerTimeLabel] = useState("Vakit bilgisi yok");
  const [weekdayLabel, setWeekdayLabel] = useState(formatWeekdayLabel());
  const [isPremiumVerified, setIsPremiumVerified] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [dailyGrant, setDailyGrant] = useState(1);
  const [monthlyGrant, setMonthlyGrant] = useState(0);
  const [creditsConfirmed, setCreditsConfirmed] = useState(false);
  const [activeFlowId, setActiveFlowId] = useState<string>();
  const [loadingStep, setLoadingStep] = useState("");

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const profileCity = useProfileStore((s) => s.city);
  const isPremium = useProfileStore((s) => s.isPremium);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);

  const closeInfo = () => setShowInfo(false);
  const toggleInfo = () => setShowInfo((value) => !value);

  const cacheKey = userId ? `ai-guide:last:${userId}` : "";

  const refreshCredits = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setCreditBalance(0);
      setDailyGrant(1);
      setMonthlyGrant(0);
      setCreditsConfirmed(false);
      return { balance: 0, isPremium: false };
    }

    try {
      const credits = await getAiCredits(accessToken);
      setCreditBalance(Math.max(0, Math.floor(credits.balance)));
      setDailyGrant(Math.max(0, Math.floor(credits.dailyGrant)));
      setMonthlyGrant(Math.max(0, Math.floor(credits.monthlyGrant)));
      setIsPremiumVerified(Boolean(credits.isPremium));
      setCreditsConfirmed(true);
      return { balance: credits.balance, isPremium: credits.isPremium };
    } catch {
      const quota = await getAiDailyQuota(accessToken);
      const fallbackBalance = quota.isPremium
        ? Number.MAX_SAFE_INTEGER
        : Math.max(0, (quota.limit ?? 1) - quota.used);
      setCreditBalance(fallbackBalance);
      setDailyGrant(quota.isPremium ? 0 : quota.limit ?? 1);
      setMonthlyGrant(0);
      setIsPremiumVerified(Boolean(quota.isPremium));
      setCreditsConfirmed(true);
      return { balance: fallbackBalance, isPremium: quota.isPremium };
    }
  }, [accessToken, authStatus]);

  useEffect(() => {
    setError(undefined);
    setRecommendationId(undefined);
    setRecommendations([]);
    setAssistantNote(undefined);
    setHistoryItems([]);
    setHistoryExpanded(false);
    setLastPrompt("");
    setIntentInput("");
    setCreditBalance(0);
    setDailyGrant(1);
    setMonthlyGrant(0);
    setCreditsConfirmed(false);
    setActiveFlowId(undefined);
  }, [authStatus, cacheKey]);

  const hydrateLastResultFromCache = useCallback(async () => {
    if (!cacheKey) {
      return false;
    }

    const raw = await AsyncStorage.getItem(cacheKey);
    if (!raw) {
      return false;
    }

    const parsed = JSON.parse(raw) as LastAiGuideResult;
    if (!parsed || !Array.isArray(parsed.recommendations)) {
      return false;
    }

    setLastPrompt(parsed.prompt || "");
    setAssistantNote(parsed.assistantNote?.trim() || undefined);
    setRecommendationId(parsed.recommendationId);
    setRecommendations(parsed.recommendations);
    setHistoryItems(
      parsed.recommendationId
        ? [
            {
              id: parsed.recommendationId,
              prompt: parsed.prompt?.trim() || "Genel öneri",
              assistantNote: parsed.assistantNote?.trim() || undefined,
              createdAt: "",
              recommendations: parsed.recommendations
            }
          ]
        : []
    );
    setHistoryExpanded(false);
    return true;
  }, [cacheKey]);

  const hydrateLastResultFromBackend = useCallback(async () => {
    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    const [recommendationRows, catalog] = await Promise.all([
      listAiRecommendations(accessToken),
      listVerifiedActiveDhikrs(),
    ]);
    await refreshCredits();

    const nextHistoryItems = buildAiGuideHistoryItems(recommendationRows, catalog);
    setHistoryItems(nextHistoryItems);

    const latest = nextHistoryItems[0];
    if (!latest) {
      return false;
    }

    const prompt = latest.prompt === "Genel öneri" ? "" : latest.prompt;
    setLastPrompt(prompt);
    setAssistantNote(latest.assistantNote);
    setRecommendationId(latest.id);
    setRecommendations(latest.recommendations);

    if (cacheKey) {
      void AsyncStorage.setItem(
        cacheKey,
        JSON.stringify({
          prompt,
          assistantNote: latest.assistantNote,
          recommendationId: latest.id,
          recommendations: latest.recommendations
        } satisfies LastAiGuideResult)
      ).catch(() => {
        // ignore cache write errors
      });
    }

    return true;
  }, [accessToken, authStatus, cacheKey, refreshCredits, userId]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !cacheKey) {
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

      try {
        if (!isCancelled) {
          await hydrateLastResultFromCache();
        }
      } catch {
        // ignore cache read errors
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, cacheKey, hydrateLastResultFromBackend, hydrateLastResultFromCache]);

  const loadCurrentState = useCallback(async () => {
    setWeekdayLabel(formatWeekdayLabel());

    let city = profileCity?.trim() ?? "";
    if (authStatus === "authenticated" && userId) {
      try {
        const user = await getUserById(userId, accessToken);
        city = user.city?.trim() || city;
        setIsPremiumVerified(Boolean(user.isPremium));
      } catch {
        // Use local profile fallback when user document cannot be fetched.
      }
    } else {
      setIsPremiumVerified(false);
    }

    if (!city) {
      setPrayerTimeLabel("Vakit bilgisi yok");
      return;
    }

    try {
      const prayerTimes = await getPrayerTimesByCity(city);
      setPrayerTimeLabel(formatCurrentPrayerLabel(prayerTimes.times));
    } catch {
      setPrayerTimeLabel("Vakit bilgisi yok");
    }
  }, [accessToken, authStatus, profileCity, userId]);

  useEffect(() => {
    void loadCurrentState();
  }, [loadCurrentState]);

  const ensureCreditsAvailable = useCallback(async () => {
    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    const shouldRefresh = !creditsConfirmed || creditBalance <= 0;
    const state = shouldRefresh
      ? await refreshCredits()
      : { balance: creditBalance, isPremium: isPremium || isPremiumVerified };

    if (state.balance > 0 || state.isPremium) {
      return true;
    }

    onOpenPremiumSheet?.();
    return false;
  }, [
    authStatus,
    creditBalance,
    creditsConfirmed,
    isPremium,
    isPremiumVerified,
    onOpenPremiumSheet,
    refreshCredits,
    userId
  ]);

  const applyPrompt = (value: string) => {
    setIntentInput(value);
  };

  const onIntentInputChange = (value: string) => {
    setIntentInput(value);
  };

  const executeRecommendationRequest = useCallback(
    async (request: { freeText?: string; selectedCategory?: string; flowId: string }) => {
      setIsLoading(true);
      setLoadingStep("");
      setError(undefined);
      setOffTopicMessage(undefined);
      setClarification(undefined);

      const progressSocket = createAiProgressSocket();
      let socketId: string | undefined;
      try {
        socketId = await progressSocket.connect();
        progressSocket.onStep(({ message }) => setLoadingStep(message));
      } catch {
        // socket bağlanamazsa silent devam
      }

      try {
        if (authStatus !== "authenticated" || !userId) {
          setRecommendations([]);
          setIntentInput("");
          return;
        }

        const now = new Date();
        const response = await createAiRecommendation({
          userId,
          flowId: request.flowId,
          freeText: request.freeText,
          maxRecommendations: 3,
          socketId,
          selectedCategory: request.selectedCategory,
          timeContext: {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            isSpecialDay: false
          }
        }, accessToken);

        if (response.offTopic) {
          setOffTopicMessage(response.message);
          setRecommendations([]);
          setAssistantNote(undefined);
          setRecommendationId(undefined);
          setActiveFlowId(undefined);
          setIntentInput("");
          return;
        }

        if (response.needsClarification) {
          setClarification({
            message: response.message,
            suggestedCategories: response.suggestedCategories
          });
          setRecommendations([]);
          setAssistantNote(undefined);
          setRecommendationId(undefined);
          return;
        }

        setRecommendationId(response.recommendationId);
        const nextAssistantNote = response.reasoning?.trim() || undefined;
        const mappedItems = markFirstPrimary(
          response.items.map((item, index) => ({
            id: item.id,
            title: item.nameTurkish,
            chipEmoji: index === 0 ? "💆" : "✨",
            chipLabel: index === 0 ? "Senin için birincil öneri" : "Asistan önerisi",
            repeatLabel: index === 0 ? "Öncelikli" : undefined,
            arabic: item.nameArabic,
            transliteration: item.transliteration || item.nameTurkish,
            meaning: item.meaning,
            virtue: item.virtue,
            source: item.source,
            recommendedCount: item.recommendedCount
          }))
        );
        const normalizedPrompt = request.freeText?.trim() || "";
        setLastPrompt(normalizedPrompt);
        setAssistantNote(nextAssistantNote);
        setRecommendations(mappedItems);
        setHistoryItems((prev) => [
          {
            id: response.recommendationId,
            prompt: normalizedPrompt || "Genel öneri",
            assistantNote: nextAssistantNote,
            createdAt: new Date().toISOString(),
            recommendations: mappedItems
          },
          ...prev.filter((item) => item.id !== response.recommendationId)
        ]);
        setHistoryExpanded(false);

        if (cacheKey) {
          void AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              prompt: normalizedPrompt,
              assistantNote: nextAssistantNote,
              recommendationId: response.recommendationId,
              recommendations: mappedItems
            } satisfies LastAiGuideResult)
          ).catch(() => {
            // ignore cache write errors
          });
        }

        if (typeof response.remainingCredits === "number") {
          setCreditBalance(Math.max(0, Math.floor(response.remainingCredits)));
          setCreditsConfirmed(true);
        }

        setActiveFlowId(undefined);
        setIntentInput("");
      } catch (error) {
        if (
          error instanceof AiApiError &&
          (error.code === AI_CREDIT_INSUFFICIENT_CODE ||
            error.code === DAILY_LIMIT_REACHED_CODE)
        ) {
          setCreditBalance(0);
          setCreditsConfirmed(true);
          onOpenPremiumSheet?.();
        } else if (error instanceof AiApiError) {
          setError(error.message);
        } else {
          setError("Asistan önerisi alınamadı. Lütfen tekrar deneyin.");
        }
      } finally {
        progressSocket.disconnect();
        setIsLoading(false);
        setLoadingStep("");
      }
    },
    [accessToken, authStatus, cacheKey, onOpenPremiumSheet, userId]
  );

  const submitIntent = async () => {
    if (isLoading) {
      return;
    }

    Keyboard.dismiss();
    const flowId = createFlowId();
    setActiveFlowId(flowId);
    const request = { freeText: intentInput.trim() || undefined, flowId };

    if (!(await ensureCreditsAvailable())) {
      return;
    }

    await executeRecommendationRequest(request);
  };

  const submitClarificationCategory = async (category: string) => {
    if (isLoading) {
      return;
    }

    const flowId = activeFlowId || createFlowId();
    if (!activeFlowId) {
      setActiveFlowId(flowId);
    }

    const request = {
      freeText: intentInput.trim() || undefined,
      selectedCategory: category,
      flowId
    };

    if (!(await ensureCreditsAvailable())) {
      return;
    }

    await executeRecommendationRequest(request);
  };

  const selectRecommendation = (recommendation: AiGuideRecommendation) => {
    selectDhikr(
      recommendation.id,
      recommendationId
        ? {
            recommendationId,
            prompt: lastPrompt.trim() || "Genel öneri",
            assistantNote
          }
        : undefined
    );

    if (authStatus !== "authenticated" || !recommendationId) {
      return;
    }

    void selectAiRecommendation(recommendationId, recommendation.id, accessToken).catch((error) => {
      if (error instanceof AiApiError) {
        setError(error.message);
      }
    });
  };

  const visibleHistoryItems = useMemo(
    () => resolveVisibleAiGuideHistory(historyItems, isHistoryExpanded),
    [historyItems, isHistoryExpanded]
  );

  const openHistoryItem = (item: AiGuideHistoryItem) => {
    setRecommendationId(item.id);
    setLastPrompt(item.prompt === "Genel öneri" ? "" : item.prompt);
    setAssistantNote(item.assistantNote);
    setRecommendations(item.recommendations);
    setError(undefined);
  };

  const refresh = async () => {
    closeInfo();
    setIsRefreshing(true);
    try {
      await Promise.all([loadCurrentState(), refreshCredits()]);
    } finally {
      setIsRefreshing(false);
    }
  };

  return {
    prayerTimeLabel,
    weekdayLabel,
    intentInput,
    showInfo,
    isLoading,
    loadingStep,
    isRefreshing,
    error,
    offTopicMessage,
    clarification,
    submitClarificationCategory,
    recommendationId,
    lastPrompt,
    assistantNote,
    recommendations,
    historyItems,
    visibleHistoryItems,
    isHistoryExpanded,
    canExpandHistory: historyItems.length > 2,
    creditBalance,
    dailyGrant,
    monthlyGrant,
    closeInfo,
    toggleInfo,
    applyPrompt,
    onIntentInputChange,
    submitIntent,
    refresh,
    selectRecommendation,
    openHistoryItem,
    toggleHistoryExpanded: () => setHistoryExpanded((value) => !value)
  };
}

function markFirstPrimary(items: AiGuideRecommendation[]) {
  if (items.length === 0) {
    return items;
  }

  return items.map((item, index) => {
    if (index > 0) {
      return {
        ...item,
        isPrimary: false
      };
    }

    return {
      ...item,
      isPrimary: true
    };
  });
}

function createFlowId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
