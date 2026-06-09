export type AiGuideRecommendation = {
  id: string;
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
