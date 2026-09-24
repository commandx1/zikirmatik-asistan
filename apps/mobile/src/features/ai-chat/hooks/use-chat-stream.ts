// Sohbet mesajı gönderimi (SSE): ilerleme soketi, iyimser kullanıcı mesajı,
// token akışı, `done` ile kesinleştirme, hata sınıflandırması ve
// tekrar-dene / satın-alma-sonrası devam. Mesaj dizisi geçişleri saf olarak
// ../services/chat-messages.ts'dedir.
//
// Bilinen, bilerek korunan davranışlar: AI_CREDIT_INSUFFICIENT'ta metin
// girdiye geri konmaz; sohbet değiştirme/yeni sohbet akan isteği iptal etmez;
// her token'da mesaj dizisinin tamamı yeniden eşlenir.
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import type { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import { useAiProgressSteps } from "../../ai-shared/hooks/use-ai-progress-steps";
import {
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  AiChatApiError,
  streamChatMessage,
  streamCreateConversation,
  type ChatStreamHandlers
} from "../services/ai-chat-api-client";
import { appendMessage, appendStreamToken, finalizeStream, removeTransientMessages } from "../services/chat-messages";
import type { ChatConversationSummary, ChatMessageRaw } from "../types";

type Options = {
  conversationId?: string;
  setConversationId: (id: string) => void;
  setMessages: Dispatch<SetStateAction<ChatMessageRaw[]>>;
  prependConversation: (summary: ChatConversationSummary) => void;
  credits: ReturnType<typeof useAiCredits>;
  onOpenPremiumSheet?: () => void;
};

export function useChatStream({
  conversationId,
  setConversationId,
  setMessages,
  prependConversation,
  credits,
  onOpenPremiumSheet
}: Options) {
  const { t } = useTranslation("ai-chat");
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const locale = useProfileStore((s) => s.locale) as "tr" | "en";
  const { ensureCreditsAvailable, applyRemainingCredits, markInsufficient, waitForCredits } = credits;
  const { loadingStep, setLoadingStep, withProgress } = useAiProgressSteps("chat");

  const [inputValue, setInputValue] = useState("");
  const [isSending, setIsSending] = useState(false);
  // Token akışı başlayana kadar true — TypingIndicator bu süre boyunca
  // gösterilir, ilk token gelince (veya stream boş dönerse) kapanır.
  const [isAwaitingFirstToken, setIsAwaitingFirstToken] = useState(false);
  const [error, setError] = useState<string>();
  const [aiUnavailable, setAiUnavailable] = useState<{ message: string } | null>(null);
  const pendingMessageRef = useRef<string>("");
  // AI_UNAVAILABLE alındığında son gönderilen metin — kredi düşülmediği için
  // pendingMessageRef'ten (satın alma sonrası devam akışı) ayrı tutulur.
  const aiUnavailableMessageRef = useRef<string>("");
  const streamAbortRef = useRef<AbortController | undefined>(undefined);

  useEffect(() => {
    return () => {
      streamAbortRef.current?.abort();
    };
  }, []);

  const runSend = useCallback(
    async (text: string) => {
      pendingMessageRef.current = "";
      setIsSending(true);
      setIsAwaitingFirstToken(true);
      setError(undefined);
      setAiUnavailable(null);

      const stepLabel = (key: string) =>
        t(`ai-chat:loading.steps.${key}`, { defaultValue: t("ai-chat:loading.defaultStep") });

      await withProgress(stepLabel, async (socketId) => {
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

        setMessages((prev) => appendMessage(prev, optimisticUserMessage));
        setInputValue("");

        const abortController = new AbortController();
        streamAbortRef.current = abortController;

        const handlers: ChatStreamHandlers = {
          onToken: (delta) => {
            if (!streamingStarted) {
              streamingStarted = true;
              setIsAwaitingFirstToken(false);
              setMessages((prev) =>
                appendMessage(prev, {
                  id: streamingAssistantId,
                  conversationId: activeConversationId ?? "",
                  role: "assistant",
                  content: "",
                  createdAt: new Date().toISOString()
                })
              );
            }
            setMessages((prev) => appendStreamToken(prev, streamingAssistantId, delta));
          },
          onDone: (payload) => {
            if (isNewConversation) {
              setConversationId(payload.conversationId);
              if (payload.conversation) {
                const conv = payload.conversation;
                prependConversation({
                  id: payload.conversationId,
                  title: conv.title,
                  lastMessageAt: conv.lastMessageAt,
                  status: conv.status
                });
              }
            }

            setMessages((prev) => finalizeStream(prev, optimisticUserMessage.id, streamingAssistantId, payload));
            applyRemainingCredits(payload.remainingCredits);
          },
          onError: (payload) => {
            // Akış zaten başlamıştı — event: error'ı normal bir hata olarak
            // işlemek için throw ediyoruz; dıştaki catch mesajları temizler.
            throw new AiChatApiError("transient", payload.message, undefined, payload.code);
          }
        };

        try {
          if (authStatus !== "authenticated" || !userId) {
            return;
          }

          const accessToken = useAuthStore.getState().session?.accessToken;
          if (!activeConversationId) {
            await streamCreateConversation(
              { firstMessage: text, locale, socketId },
              accessToken,
              handlers,
              abortController.signal
            );
          } else {
            await streamChatMessage(
              activeConversationId,
              { message: text, socketId },
              accessToken,
              handlers,
              abortController.signal
            );
          }
        } catch (err) {
          setMessages((prev) => removeTransientMessages(prev, optimisticUserMessage.id, streamingAssistantId));

          if (err instanceof AiChatApiError && err.code === AI_CREDIT_INSUFFICIENT_CODE) {
            // Not: 503 dalının aksine metin girdiye geri konmaz (mevcut davranış).
            markInsufficient();
            pendingMessageRef.current = text;
            onOpenPremiumSheet?.();
          } else if (err instanceof AiChatApiError && err.code === AI_UNAVAILABLE_CODE) {
            // Kredi düşülmedi, hiçbir şey kalıcılaştırılmadı — metni girdiye
            // geri koy ve "Tekrar dene" seçeneği sun.
            aiUnavailableMessageRef.current = text;
            setInputValue(text);
            setAiUnavailable({ message: err.message || t("ai-chat:errors.aiUnavailable") });
          } else if (err instanceof AiChatApiError) {
            setError(err.message);
          } else {
            setError(t("ai-chat:errors.sendFailed"));
          }
        } finally {
          if (streamAbortRef.current === abortController) {
            streamAbortRef.current = undefined;
          }
          setIsSending(false);
          setIsAwaitingFirstToken(false);
        }
      });
    },
    [
      applyRemainingCredits,
      authStatus,
      conversationId,
      locale,
      markInsufficient,
      onOpenPremiumSheet,
      prependConversation,
      setConversationId,
      setMessages,
      t,
      userId,
      withProgress
    ]
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
   * flowId sunucuda üretildiği için yeni istek her zaman güvenlidir.
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
  }, [inputValue, isSending, runSend, setLoadingStep, t, waitForCredits]);

  return {
    inputValue,
    setInputValue,
    isSending,
    isAwaitingFirstToken,
    loadingStep,
    error,
    setError,
    aiUnavailable,
    sendMessage,
    retryLastMessage,
    resumeAfterCreditPurchase
  };
}
