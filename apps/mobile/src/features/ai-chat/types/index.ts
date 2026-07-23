import type { LocalizedText } from "@zikirmatik/shared";

/**
 * Öneri kartı verisi — backend `finalizeRecommendation` item şekliyle aynı
 * (bkz. apps/api/src/modules/ai-chat/ai-chat.service.ts loadDhikrCards).
 * Dil-bağımlı alanlar RAW (LocalizedText) saklanır; ekrana basılacak
 * çözülmüş metinler render anında aktif dile göre üretilir (ai-guide
 * deseniyle aynı — bkz. features/ai-guide/hooks/use-ai-guide.ts).
 */
export type ChatDhikrCardRaw = {
  id: string;
  name?: LocalizedText | string;
  nameArabic: string;
  transliteration: LocalizedText | string;
  meaning: LocalizedText | string;
  virtue?: LocalizedText | string;
  source?: LocalizedText | string;
  recommendedCount?: number;
};

export type ChatMessageRole = "user" | "assistant";

export type ChatMessageRaw = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  usedModel?: string;
  createdAt: string;
  recommendedDhikrs: ChatDhikrCardRaw[];
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  status: string;
};
