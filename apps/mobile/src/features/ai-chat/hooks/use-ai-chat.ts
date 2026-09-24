// AI Sohbet ekranının kompozisyon kökü:
//   - use-chat-conversations.ts: sohbet listesi, aktif sohbet ve mesajları
//   - use-chat-stream.ts: SSE gönderimi, girdi, hata/503/kredi akışları
import { useCallback, useEffect, useMemo } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import type { AiSourceCitation, ChatCoverage, ChatMode } from "../types";
import { useChatConversations } from "./use-chat-conversations";
import { useChatStream } from "./use-chat-stream";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sourceCitations: AiSourceCitation[];
  mode?: ChatMode;
  coverage?: ChatCoverage;
};

export function useAiChat(onOpenPremiumSheet?: () => void) {
  const authStatus = useAuthStore((s) => s.status);
  const credits = useAiCredits({ onOpenPremiumSheet });
  const { refreshCredits } = credits;
  const conversation = useChatConversations();
  const { messages, loadConversation, clearConversation } = conversation;
  const stream = useChatStream({ ...conversation, credits, onOpenPremiumSheet });
  const { setError, setInputValue } = stream;

  useEffect(() => {
    void refreshCredits();
  }, [authStatus, refreshCredits]);

  const openConversation = useCallback(
    async (id: string) => {
      setError(undefined);
      const failure = await loadConversation(id);
      if (failure) {
        setError(failure);
      }
    },
    [loadConversation, setError]
  );

  // Not: akan bir isteği iptal etmez (mevcut davranış).
  const startNewConversation = useCallback(() => {
    clearConversation();
    setError(undefined);
    setInputValue("");
  }, [clearConversation, setError, setInputValue]);

  const resolvedMessages = useMemo<ChatMessage[]>(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        sourceCitations: m.sourceCitations ?? [],
        mode: m.mode,
        coverage: m.coverage
      })),
    [messages]
  );

  return {
    conversationId: conversation.conversationId,
    messages: resolvedMessages,
    conversations: conversation.conversations,
    inputValue: stream.inputValue,
    setInputValue,
    isSending: stream.isSending,
    isAwaitingFirstToken: stream.isAwaitingFirstToken,
    loadingStep: stream.loadingStep,
    error: stream.error,
    aiUnavailable: stream.aiUnavailable,
    retryLastMessage: stream.retryLastMessage,
    creditBalance: credits.creditBalance,
    sendMessage: stream.sendMessage,
    resumeAfterCreditPurchase: stream.resumeAfterCreditPurchase,
    openConversation,
    startNewConversation
  };
}
