import AsyncStorage from "@react-native-async-storage/async-storage";
import { useCallback, useEffect, useRef, useState } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { createAiRecommendation } from "../../ai-guide/services/ai-api-client";

type TimeSlot = "sabah" | "ogle" | "ikindi" | "aksam" | "gece";

export type HomeRecommendation = {
  text: string;
  recommendedDhikrId?: string;
  recommendedDhikrName?: string;
};

type UseHomeRecommendationResult = {
  recommendation: HomeRecommendation;
  requestRecommendation: () => Promise<void>;
};

const DAILY_CACHE = new Map<string, HomeRecommendation>();
const DAILY_STORAGE_PREFIX = "home-recommendation";
const IDLE_TEXT = "Günlük öneriyi görmek için soru işaretine dokun.";
const LOADING_TEXT = "Sana uygun öneri hazırlanıyor...";

export function useHomeRecommendation(): UseHomeRecommendationResult {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const onboardingMood = useOnboardingStore((s) => s.mood);
  const [recommendation, setRecommendation] = useState<HomeRecommendation>({
    text: IDLE_TEXT
  });

  const inflightKeyRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    setRecommendation({ text: IDLE_TEXT });
    inflightKeyRef.current = undefined;
  }, [authStatus, userId]);

  const requestRecommendation = useCallback(async () => {
    const now = new Date();
    const slot = resolveTimeSlot(now.getHours());
    if (authStatus !== "authenticated" || !userId) {
      const fallback = fallbackRecommendation(slot);
      setRecommendation(fallback);
      return;
    }

    const dayToken = toMonthDayKey(now);
    const cacheKey = `${userId}-${dayToken}`;
    const storageKey = `${DAILY_STORAGE_PREFIX}:${cacheKey}`;

    const memoryCached = DAILY_CACHE.get(cacheKey);
    if (memoryCached) {
      setRecommendation(memoryCached);
      return;
    }

    try {
      const stored = await AsyncStorage.getItem(storageKey);
      if (stored) {
        const parsed = safeParseRecommendation(stored);
        if (parsed) {
          DAILY_CACHE.set(cacheKey, parsed);
          setRecommendation(parsed);
          return;
        }
      }
    } catch {
      // Ignore read failures and continue with live request.
    }

    if (inflightKeyRef.current === cacheKey) {
      return;
    }

    setRecommendation({ text: LOADING_TEXT });
    inflightKeyRef.current = cacheKey;
    try {
      const mood = resolveMoodForRequest(onboardingMood, slot);
      const response = await createAiRecommendation({
        userId,
        mood,
        freeText: freeTextForSlot(slot),
        maxRecommendations: 1,
        timeContext: {
          hour: now.getHours(),
          dayOfWeek: now.getDay(),
          isSpecialDay: false
        }
      });

      const first = response.items[0];
      const text = first
        ? `${slotLabel(slot)} için öneri: ${first.nameTurkish}. ${response.reasoning}`
        : `${slotLabel(slot)} için öneri: ${response.reasoning}`;

      const nextRecommendation: HomeRecommendation = {
        text,
        recommendedDhikrId: first?.id,
        recommendedDhikrName: first?.nameTurkish ?? first?.transliteration
      };

      DAILY_CACHE.set(cacheKey, nextRecommendation);
      void AsyncStorage.setItem(storageKey, JSON.stringify(nextRecommendation));
      setRecommendation(nextRecommendation);
    } catch {
      const fallback = fallbackRecommendation(slot);
      DAILY_CACHE.set(cacheKey, fallback);
      void AsyncStorage.setItem(storageKey, JSON.stringify(fallback));
      setRecommendation(fallback);
    } finally {
      if (inflightKeyRef.current === cacheKey) {
        inflightKeyRef.current = undefined;
      }
    }
  }, [authStatus, onboardingMood, userId]);

  return {
    recommendation,
    requestRecommendation
  };
}

function resolveTimeSlot(hour: number): TimeSlot {
  if (hour < 4) {
    return "gece";
  }
  if (hour < 10) {
    return "sabah";
  }
  if (hour < 14) {
    return "ogle";
  }
  if (hour < 17) {
    return "ikindi";
  }
  if (hour < 20) {
    return "aksam";
  }
  return "gece";
}

function moodForSlot(slot: TimeSlot) {
  switch (slot) {
    case "sabah":
      return "Huzurlu";
    case "ogle":
      return "Odaklanmak istiyorum";
    case "ikindi":
      return "Yorgun";
    case "aksam":
      return "Şükür";
    default:
      return "Sakinleşmek istiyorum";
  }
}

function resolveMoodForRequest(onboardingMood: string, slot: TimeSlot) {
  switch (onboardingMood) {
    case "uzgun":
      return "Üzgün";
    case "stresli":
      return "Stresli";
    case "notr":
      return "Nötr";
    case "huzurlu":
      return "Huzurlu";
    case "minnettar":
      return "Minnettar";
    case "yorgun":
      return "Yorgun";
    case "kaygili":
      return "Kaygılı";
    case "mutlu":
      return "Mutlu";
    case "yalniz":
      return "Yalnız";
    case "ofkeli":
      return "Öfkeli";
    case "umutsuz":
      return "Umutsuz";
    case "heyecanli":
      return "Heyecanlı";
    default:
      return moodForSlot(slot);
  }
}

function freeTextForSlot(slot: TimeSlot) {
  return `${slotLabel(slot)} vakti için kısa, uygulanabilir zikir önerisi ver.`;
}

function slotLabel(slot: TimeSlot) {
  switch (slot) {
    case "sabah":
      return "Sabah";
    case "ogle":
      return "Öğle";
    case "ikindi":
      return "İkindi";
    case "aksam":
      return "Akşam";
    default:
      return "Gece";
  }
}

function fallbackRecommendation(slot: TimeSlot): HomeRecommendation {
  switch (slot) {
    case "sabah":
      return {
        text: "Sabah vaktine uygun öneri: Estağfirullah ile güne sakin bir başlangıç yap.",
        recommendedDhikrName: "Estağfirullah"
      };
    case "ogle":
      return {
        text: "Öğle vaktine uygun öneri: Elhamdülillah ile şükür odağını tazele.",
        recommendedDhikrName: "Elhamdülillah"
      };
    case "ikindi":
      return {
        text: "İkindi vaktine uygun öneri: La havle vela kuvvete illa بالله ile yorgunlukta güç topla.",
        recommendedDhikrName: "La havle vela kuvvete illa بالله"
      };
    case "aksam":
      return {
        text: "Akşam vaktine uygun öneri: Sübhanallahi ve bihamdihi ile günü tamamla.",
        recommendedDhikrName: "Sübhanallahi ve bihamdihi"
      };
    default:
      return {
        text: "Gece vaktine uygun öneri: La ilahe illallah ile kalbi sakinleştir.",
        recommendedDhikrName: "La ilahe illallah"
      };
  }
}

function toMonthDayKey(value: Date) {
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${month}${day}`;
}

function safeParseRecommendation(raw: string): HomeRecommendation | null {
  try {
    const parsed = JSON.parse(raw) as HomeRecommendation;
    if (!parsed || typeof parsed !== "object" || typeof parsed.text !== "string") {
      return null;
    }
    return {
      text: parsed.text,
      recommendedDhikrId: parsed.recommendedDhikrId,
      recommendedDhikrName: parsed.recommendedDhikrName
    };
  } catch {
    return null;
  }
}
