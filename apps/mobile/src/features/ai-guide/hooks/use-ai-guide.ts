import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
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
import { i18n } from "../../../i18n";
import { toIntlLocale } from "../../../lib/locale-format";

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

type PendingAiRequest = {
  freeText?: string;
  selectedCategory?: string;
  flowId: string;
};

/**
 * AI API çağrısını çalıştırır; 401 alınırsa oturumu bir kez yenileyip
 * taze access token ile isteği tekrar dener. Refresh başarısızsa veya
 * token değişmediyse orijinal hata fırlatılır.
 */
async function callWithAuthRetry<T>(call: (accessToken?: string) => Promise<T>): Promise<T> {
  const initialToken = useAuthStore.getState().session?.accessToken;

  try {
    return await call(initialToken);
  } catch (error) {
    if (!(error instanceof AiApiError) || error.status !== 401) {
      throw error;
    }

    await useAuthStore.getState().refreshAuthenticatedSession();

    const refreshedToken = useAuthStore.getState().session?.accessToken;
    if (!refreshedToken || refreshedToken === initialToken) {
      throw error;
    }

    return call(refreshedToken);
  }
}

export function useAiGuide(onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-guide");
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
  const [weekdayLabel, setWeekdayLabel] = useState(formatWeekdayLabel());
  const [isPremiumVerified, setIsPremiumVerified] = useState(false);
  const [creditBalance, setCreditBalance] = useState(0);
  const [dailyGrant, setDailyGrant] = useState(1);
  const [monthlyGrant, setMonthlyGrant] = useState(0);
  const [creditsConfirmed, setCreditsConfirmed] = useState(false);
  const [activeFlowId, setActiveFlowId] = useState<string>();
  const [loadingStep, setLoadingStep] = useState("");
  const [postPurchaseNotice, setPostPurchaseNotice] = useState<string>();
  const pendingRequestRef = useRef<PendingAiRequest | null>(null);

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
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
      const credits = await callWithAuthRetry((token) => getAiCredits(token));
      setCreditBalance(Math.max(0, Math.floor(credits.balance)));
      setDailyGrant(Math.max(0, Math.floor(credits.dailyGrant)));
      setMonthlyGrant(Math.max(0, Math.floor(credits.monthlyGrant)));
      setIsPremiumVerified(Boolean(credits.isPremium));
      setCreditsConfirmed(true);
      return { balance: credits.balance, isPremium: credits.isPremium };
    } catch {
      const quota = await callWithAuthRetry((token) => getAiDailyQuota(token));
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
              prompt: parsed.prompt?.trim() || t("ai-guide:genericPrompt"),
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
      callWithAuthRetry((token) => listAiRecommendations(token)),
      listVerifiedActiveDhikrs(),
    ]);
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

    if (authStatus === "authenticated" && userId) {
      try {
        const user = await getUserById(userId, accessToken);
        setIsPremiumVerified(Boolean(user.isPremium));
      } catch {
        // Keep existing state when user document cannot be fetched.
      }
    } else {
      setIsPremiumVerified(false);
    }
  }, [accessToken, authStatus, userId]);

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
    setPostPurchaseNotice(undefined);
  };

  const executeRecommendationRequest = useCallback(
    async (request: PendingAiRequest) => {
      pendingRequestRef.current = null;
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
        const response = await callWithAuthRetry((token) =>
          createAiRecommendation({
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
          }, token)
        );

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
            chipLabel: index === 0 ? t("ai-guide:recommendation.chipLabelPrimary") : t("ai-guide:recommendation.chipLabelSecondary"),
            repeatLabel: index === 0 ? t("ai-guide:recommendation.repeatLabelPrimary") : undefined,
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
            prompt: normalizedPrompt || t("ai-guide:genericPrompt"),
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
          pendingRequestRef.current = request;
          onOpenPremiumSheet?.();
        } else if (error instanceof AiApiError) {
          setError(error.message);
        } else {
          setError(t("ai-guide:errors.recommendationFailed"));
        }
      } finally {
        progressSocket.disconnect();
        setIsLoading(false);
        setLoadingStep("");
      }
    },
    [accessToken, authStatus, cacheKey, onOpenPremiumSheet, userId, t]
  );

  const submitIntent = async () => {
    if (isLoading) {
      return;
    }

    Keyboard.dismiss();
    setPostPurchaseNotice(undefined);
    const flowId = createFlowId();
    setActiveFlowId(flowId);
    const request = { freeText: intentInput.trim() || undefined, flowId };

    if (!(await ensureCreditsAvailable())) {
      pendingRequestRef.current = request;
      return;
    }

    await executeRecommendationRequest(request);
  };

  const submitClarificationCategory = async (category: string) => {
    if (isLoading) {
      return;
    }

    setPostPurchaseNotice(undefined);
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

    const MAX_ATTEMPTS = 8;
    const POLL_INTERVAL_MS = 2000;

    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }

        const state = await refreshCredits();
        if (state.balance > 0 || state.isPremium) {
          const request =
            pendingRequestRef.current ??
            (intentInput.trim()
              ? { freeText: intentInput.trim(), flowId: activeFlowId || createFlowId() }
              : null);
          pendingRequestRef.current = null;

          if (!request) {
            setIsLoading(false);
            setLoadingStep("");
            return;
          }

          setIsLoading(false);
          setLoadingStep("");
          await executeRecommendationRequest(request);
          return;
        }
      }

      setIsLoading(false);
      setLoadingStep("");
      setPostPurchaseNotice(t("ai-guide:loading.creditsLoadingRetry"));
    } catch {
      setIsLoading(false);
      setLoadingStep("");
      setPostPurchaseNotice(t("ai-guide:loading.creditsLoadingRetry"));
    }
  };

  const selectRecommendation = (recommendation: AiGuideRecommendation) => {
    selectDhikr(
      recommendation.id,
      recommendationId
        ? {
            recommendationId,
            prompt: lastPrompt.trim() || t("ai-guide:genericPrompt"),
            assistantNote
          }
        : undefined
    );

    if (authStatus !== "authenticated" || !recommendationId) {
      return;
    }

    void callWithAuthRetry((token) => selectAiRecommendation(recommendationId, recommendation.id, token)).catch((error) => {
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
    setLastPrompt(item.prompt === t("ai-guide:genericPrompt") ? "" : item.prompt);
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
    weekdayLabel,
    intentInput,
    showInfo,
    isLoading,
    loadingStep,
    isRefreshing,
    error,
    postPurchaseNotice,
    resumeAfterCreditPurchase,
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

function formatWeekdayLabel(date: Date = new Date()) {
  const locale = toIntlLocale(useProfileStore.getState().locale);
  const day = new Intl.DateTimeFormat(locale, { weekday: "long" }).format(date);
  return i18n.t("ai-guide:weekday.label", { day: capitalize(day, locale) });
}

function capitalize(value: string, locale: string) {
  if (!value) {
    return value;
  }

  return `${value.charAt(0).toLocaleUpperCase(locale)}${value.slice(1)}`;
}

function createFlowId() {
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === "x" ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}
