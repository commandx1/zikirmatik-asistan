export type ChatMessageRole = "user" | "assistant";

/**
 * "kaynak" modunda cevaba eşlik eden kaynak/sayfa referansı — bkz.
 * apps/api/src/modules/ai-chat/ai-chat.service.ts AiSourceCitation.
 * Yalnızca mode === "bilgi" olan assistant mesajlarında dolu gelir.
 */
export type AiSourceCitation = {
  sourceId: string;
  sourceTitle: string;
  pageStart: number;
  pageEnd: number;
};

export type ChatMessageRaw = {
  id: string;
  conversationId: string;
  role: ChatMessageRole;
  content: string;
  usedModel?: string;
  createdAt: string;
  sourceCitations?: AiSourceCitation[];
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  status: string;
};
