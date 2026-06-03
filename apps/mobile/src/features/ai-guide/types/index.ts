export type AiGuideRecommendation = {
  id: string;
  chipEmoji: string;
  chipLabel: string;
  arabic: string;
  transliteration: string;
  meaning: string;
  repeatLabel?: string;
  note?: string;
  isPrimary?: boolean;
};

export type AiGuideHistoryItem = {
  id: string;
  prompt: string;
  createdAt: string;
  recommendations: AiGuideRecommendation[];
};
