import type { LocalizedText } from "@zikirmatik/shared";
import type { ZikirItem } from "../../focus/types";
import type { AiGuideRecommendation } from "../types";

const text = (value: string): LocalizedText => ({ tr: value, en: value });

/**
 * Options for dhikr-store.selectDhikr when an AI recommendation is started:
 * - M-06: the recommended target applies only on a fresh start ("Sıfırdan başla");
 *   "Kaldığı yerden" keeps the dhikr's current target.
 * - B-26: a dhikr missing from the local catalog is added from the recommendation
 *   itself instead of the start being a silent no-op.
 */
export function buildRecommendationStart(
  recommendation: AiGuideRecommendation,
  fresh: boolean,
  notStartedLabel: string
): { fallback: ZikirItem; target?: number } {
  const recommended = recommendation.recommendedCount ?? 0;
  return {
    fallback: {
      id: recommendation.id,
      source: "ready",
      name: text(recommendation.title ?? recommendation.transliteration),
      arabic: recommendation.arabic,
      transliteration: text(recommendation.transliteration),
      meaning: text(recommendation.meaning),
      virtue: recommendation.virtue ? text(recommendation.virtue) : undefined,
      contentSource: recommendation.source ? text(recommendation.source) : undefined,
      current: 0,
      target: recommended > 0 ? recommended : 33,
      lastActivityLabel: notStartedLabel,
      streakDays: 0,
      isFavorite: false
    },
    ...(fresh && recommended > 0 ? { target: recommended } : {})
  };
}
