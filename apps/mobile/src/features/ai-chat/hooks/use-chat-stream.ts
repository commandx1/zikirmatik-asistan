// Sohbet mesajı gönderimi (SSE): ilerleme soketi, iyimser kullanıcı mesajı,
// token akışı, `done` ile kesinleştirme, hata sınıflandırması ve
// tekrar-dene / satın-alma-sonrası devam. Mesaj dizisi geçişleri saf olarak
// ../services/chat-messages.ts'dedir.
//
// Hatada (kredi/limit dahil, B-30) yazılan metin girdiye geri konur; aynı metnin
// tekrarı aynı clientMessageId'yi taşır (A-11). Bilinen, bilerek korunan
// davranışlar: sohbet değiştirme/yeni sohbet akan isteği iptal etmez;
// her token'da mesaj dizisinin tamamı yeniden eşlenir.
import { useCallback, useEffect, useRef, useState, type Dispatch, type SetStateAction } from "react";
import { createInFlightGuard } from "../../ai-shared/services/in-flight-guard";
import { Keyboard } from "react-native";
import { useTranslation } from "react-i18next";
import { getAppLocale } from "../../../i18n";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import type { useAiCredits } from "../../ai-shared/hooks/use-ai-credits";
import { useAiProgressSteps } from "../../ai-shared/hooks/use-ai-progress-steps";
import { aiLimitMessageKey } from "../../ai-shared/ai-error-codes";
import {
  AiChatApiError,
  streamChatMessage,
  streamCreateConversation,
  type ChatStreamHandlers
} from "../services/ai-chat-api-client";
import { createFlowId } from "../../../lib/ids";
import {
  classifyChatError,
  isBlankMessage,
  resolveClientMessageId,
  retryOnInProgress,
  type ClientMessageKey
} from "../services/chat-send-policy";
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
  // A-11: mesaj başına bir kez üretilir; başarılı `done`'da sıfırlanır.
  const clientMessageRef = useRef<ClientMessageKey | undefined>(undefined);
  // Çift dokunuş koruması: isSending state'i kredi ön kontrolü bitene kadar false kalır.
  const inFlight = useRef(createInFlightGuard()).current;

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

      clientMessageRef.current = resolveClientMessageId(clientMessageRef.current, text, createFlowId);
      const clientMessageId = clientMessageRef.current.id;
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

            clientMessageRef.current = undefined;
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
          await retryOnInProgress(() =>
            activeConversationId
              ? streamChatMessage(
                  activeConversationId,
                  { message: text, socketId, clientMessageId },
                  accessToken,
                  handlers,
                  abortController.signal
                )
              : streamCreateConversation(
                  { firstMessage: text, locale, socketId, clientMessageId },
                  accessToken,
                  handlers,
                  abortController.signal
                )
          );
        } catch (err) {
          setMessages((prev) => removeTransientMessages(prev, optimisticUserMessage.id, streamingAssistantId));

          const code = err instanceof AiChatApiError ? err.code : undefined;
          const kind = classifyChatError(code);
          const limitKey = aiLimitMessageKey(code);
          // Yazılan metin hiçbir hatada kaybolmaz (B-30); tekrar aynı anahtarla gider.
          setInputValue(text);

          if (kind === "credit") {
            markInsufficient();
            pendingMessageRef.current = text;
            onOpenPremiumSheet?.();
          } else if (kind === "unavailable") {
            // Kredi düşülmedi, hiçbir şey kalıcılaştırılmadı — "Tekrar dene" seçeneği sun.
            aiUnavailableMessageRef.current = text;
            // Non-TR: the client already replaced the (Turkish) server text with a
            // generic fallback, so use the specific "credit not charged" copy.
            setAiUnavailable({
              message: getAppLocale() === "tr" ? (err as AiChatApiError).message || t("ai-chat:errors.aiUnavailable") : t("ai-chat:errors.aiUnavailable")
            });
          } else if (limitKey) {
            // 429 tek-uçuş / günlük kredisiz sınır: kredi düşmedi, metin yukarıda korundu.
            setError(t(limitKey));
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
    if (isBlankMessage(text) || isSending) {
      return;
    }

    if (!inFlight.acquire()) {
      return;
    }
    try {
      Keyboard.dismiss();
      setAiUnavailable(null);

      if (!(await ensureCreditsAvailable())) {
        pendingMessageRef.current = text;
        return;
      }

      await runSend(text);
    } finally {
      inFlight.release();
    }
  }, [ensureCreditsAvailable, inFlight, inputValue, isSending, runSend]);

  /**
   * AI_UNAVAILABLE sonrası "Tekrar dene" — aynı metni yeniden gönderir.
   * Aynı metin → aynı clientMessageId (A-11), tekrar güvenlidir.
   */
  const retryLastMessage = useCallback(async () => {
    if (isSending) {
      return;
    }

    const text = aiUnavailableMessageRef.current || inputValue.trim();
    if (isBlankMessage(text)) {
      return;
    }

    if (!inFlight.acquire()) {
      return;
    }
    try {
      if (!(await ensureCreditsAvailable())) {
        pendingMessageRef.current = text;
        return;
      }

      await runSend(text);
    } finally {
      inFlight.release();
    }
  }, [ensureCreditsAvailable, inFlight, inputValue, isSending, runSend]);

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
