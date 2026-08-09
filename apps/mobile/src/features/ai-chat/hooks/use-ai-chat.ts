import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { createAiProgressSocket } from "../../ai-guide/services/ai-progress-socket";
import {
  AI_CREDIT_INSUFFICIENT_CODE,
  AiChatApiError,
  listChatConversations,
  listChatMessages,
  streamChatMessage,
  streamCreateConversation,
  type ChatStreamHandlers
} from "../services/ai-chat-api-client";
import type { AiSourceCitation, ChatConversationSummary, ChatMessageRaw } from "../types";
import { getAiCredits, getAiDailyQuota } from "../../ai-guide/services/ai-api-client";

export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  sourceCitations: AiSourceCitation[];
};

/**
 * AI API çağrısını çalıştırır; 401 alınırsa oturumu bir kez yenileyip
 * taze access token ile isteği tekrar dener. use-ai-guide.ts'teki
 * callWithAuthRetry ile aynı desen.
 */
async function callWithAuthRetry<T>(call: (accessToken?: string) => Promise<T>): Promise<T> {
  const initialToken = useAuthStore.getState().session?.accessToken;

  try {
    return await call(initialToken);
  } catch (error) {
    if (!(error instanceof AiChatApiError) || error.status !== 401) {
      throw error;
    }

    await useAuthStore.getState().refreshAuthenticatedSession();

    const refreshedToken = useAuthStore.getState().session?.accessToken;
    if (!refreshedToken || refreshedToken === initialToken) {
      throw error;
    }

    return call(refreshedToken);
  }
}

export function useAiChat(onOpenPremiumSheet?: () => void) {
  const { t } = useTranslation("ai-chat");
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const isPremium = useProfileStore((s) => s.isPremium);
  const locale = useProfileStore((s) => s.locale) as "tr" | "en";

  const [conversationId, setConversationId] = useState<string>();
  const [messages, setMessages] = useState<ChatMessageRaw[]>([]);
  const [conversations, setConversations] = useState<ChatConversationSummary[]>([]);
  const [isConversationsLoading, setIsConversationsLoading] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Token akışı başlayana kadar true — TypingIndicator bu süre boyunca
  // gösterilir, ilk token gelince (veya stream boş dönerse) kapanır ve
  // yerini kısmen dolan mesaj balonu alır.
  const [isAwaitingFirstToken, setIsAwaitingFirstToken] = useState(false);
  const [loadingStep, setLoadingStep] = useState("");
  const [error, setError] = useState<string>();
  const [creditBalance, setCreditBalance] = useState(0);
  const [creditsConfirmed, setCreditsConfirmed] = useState(false);
  const pendingMessageRef = useRef<string>("");
  const streamAbortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const refreshCredits = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setCreditBalance(0);
      setCreditsConfirmed(false);
      return { balance: 0, isPremium: false };
    }

    try {
      const credits = await callWithAuthRetry((token) => getAiCredits(token));
      setCreditBalance(Math.max(0, Math.floor(credits.balance)));
      setCreditsConfirmed(true);
      return { balance: credits.balance, isPremium: credits.isPremium };
    } catch {
      try {
        const quota = await callWithAuthRetry((token) => getAiDailyQuota(token));
        const fallbackBalance = quota.isPremium
          ? Number.MAX_SAFE_INTEGER
          : Math.max(0, (quota.limit ?? 1) - quota.used);
        setCreditBalance(fallbackBalance);
        setCreditsConfirmed(true);
        return { balance: fallbackBalance, isPremium: quota.isPremium };
      } catch {
        return { balance: creditBalance, isPremium };
      }
    }
  }, [authStatus, creditBalance, isPremium]);

  const ensureCreditsAvailable = useCallback(async () => {
    if (authStatus !== "authenticated" || !userId) {
      return false;
    }

    const shouldRefresh = !creditsConfirmed || creditBalance <= 0;
    const state = shouldRefresh
      ? await refreshCredits()
      : { balance: creditBalance, isPremium };

    if (state.balance > 0 || state.isPremium) {
      return true;
    }

    onOpenPremiumSheet?.();
    return false;
  }, [authStatus, creditBalance, creditsConfirmed, isPremium, onOpenPremiumSheet, refreshCredits, userId]);

  const loadConversations = useCallback(async () => {
    if (authStatus !== "authenticated") {
      setConversations([]);
      return;
    }

    setIsConversationsLoading(true);
    try {
      const response = await callWithAuthRetry((token) => listChatConversations(1, 20, token));
      setConversations(response.items);
    } catch {
      // sessizce yok say — sohbet ekranı geçmiş olmadan da çalışır
    } finally {
      setIsConversationsLoading(false);
    }
  }, [authStatus]);

  useEffect(() => {
    void loadConversations();
    void refreshCredits();
  }, [authStatus]);

  const openConversation = useCallback(
    async (id: string) => {
      setError(undefined);
      setConversationId(id);
      try {
        const response = await callWithAuthRetry((token) => listChatMessages(id, 1, 50, token));
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
                return { ...m, id: payload.messageId, sourceCitations: payload.sourceCitations ?? [] };
              }
              return m;
            })
          );

          if (typeof payload.remainingCredits === "number") {
            setCreditBalance(Math.max(0, Math.floor(payload.remainingCredits)));
            setCreditsConfirmed(true);
          }
        },
        onError: (message) => {
          // Akış zaten başlamıştı (bkz. ChatStreamMidwayError backend'de) —
          // event: error'ı normal bir hata olarak işlemek için throw ediyoruz,
          // dıştaki catch bloğu optimistic/streaming mesajları temizler.
          throw new AiChatApiError("transient", message);
        }
      };

      try {
        if (authStatus !== "authenticated" || !userId) {
          return;
        }

        if (!activeConversationId) {
          await callWithAuthRetry((token) =>
            streamCreateConversation({ firstMessage: text, locale, socketId }, token, handlers, abortController.signal)
          );
        } else {
          await callWithAuthRetry((token) =>
            streamChatMessage(activeConversationId, { message: text, socketId }, token, handlers, abortController.signal)
          );
        }
      } catch (err) {
        setMessages((prev) =>
          prev.filter((m) => m.id !== optimisticUserMessage.id && m.id !== streamingAssistantId)
        );

        if (err instanceof AiChatApiError && err.code === AI_CREDIT_INSUFFICIENT_CODE) {
          setCreditBalance(0);
          setCreditsConfirmed(true);
          pendingMessageRef.current = text;
          onOpenPremiumSheet?.();
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
    [authStatus, conversationId, locale, onOpenPremiumSheet, t, userId]
  );

  const sendMessage = useCallback(async () => {
    const text = inputValue.trim();
    if (!text || isSending) {
      return;
    }

    Keyboard.dismiss();

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

    const MAX_ATTEMPTS = 8;
    const POLL_INTERVAL_MS = 2000;

    try {
      for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt += 1) {
        if (attempt > 0) {
          await new Promise((resolve) => setTimeout(resolve, POLL_INTERVAL_MS));
        }

        const state = await refreshCredits();
        if (state.balance > 0 || state.isPremium) {
          const pending = pendingMessageRef.current || inputValue.trim();
          pendingMessageRef.current = "";
          setIsSending(false);
          setLoadingStep("");
          if (pending) {
            await runSend(pending);
          }
          return;
        }
      }

      setIsSending(false);
      setLoadingStep("");
      setError(t("ai-chat:loading.creditsLoadingRetry"));
    } catch {
      setIsSending(false);
      setLoadingStep("");
      setError(t("ai-chat:loading.creditsLoadingRetry"));
    }
  }, [inputValue, isSending, refreshCredits, runSend, t]);

  const resolvedMessages = useMemo<ChatMessage[]>(
    () =>
      messages.map((m) => ({
        id: m.id,
        role: m.role,
        content: m.content,
        createdAt: m.createdAt,
        sourceCitations: m.sourceCitations ?? []
      })),
    [messages]
  );

  return {
    conversationId,
    messages: resolvedMessages,
    conversations,
    isConversationsLoading,
    inputValue,
    setInputValue,
    isSending,
    isAwaitingFirstToken,
    loadingStep,
    error,
    creditBalance,
    sendMessage,
    resumeAfterCreditPurchase,
    openConversation,
    startNewConversation,
    refreshConversations: loadConversations
  };
}
