// expo/fetch: RN'de gerçek streaming Response.body (ReadableStream) sağlayan,
// expo paketiyle birlikte gelen (ekstra bağımlılık gerektirmeyen) fetch
// implementasyonu. Web'de globalThis.fetch'e fallback eder. SSE tüketimi
// için (native EventSource POST body desteklemediğinden) elle kullanılıyor.
import { fetch as streamFetch } from "expo/fetch";
import { i18n } from "../../../i18n";
import { AI_CREDIT_INSUFFICIENT_CODE, AI_UNAVAILABLE_CODE } from "../../ai-shared/ai-error-codes";
import { readSse, SSE_IDLE_TIMEOUT_MS, SseStreamError } from "./chat-sse";
import type { AiSourceCitation, ChatConversationSummary, ChatMessageRaw, ChatMode, ChatCoverage } from "../types";
import { API_BASE_URL } from "../../../lib/env";
import { ApiError, errorFromBody, request } from "../../../lib/http/client";

export { AI_CREDIT_INSUFFICIENT_CODE, AI_UNAVAILABLE_CODE };

export const AiChatApiError = ApiError;
export type AiChatApiError = ApiError;

const errors = () => ({
  failed: i18n.t("ai-chat:errors.serviceUnavailable"),
  unreachable: i18n.t("ai-chat:errors.serviceUnreachable")
});

function options(method: "GET" | "POST", body?: unknown) {
  return {
    method,
    body,
    auth: true as const,
    headers: { "accept-language": i18n.language },
    errors: errors()
  };
}

export type CreateConversationPayload = {
  firstMessage: string;
  locale?: "tr" | "en";
  socketId?: string;
  /** A-11: mesaj başına bir kez üretilir, aynı mesajın her tekrarında aynı gider (UUID). */
  clientMessageId?: string;
};

export type CreateConversationResponse = {
  conversation: {
    _id: string;
    title: string;
    status: string;
    lastMessageAt: string;
    locale: string;
  };
  messages: ChatMessageRaw[];
};

export type SendMessagePayload = {
  message: string;
  socketId?: string;
  /** bkz. CreateConversationPayload.clientMessageId */
  clientMessageId?: string;
};

export type SendMessageResponse = {
  message: ChatMessageRaw;
  reply: ChatMessageRaw;
  remainingCredits?: number;
};

export type PaginatedResponse<T> = {
  items: T[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export async function createChatConversation(
  payload: CreateConversationPayload
): Promise<CreateConversationResponse> {
  return request<CreateConversationResponse>("/v1/ai/chat/conversations", options("POST", payload));
}

export async function sendChatMessage(
  conversationId: string,
  payload: SendMessagePayload
): Promise<SendMessageResponse> {
  return request<SendMessageResponse>(
    `/v1/ai/chat/conversations/${conversationId}/messages`,
    options("POST", payload)
  );
}

export type ChatStreamDonePayload = {
  messageId: string;
  /** Nihai/otoriter asistan metni — akış sırasında biriken token'ların yerine geçer. */
  content: string;
  remainingCredits?: number;
  conversationId: string;
  conversation?: CreateConversationResponse["conversation"];
  userMessage: ChatMessageRaw;
  sourceCitations?: AiSourceCitation[];
  mode?: ChatMode;
  coverage?: ChatCoverage;
};

/** `event: error` ile gelen gövde — bkz. AI_UNAVAILABLE_CODE. */
export type ChatStreamErrorPayload = {
  code?: string;
  reason?: string;
  requestId?: string;
  message: string;
};

export type ChatStreamHandlers = {
  onToken?: (delta: string) => void;
  onDone?: (payload: ChatStreamDonePayload) => void;
  /**
   * Akış `event: error` gönderirse çağrılır (bağlantı hatalarından farklı —
   * akış zaten başlamış olabilir). `code === AI_UNAVAILABLE_CODE` ise hiçbir
   * şey kalıcılaştırılmamış ve kredi düşülmemiştir.
   */
  onError?: (payload: ChatStreamErrorPayload) => void;
};

/**
 * Yeni konuşma + ilk mesaj için SSE akışı. REST karşılığı olan
 * createChatConversation ile aynı payload'ı kabul eder; token'lar
 * `handlers.onToken` ile parça parça, sonuç ise `onDone` ile bir kerede
 * gelir. `signal` ile istemci tarafından iptal edilebilir
 * (AbortController) — sunucu bunu bağlantı kopması olarak algılar ve
 * mesajı kalıcılaştırmaz / kredi düşmez.
 */
export async function streamCreateConversation(
  payload: CreateConversationPayload,
  accessToken: string | undefined,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  await consumeChatSse("/v1/ai/chat/conversations/stream", payload, accessToken, handlers, signal);
}

/** Var olan konuşmaya mesaj için SSE akışı — bkz. streamCreateConversation. */
export async function streamChatMessage(
  conversationId: string,
  payload: SendMessagePayload,
  accessToken: string | undefined,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  await consumeChatSse(
    `/v1/ai/chat/conversations/${conversationId}/messages/stream`,
    payload,
    accessToken,
    handlers,
    signal
  );
}

// PRESERVED DEVIATION: SSE responses cannot go through request() — expo/fetch's
// streaming Response.body (ReadableStream) must be read incrementally with a
// manual reader loop, so this function (and its private JSON helpers below)
// keeps its own fetch call and error parsing instead of using request().
async function consumeChatSse(
  path: string,
  body: unknown,
  accessToken: string | undefined,
  handlers: ChatStreamHandlers,
  signal?: AbortSignal
): Promise<void> {
  const headers: Record<string, string> = {
    "content-type": "application/json",
    accept: "text/event-stream",
    "accept-language": i18n.language
  };
  if (accessToken?.trim()) {
    headers.authorization = `Bearer ${accessToken.trim()}`;
  }

  // B-28: yanıt başlığı gelene kadar da (fetch) bekçi gerekir; abort hem
  // çağıranın sinyalinden hem zaman aşımından tetiklenir.
  const controller = new AbortController();
  const onCallerAbort = () => controller.abort();
  signal?.addEventListener("abort", onCallerAbort);
  const headerTimer = setTimeout(() => controller.abort(), SSE_IDLE_TIMEOUT_MS);

  let response: Awaited<ReturnType<typeof streamFetch>>;
  try {
    response = await streamFetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal: controller.signal
    });
  } catch {
    signal?.removeEventListener("abort", onCallerAbort);
    if (signal?.aborted) {
      return;
    }
    throw new AiChatApiError("transient", i18n.t("ai-chat:errors.serviceUnreachable"));
  } finally {
    clearTimeout(headerTimer);
  }

  try {
    if (!response.ok || !response.body) {
      const rawResponse = await response.text().catch(() => "");
      throw errorFromBody(response.status, rawResponse, i18n.t("ai-chat:errors.serviceUnavailable"));
    }

    await readSse(response.body.getReader(), handlers, i18n.t("ai-chat:errors.sendFailed"));
  } catch (error) {
    if (signal?.aborted) {
      return;
    }
    // B-28/B-29: sessiz kalan ya da `done`'sız kapanan akış → hata (mesaj takılı kalmaz).
    if (error instanceof SseStreamError) {
      throw new AiChatApiError("transient", i18n.t("ai-chat:errors.sendFailed"));
    }
    throw error;
  } finally {
    signal?.removeEventListener("abort", onCallerAbort);
  }
}

export async function listChatConversations(
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ChatConversationSummary>> {
  return request<PaginatedResponse<ChatConversationSummary>>(
    `/v1/ai/chat/conversations?page=${page}&limit=${limit}`,
    options("GET")
  );
}

export async function listChatMessages(
  conversationId: string,
  page = 1,
  limit = 20
): Promise<PaginatedResponse<ChatMessageRaw>> {
  return request<PaginatedResponse<ChatMessageRaw>>(
    `/v1/ai/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    options("GET")
  );
}
