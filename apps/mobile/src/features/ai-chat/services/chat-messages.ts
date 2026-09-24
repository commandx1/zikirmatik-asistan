// Sohbet akışının mesaj dizisi geçişleri (saf): iyimser kullanıcı mesajı,
// akan asistan balonu, `done` ile sunucu kimliklerine geçiş, hata ile geri alma.
import type { ChatMessageRaw } from "../types";
import type { ChatStreamDonePayload } from "./ai-chat-api-client";

export function appendMessage(messages: ChatMessageRaw[], message: ChatMessageRaw): ChatMessageRaw[] {
  return [...messages, message];
}

/** Her token'da dizinin tamamı yeniden eşlenir (bilinen, kabul edilmiş maliyet). */
export function appendStreamToken(messages: ChatMessageRaw[], streamingId: string, delta: string): ChatMessageRaw[] {
  return messages.map((m) => (m.id === streamingId ? { ...m, content: m.content + delta } : m));
}

/** `done`: iyimser kullanıcı mesajını sunucununkiyle, akan balonu nihai mesajla değiştir. */
export function finalizeStream(
  messages: ChatMessageRaw[],
  optimisticId: string,
  streamingId: string,
  payload: ChatStreamDonePayload
): ChatMessageRaw[] {
  return messages.map((m) => {
    if (m.id === optimisticId) return payload.userMessage;
    if (m.id === streamingId) {
      return {
        ...m,
        id: payload.messageId,
        // `content` nihai/otoriter metindir — geldiğinde akış sırasında
        // biriken metnin yerine geçer; gelmezse akıştan birikeni koru.
        content: typeof payload.content === "string" && payload.content.length > 0 ? payload.content : m.content,
        sourceCitations: payload.sourceCitations ?? [],
        mode: payload.mode,
        coverage: payload.coverage
      };
    }
    return m;
  });
}

/** Hata: iyimser ve akan mesajları kaldır. */
export function removeTransientMessages(
  messages: ChatMessageRaw[],
  optimisticId: string,
  streamingId: string
): ChatMessageRaw[] {
  return messages.filter((m) => m.id !== optimisticId && m.id !== streamingId);
}
