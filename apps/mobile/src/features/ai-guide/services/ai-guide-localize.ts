import { resolveLocalizedText } from "@zikirmatik/shared";
import type { AiGuideRecommendation, AiGuideRecommendationRaw } from "../types";

type Translate = (key: string) => string;

/**
 * RAW (LocalizedText) bir öneriyi ekranda gösterilecek çözülmüş stringlere
 * dönüştürür. Render anında, aktif dile göre çağrılır — dil değişince kart
 * metinleri yeniden fetch edilmeden güncellenir.
 */
export function resolveRecommendation(
  raw: AiGuideRecommendationRaw,
  index: number,
  locale: "tr" | "en",
  t: Translate
): AiGuideRecommendation {
  const resolvedName = raw.name ? resolveLocalizedText(raw.name, locale) : undefined;
  const resolvedTransliteration = resolveLocalizedText(raw.transliteration, locale);
  return {
    id: raw.id,
    title: resolvedName,
    chipEmoji: index === 0 ? "💆" : "✨",
    chipLabel:
      index === 0
        ? t("ai-guide:recommendation.chipLabelPrimary")
        : t("ai-guide:recommendation.chipLabelSecondary"),
    repeatLabel: index === 0 ? t("ai-guide:recommendation.repeatLabelPrimary") : undefined,
    arabic: raw.arabic,
    transliteration: resolvedTransliteration || resolvedName || "",
    meaning: resolveLocalizedText(raw.meaning, locale),
    virtue: raw.virtue ? resolveLocalizedText(raw.virtue, locale) : undefined,
    source: raw.source ? resolveLocalizedText(raw.source, locale) : undefined,
    recommendedCount: raw.recommendedCount,
    isPrimary: index === 0
  };
}
