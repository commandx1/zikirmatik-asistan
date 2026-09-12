export type ChatMessageRole = "user" | "assistant";

/**
 * "chat" serbest sohbet, "bilgi" kaynaklara dayalı bilgi cevabı —
 * bkz. apps/api/src/modules/ai-chat/ai-chat.service.ts.
 */
export type ChatMode = "chat" | "bilgi";

/**
 * "bilgi" modundaki cevabın kaynaklarla ne kadar örtüştüğü. Yalnızca
 * mode === "bilgi" olan assistant mesajlarında anlamlıdır.
 */
export type ChatCoverage = "full" | "partial" | "none";

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
  mode?: ChatMode;
  coverage?: ChatCoverage;
};

export type ChatConversationSummary = {
  id: string;
  title: string;
  lastMessageAt: string;
  status: string;
};
