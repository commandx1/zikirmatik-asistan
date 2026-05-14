import { useCallback, useEffect, useState } from "react";
import { Keyboard } from "react-native";
import { AI_GUIDE_RECOMMENDATIONS } from "../data";
import type { AiGuideRecommendation } from "../types";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { AiApiError, createAiRecommendation, selectAiRecommendation } from "../services/ai-api-client";
import { showRewardedAdGate } from "../services/rewarded-ad-gate";
import { useProfileStore } from "../../../store/profile-store";
import { getUserById } from "../../users/services/users-api-client";
import { getPrayerTimesByCity } from "../../prayer-times/services/prayer-times-api-client";
import { formatCurrentPrayerLabel, formatWeekdayLabel } from "../../../lib/prayer-time";

export function useAiGuide(initialMood = "Dengede") {
  const [selectedMood, setSelectedMood] = useState(initialMood);
  const [moodInput, setMoodInput] = useState("");
  const [showInfo, setShowInfo] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isRewardedSheetOpen, setRewardedSheetOpen] = useState(false);
  const [isRewardedRunning, setRewardedRunning] = useState(false);
  const [error, setError] = useState<string>();
  const [recommendationId, setRecommendationId] = useState<string>();
  const [recommendations, setRecommendations] = useState<AiGuideRecommendation[]>(AI_GUIDE_RECOMMENDATIONS);
  const [prayerTimeLabel, setPrayerTimeLabel] = useState("Vakit bilgisi yok");
  const [weekdayLabel, setWeekdayLabel] = useState(formatWeekdayLabel());
  const [pendingRequest, setPendingRequest] = useState<{ mood: string; freeText?: string } | null>(null);
  const [isPremiumVerified, setIsPremiumVerified] = useState(false);

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const profileCity = useProfileStore((s) => s.city);
  const isPremium = useProfileStore((s) => s.isPremium);
  const selectDhikr = useDhikrStore((s) => s.selectDhikr);

  const closeInfo = () => setShowInfo(false);
  const toggleInfo = () => setShowInfo((value) => !value);

  const loadCurrentState = useCallback(async () => {
    setWeekdayLabel(formatWeekdayLabel());

    let city = profileCity?.trim() ?? "";
    let userMood: string | undefined;

    if (authStatus === "authenticated" && userId) {
      try {
        const user = await getUserById(userId, accessToken);
        city = user.city?.trim() || city;
        userMood = normalizeMoodTitle(user.onboarding?.mood);
        setIsPremiumVerified(Boolean(user.isPremium));
      } catch {
        // Use local profile fallback when user document cannot be fetched.
      }
    } else {
      setIsPremiumVerified(false);
    }

    if (userMood) {
      setSelectedMood(userMood);
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
    setMoodInput(value);
  };

  const onMoodInputChange = (value: string) => {
    setMoodInput(value);
  };

  const executeRecommendationRequest = useCallback(
    async (request: { mood: string; freeText?: string }) => {
      setIsLoading(true);
      setError(undefined);

      try {
        if (authStatus !== "authenticated" || !userId) {
          setRecommendations(markFirstPrimary([...AI_GUIDE_RECOMMENDATIONS], "Misafir modunda varsayılan öneriler gösteriliyor."));
          setMoodInput("");
          return;
        }

        const now = new Date();
        const response = await createAiRecommendation({
          userId,
          mood: request.mood,
          freeText: request.freeText,
          maxRecommendations: 3,
          timeContext: {
            hour: now.getHours(),
            dayOfWeek: now.getDay(),
            isSpecialDay: false
          }
        });

        setRecommendationId(response.recommendationId);
        const nextMood = response.inferredMood?.trim();
        if (nextMood) {
          setSelectedMood(normalizeMoodTitle(nextMood) ?? nextMood);
        }
        setRecommendations(
          markFirstPrimary(
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
          )
        );
        setMoodInput("");
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
    [authStatus, userId]
  );

  const submitMood = async () => {
    const normalizedInput = moodInput.trim();
    const mood = selectedMood.trim() || normalizeMoodTitle(normalizedInput) || "Dengede";

    if (!mood || isLoading || isRewardedRunning) {
      return;
    }

    Keyboard.dismiss();
    const request = { mood, freeText: normalizedInput || undefined };

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

    void selectAiRecommendation(recommendationId, recommendation.id).catch((error) => {
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
    selectedMood,
    moodEmoji: toMoodEmoji(selectedMood),
    prayerTimeLabel,
    weekdayLabel,
    setSelectedMood,
    moodInput,
    showInfo,
    isLoading,
    isRewardedSheetOpen,
    isRewardedRunning,
    isRefreshing,
    error,
    recommendations,
    closeInfo,
    toggleInfo,
    applyPrompt,
    onMoodInputChange,
    submitMood,
    closeRewardedSheet,
    confirmRewardedAndSubmit,
    refresh,
    selectRecommendation
  };
}

function normalizeMoodTitle(value: string | undefined) {
  if (!value?.trim()) {
    return undefined;
  }

  const cleaned = value.trim().replace(/\s+/g, " ");
  return `${cleaned.charAt(0).toLocaleUpperCase("tr-TR")}${cleaned.slice(1).toLocaleLowerCase("tr-TR")}`;
}

function toMoodEmoji(mood: string) {
  const normalized = mood.toLocaleLowerCase("tr-TR");
  if (/(endiş|kayg|stres|gergin|panik|kork)/.test(normalized)) {
    return "😰";
  }
  if (/(yorgun|bitkin|uykusuz|tüken)/.test(normalized)) {
    return "🥱";
  }
  if (/(üzgün|hüzün|keder|mutsuz)/.test(normalized)) {
    return "😔";
  }
  if (/(öfke|kızgın|sinir)/.test(normalized)) {
    return "😤";
  }
  if (/(kararsız|belirsiz|dağınık)/.test(normalized)) {
    return "🤔";
  }
  if (/(mutlu|neşeli|şük|heyecan)/.test(normalized)) {
    return "😊";
  }
  if (/(huzur|sakin|dingin|rahat)/.test(normalized)) {
    return "😌";
  }
  return "🫶";
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
