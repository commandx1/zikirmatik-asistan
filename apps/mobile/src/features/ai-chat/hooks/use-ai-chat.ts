import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { createAiProgressSocket } from "../../ai-guide/services/ai-progress-socket";
import {
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  AiChatApiError,
  listChatConversations,
  listChatMessages,
  streamChatMessage,
  streamCreateConversation,
  type ChatStreamHandlers
} from "../services/ai-chat-api-client";
import type { AiSourceCitation, ChatConversationSummary, ChatCoverage, ChatMessageRaw, ChatMode } from "../types";
import { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sourceCitations: AiSourceCitation[];
  mode?: ChatMode;
  coverage?: ChatCoverage;
};

type AiUnavailableState = {
  message: string;
};

export function useAiChat(onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-chat");
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const locale = useProfileStore((s) => s.locale) as "tr" | "en";

  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessageRaw[]>([]);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Token akışı başlayana kadar true — TypingIndicator bu süre boyunca
  // gösterilir, ilk token gelince (veya stream boş dönerse) kapanır ve
  // yerini kısmen dolan mesaj balonu alır.
  const [isAwaitingFirstToken, setIsAwaitingFirstToken] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string>();
  const [aiUnavailable, setAiUnavailable] = useState<AiUnavailableState | null>(null);
  const {
    creditBalance,
    refreshCredits,
    ensureCreditsAvailable,
    applyRemainingCredits,
    markInsufficient,
    waitForCredits
  } = useAiCredits({ onOpenPremiumSheet });
  const pendingMessageRef = useRef<string>("");
  // AI_UNAVAILABLE alındığında son gönderilen metni burada saklarız —
  // kredi düşülmediği/hiçbir şey kalıcılaştırılmadığı için pendingMessageRef'ten
  // (kredi satın alma sonrası devam akışı) ayrı tutulur.
  const aiUnavailableMessageRef = useRef<string>("");
  const streamAbortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

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

  useEffect(() => {
    void loadConversations();
    void refreshCredits();
    // Yalnızca authStatus değiştiğinde tetiklenir: loadConversations yalnızca
    // authStatus'a bağlı, refreshCredits kimliği sabit (useStableCallback).
  }, [authStatus, loadConversations, refreshCredits]);

  const openConversation = useCallback(
    async (id: string) => {
      setError(undefined);
      setConversationId(id);
      try {
        const response = await listChatMessages(id, 1, 50);
        setMessages(response.items);
      } catch (err) {
        setError(err instanceof AiChatApiError ? err.message : t("ai-chat:errors.historyFailed"));
      }
    },
    [t]
  );

  const startNewConversation = useCallback(() => {
    setConversationId(undefined);
    setMessages([]);
    setError(undefined);
    setInputValue("");
  }, []);

  const runSend = useCallback(
    async (text: string) => {
      pendingMessageRef.current = "";
      setIsSending(true);
      setIsAwaitingFirstToken(true);
      setLoadingStep("");
      setError(undefined);
      setAiUnavailable(null);

      const progressSocket = createAiProgressSocket();
      let socketId: string | undefined;
      try {
        socketId = await progressSocket.connect();
        progressSocket.onChatStep(({ key }) =>
          setLoadingStep(
            t(`ai-chat:loading.steps.${key}`, { defaultValue: t("ai-chat:loading.defaultStep") })
          )
        );
      } catch {
        // socket bağlanamazsa silent devam
      }

      const isNewConversation = !conversationId;
      const activeConversationId = conversationId;

      const optimisticUserMessage: ChatMessageRaw = {
        id: `optimistic-${Date.now()}`,
        conversationId: activeConversationId ?? "",
        role: "user",
        content: text,
        createdAt: new Date().toISOString()
      };
      const streamingAssistantId = `streaming-${Date.now()}`;
      let streamingStarted = false;

      setMessages((prev) => [...prev, optimisticUserMessage]);
      setInputValue("");

      const abortController = new AbortController();
      streamAbortRef.current = abortController;

      const handlers: ChatStreamHandlers = {
        onToken: (delta) => {
          if (!streamingStarted) {
            streamingStarted = true;
            setIsAwaitingFirstToken(false);
            setMessages((prev) => [
              ...prev,
              {
                id: streamingAssistantId,
                conversationId: activeConversationId ?? "",
                role: "assistant",
                content: "",
                createdAt: new Date().toISOString()
              }
            ]);
          }
          setMessages((prev) =>
            prev.map((m) => (m.id === streamingAssistantId ? { ...m, content: m.content + delta } : m))
          );
        },
        onDone: (payload) => {
          if (isNewConversation) {
            setConversationId(payload.conversationId);
            if (payload.conversation) {
              const conv = payload.conversation;
              setConversations((prev) => [
                {
                  id: payload.conversationId,
                  title: conv.title,
                  lastMessageAt: conv.lastMessageAt,
                  status: conv.status
                },
                ...prev.filter((c) => c.id !== payload.conversationId)
              ]);
            }
          }

          setMessages((prev) =>
            prev.map((m) => {
              if (m.id === optimisticUserMessage.id) return payload.userMessage;
              if (m.id === streamingAssistantId) {
                return {
                  ...m,
                  id: payload.messageId,
                  // `content` nihai/otoriter metindir — geldiğinde akış
                  // sırasında biriken metnin yerine geçer; gelmezse akıştan
                  // birikeni koru.
                  content: typeof payload.content === "string" && payload.content.length > 0 ? payload.content : m.content,
                  sourceCitations: payload.sourceCitations ?? [],
                  mode: payload.mode,
                  coverage: payload.coverage
                };
              }
              return m;
            })
          );

          applyRemainingCredits(payload.remainingCredits);
        },
        onError: (payload) => {
          // Akış zaten başlamıştı (bkz. ChatStreamMidwayError backend'de) —
          // event: error'ı normal bir hata olarak işlemek için throw ediyoruz,
          // dıştaki catch bloğu optimistic/streaming mesajları temizler.
          throw new AiChatApiError("transient", payload.message, undefined, payload.code);
        }
      };

      try {
        if (authStatus !== "authenticated" || !userId) {
          return;
        }

        const accessToken = useAuthStore.getState().session?.accessToken;
        if (!activeConversationId) {
          await streamCreateConversation({ firstMessage: text, locale, socketId }, accessToken, handlers, abortController.signal);
        } else {
          await streamChatMessage(activeConversationId, { message: text, socketId }, accessToken, handlers, abortController.signal);
        }
      } catch (err) {
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticUserMessage.id && m.id !== streamingAssistantId)
        );

        if (err instanceof AiChatApiError && err.code === AI_CREDIT_INSUFFICIENT_CODE) {
          // Not: 503 dalının aksine metin girdiye geri konmaz (mevcut davranış).
          markInsufficient();
          pendingMessageRef.current = text;
          onOpenPremiumSheet?.();
        } else if (err instanceof AiChatApiError && err.code === AI_UNAVAILABLE_CODE) {
          // Kredi düşülmedi, hiçbir şey kalıcılaştırılmadı — kullanıcının
          // metnini girdiye geri koy ve "Tekrar dene" seçeneği sun.
          aiUnavailableMessageRef.current = text;
          setInputValue(text);
          setAiUnavailable({ message: err.message || t("ai-chat:errors.aiUnavailable") });
        } else if (err instanceof AiChatApiError) {
          setError(err.message);
        } else {
          setError(t("ai-chat:errors.sendFailed"));
        }
      } finally {
        progressSocket.disconnect();
        if (streamAbortRef.current === abortController) {
          streamAbortRef.current = undefined;
        }
        setIsSending(false);
        setIsAwaitingFirstToken(false);
        setLoadingStep("");
      }
    },
    [applyRemainingCredits, authStatus, conversationId, locale, markInsufficient, onOpenPremiumSheet, t, userId]
  );

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) {
      return;
    }

    Keyboard.dismiss();
    setAiUnavailable(null);

    if (!(await ensureCreditsAvailable())) {
      pendingMessageRef.current = text;
      return;
    }

    await runSend(text);
  }, [ensureCreditsAvailable, inputValue, isSending, runSend]);

  /**
   * AI_UNAVAILABLE sonrası "Tekrar dene" — aynı metni yeniden gönderir.
   * Sohbet akışında flowId sunucu tarafında üretildiği için (bkz.
   * ai-chat.service.ts) burada yeni bir istek her zaman güvenlidir;
   * hiçbir şey kalıcılaştırılmamış/kredi düşülmemişti.
   */
  const retryLastMessage = useCallback(async () => {
    if (isSending) {
      return;
    }

    const text = aiUnavailableMessageRef.current || inputValue.trim();
    if (!text) {
      return;
    }

    if (!(await ensureCreditsAvailable())) {
      pendingMessageRef.current = text;
      return;
    }

    await runSend(text);
  }, [ensureCreditsAvailable, inputValue, isSending, runSend]);

  const resumeAfterCreditPurchase = useCallback(async () => {
    if (isSending) {
      return;
    }

    setIsSending(true);
    setLoadingStep(t("ai-chat:loading.creditsLoading"));

    if (!(await waitForCredits())) {
      setIsSending(false);
      setLoadingStep("");
      setError(t("ai-chat:loading.creditsLoadingRetry"));
      return;
    }

    const pending = pendingMessageRef.current || inputValue.trim();
    pendingMessageRef.current = "";
    setIsSending(false);
    setLoadingStep("");
    if (pending) {
      await runSend(pending);
    }
  }, [inputValue, isSending, runSend, t, waitForCredits]);

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
    conversationId,
    messages: resolvedMessages,
    conversations,
    inputValue,
    setInputValue,
    isSending,
    isAwaitingFirstToken,
    loadingStep,
    error,
    aiUnavailable,
    retryLastMessage,
    creditBalance,
    sendMessage,
    resumeAfterCreditPurchase,
    openConversation,
    startNewConversation
  };
}
