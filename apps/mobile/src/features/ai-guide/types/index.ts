import type { LocalizedText } from "@zikirmatik/shared";

export type AiGuideRecommendation = {
  id: string;
  title?: string;
  chipEmoji: string;
  chipLabel: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  virtue?: string;
  source?: string;
  recommendedCount?: number;
  repeatLabel?: string;
  isPrimary?: boolean;
};

export type AiGuideHistoryItem = {
  id: string;
  prompt: string;
  assistantNote?: string;
  createdAt: string;
  recommendations: AiGuideRecommendation[];
};

/**
 * Dil-bağımlı alanların (name/transliteration/meaning/virtue/source) çözülmemiş
 * (LocalizedText) hâli. State ve AsyncStorage cache'inde bu şekilde tutulur;
 * ekranda gösterilecek `AiGuideRecommendation`e dönüşüm render anında, o anki
 * aktif dile göre yapılır — böylece dil değişince kart metinleri de güncellenir.
 */
export type AiGuideRecommendationRaw = {
  id: string;
  name?: LocalizedText | string;
  arabic: string;
  transliteration: LocalizedText | string;
  meaning: LocalizedText | string;
  virtue?: LocalizedText | string;
  source?: LocalizedText | string;
  recommendedCount?: number;
};

export type AiGuideHistoryItemRaw = {
  id: string;
  prompt: string;
  assistantNote?: string;
  createdAt: string;
  recommendations: AiGuideRecommendationRaw[];
};
