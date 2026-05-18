import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { AiGuideRecommendation } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { AiApiError, createAiRecommendation, selectAiRecommendation } from "../services/ai-api-client";
import { showRewardedAdGate } from "../services/rewarded-ad-gate";
import { useProfileStore } from "../../../store/profile-store";
import { getUserById } from "../../users/services/users-api-client";
import { getPrayerTimesByCity } from "../../prayer-times/services/prayer-times-api-client";
import { formatCurrentPrayerLabel, formatWeekdayLabel } from "../../../lib/prayer-time";

type LastAiGuideResult = {
  prompt: string;
  recommendationId?: string;
  recommendations: AiGuideRecommendation[];
};

export function useAiGuide() {
  const [intentInput, setIntentInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRewardedSheetOpen, setRewardedSheetOpen] = useState(false);
  const [isRewardedRunning, setRewardedRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [recommendationId, setRecommendationId] = useState<string>();
  const [recommendations, setRecommendations] = useState<AiGuideRecommendation[]>([]);
  const [lastPrompt, setLastPrompt] = useState("");
  const [prayerTimeLabel, setPrayerTimeLabel] = useState("Vakit bilgisi yok");
  const [weekdayLabel, setWeekdayLabel] = useState(formatWeekdayLabel());
  const [pendingRequest, setPendingRequest] = useState<{ freeText?: string } | null>(null);
  const [isPremiumVerified, setIsPremiumVerified] = useState(false);

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const profileCity = useProfileStore((s) => s.city);
  const isPremium = useProfileStore((s) => s.isPremium);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);

  const closeInfo = () => setShowInfo(false);
  const toggleInfo = () => setShowInfo((value) => !value);

  const cacheKey = userId ? `ai-guide:last:${userId}` : "";

  useEffect(() => {
    if (authStatus !== "authenticated" || !cacheKey) {
      return;
    }

    let isCancelled = false;
    void AsyncStorage.getItem(cacheKey)
      .then((raw) => {
        if (isCancelled || !raw) {
          return;
        }

        const parsed = JSON.parse(raw) as LastAiGuideResult;
        if (!parsed || !Array.isArray(parsed.recommendations)) {
          return;
        }

        setLastPrompt(parsed.prompt || "");
        setRecommendationId(parsed.recommendationId);
        setRecommendations(parsed.recommendations);
      })
      .catch(() => {
        // ignore cache read errors
      });

    return () => {
      isCancelled = true;
    };
  }, [authStatus, cacheKey]);

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

  const shouldBypassRewardGate = useCallback(async () => {
    if (isPremium || isPremiumVerified) {
      return true;
    }

    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    try {
      const user = await getUserById(userId, accessToken);
      const premium = Boolean(user.isPremium);
      setIsPremiumVerified(premium);
      return premium;
    } catch {
      return false;
    }
  }, [accessToken, authStatus, isPremium, isPremiumVerified, userId]);

  const applyPrompt = (value: string) => {
    setIntentInput(value);
  };

  const onIntentInputChange = (value: string) => {
    setIntentInput(value);
  };

  const executeRecommendationRequest = useCallback(
    async (request: { freeText?: string }) => {
      setIsLoading(true);
      setError(undefined);

      try {
        if (authStatus !== "authenticated" || !userId) {
          setRecommendations([]);
          setIntentInput("");
          return;
        }

        const now = new Date();
        const response = await createAiRecommendation({
          userId,
          freeText: request.freeText,
          maxRecommendations: 3,
          timeContext: {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            isSpecialDay: false
          }
        }, accessToken);

        setRecommendationId(response.recommendationId);
        const mappedItems = markFirstPrimary(
          response.items.map((item, index) => ({
            id: item.id,
            chipEmoji: index === 0 ? "💆" : "✨",
            chipLabel: index === 0 ? "Senin için birincil öneri" : "Asistan önerisi",
            repeatLabel: index === 0 ? "Öncelikli" : undefined,
            arabic: item.nameArabic,
            transliteration: item.transliteration || item.nameTurkish,
            meaning: item.meaning
          })),
          response.reasoning
        );
        const normalizedPrompt = request.freeText?.trim() || "";
        setLastPrompt(normalizedPrompt);
        setRecommendations(mappedItems);

        if (cacheKey) {
          void AsyncStorage.setItem(
            cacheKey,
            JSON.stringify({
              prompt: normalizedPrompt,
              recommendationId: response.recommendationId,
              recommendations: mappedItems
            } satisfies LastAiGuideResult)
          ).catch(() => {
            // ignore cache write errors
          });
        }
        setIntentInput("");
      } catch (error) {
        if (error instanceof AiApiError) {
          setError(error.message);
        } else {
          setError("Asistan önerisi alınamadı. Lütfen tekrar deneyin.");
        }
      } finally {
        setIsLoading(false);
      }
    },
    [accessToken, authStatus, cacheKey, userId]
  );

  const submitIntent = async () => {
    const normalizedInput = intentInput.trim();
    if (isLoading || isRewardedRunning) {
      return;
    }

    Keyboard.dismiss();
    const request = { freeText: normalizedInput || undefined };

    if (await shouldBypassRewardGate()) {
      await executeRecommendationRequest(request);
      return;
    }

    setPendingRequest(request);
    setRewardedSheetOpen(true);
  };

  const closeRewardedSheet = () => {
    if (isRewardedRunning) {
      return;
    }

    setRewardedSheetOpen(false);
    setPendingRequest(null);
  };

  const confirmRewardedAndSubmit = async () => {
    if (!pendingRequest || isRewardedRunning) {
      return;
    }

    const request = pendingRequest;
    setRewardedRunning(true);
    setError(undefined);
    try {
      const isRewardEarned = await showRewardedAdGate();
      if (!isRewardEarned) {
        setError("Öneriyi açmak için ödüllü reklam tamamlanmalı. Lütfen tekrar dene.");
        return;
      }

      setRewardedSheetOpen(false);
      setPendingRequest(null);
      await executeRecommendationRequest(request);
    } finally {
      setRewardedRunning(false);
    }
  };

  const selectRecommendation = (recommendation: AiGuideRecommendation) => {
    selectDhikr(recommendation.id);

    if (authStatus !== "authenticated" || !recommendationId) {
      return;
    }

    void selectAiRecommendation(recommendationId, recommendation.id, accessToken).catch((error) => {
      if (error instanceof AiApiError) {
        setError(error.message);
      }
    });
  };

  const refresh = async () => {
    closeInfo();
    setIsRefreshing(true);
    try {
      await loadCurrentState();
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
    isRewardedSheetOpen,
    isRewardedRunning,
    isRefreshing,
    error,
    lastPrompt,
    recommendations,
    closeInfo,
    toggleInfo,
    applyPrompt,
    onIntentInputChange,
    submitIntent,
    closeRewardedSheet,
    confirmRewardedAndSubmit,
    refresh,
    selectRecommendation
  };
}

function markFirstPrimary(items: AiGuideRecommendation[], primaryNote?: string) {
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
      isPrimary: true,
      note: primaryNote ?? item.note
    };
  });
}
