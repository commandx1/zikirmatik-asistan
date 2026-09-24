// Sohbet listesi ve aktif sohbetin mesajları: liste (1. sayfa, 20), açma
// (1. sayfa, 50) ve sıfırlama. Hata mesajı çağırana döndürülür; ekrandaki
// ortak `error` durumu use-chat-stream.ts'tedir.
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { AiChatApiError, listChatConversations, listChatMessages } from "../services/ai-chat-api-client";
import type { ChatConversationSummary, ChatMessageRaw } from "../types";

export function useChatConversations() {
  const { t } = useTranslation("ai-chat");
  const authStatus = useAuthStore((s) => s.status);

  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessageRaw[]>([]);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);

  const loadConversations = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setConversations([]);
      return;
    }

    try {
      const response = await listChatConversations(1, 20);
      setConversations(response.items);
    } catch {
      // sessizce yok say — sohbet ekranı geçmiş olmadan da çalışır
    }
  }, [authStatus]);

  // Yalnızca authStatus değiştiğinde tetiklenir (loadConversations yalnızca ona bağlı).
  useEffect(() => {
    void loadConversations();
  }, [loadConversations]);

  /** Aktif sohbeti değiştirir ve mesajlarını yükler; hata varsa mesajını döndürür. */
  const loadConversation = useCallback(
    async (id: string): Promise<string | undefined> => {
      setConversationId(id);
      try {
        const response = await listChatMessages(id, 1, 50);
        setMessages(response.items);
        return undefined;
      } catch (err) {
        return err instanceof AiChatApiError ? err.message : t("ai-chat:errors.historyFailed");
      }
    },
    [t]
  );

  const clearConversation = useCallback(() => {
    setConversationId(undefined);
    setMessages([]);
  }, []);

  /** Yeni oluşan sohbeti listenin başına koyar (aynı id varsa yerine). */
  const prependConversation = useCallback((summary: ChatConversationSummary) => {
    setConversations((prev) => [summary, ...prev.filter((c) => c.id !== summary.id)]);
  }, []);

  return {
    conversationId,
    setConversationId,
    messages,
    setMessages,
    conversations,
    loadConversation,
    clearConversation,
    prependConversation
  };
}
