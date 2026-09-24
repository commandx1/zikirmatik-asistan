// expo/fetch: RN'de gerçek streaming Response.body (ReadableStream) sağlayan,
// expo paketiyle birlikte gelen (ekstra bağımlılık gerektirmeyen) fetch
// implementasyonu. Web'de globalThis.fetch'e fallback eder. SSE tüketimi
// için (native EventSource POST body desteklemediğinden) elle kullanılıyor.
import { fetch as streamFetch } from "expo/fetch";
import { i18n } from "../../../i18n";
import { AI_UNAVAILABLE_CODE } from "../../ai-shared/ai-error-codes";
import type { AiSourceCitation, ChatConversationSummary, ChatMessageRaw, ChatMode, ChatCoverage } from "../types";
import { API_BASE_URL } from "../../../lib/env";
import { ApiError, errorFromBody, request, safeParseJson } from "../../../lib/http/client";

export const AI_CREDIT_INSUFFICIENT_CODE = "AI_CREDIT_INSUFFICIENT";
export { AI_UNAVAILABLE_CODE };

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

  let response: Awaited<ReturnType<typeof streamFetch>>;
  try {
    response = await streamFetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
      signal
    });
  } catch {
    if (signal?.aborted) {
      return;
    }
    throw new AiChatApiError("transient", i18n.t("ai-chat:errors.serviceUnreachable"));
  }

  if (!response.ok || !response.body) {
    const rawResponse = await response.text().catch(() => "");
    throw errorFromBody(response.status, rawResponse, i18n.t("ai-chat:errors.serviceUnavailable"));
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      let boundary = buffer.indexOf("\n\n");
      while (boundary !== -1) {
        const rawEvent = buffer.slice(0, boundary);
        buffer = buffer.slice(boundary + 2);
        processSseEvent(rawEvent, handlers);
        boundary = buffer.indexOf("\n\n");
      }
    }
  } catch (error) {
    if (signal?.aborted) {
      return;
    }
    throw error;
  }
}

function processSseEvent(rawEvent: string, handlers: ChatStreamHandlers) {
  let eventName = "message";
  const dataLines: string[] = [];

  for (const line of rawEvent.split("\n")) {
    if (line.startsWith("event:")) {
      eventName = line.slice("event:".length).trim();
    } else if (line.startsWith("data:")) {
      dataLines.push(line.slice("data:".length).trim());
    }
  }

  if (dataLines.length === 0) {
    return;
  }

  const data = safeParseJson(dataLines.join("\n"));

  switch (eventName) {
    case "token": {
      const delta = (data as { delta?: unknown } | undefined)?.delta;
      if (typeof delta === "string") {
        handlers.onToken?.(delta);
      }
      break;
    }
    case "done": {
      handlers.onDone?.(data as ChatStreamDonePayload);
      break;
    }
    case "error": {
      const candidate = (data as { code?: unknown; reason?: unknown; requestId?: unknown; message?: unknown } | undefined) ?? {};
      const message =
        typeof candidate.message === "string" && candidate.message.trim()
          ? candidate.message
          : i18n.t("ai-chat:errors.sendFailed");
      handlers.onError?.({
        code: typeof candidate.code === "string" ? candidate.code : undefined,
        reason: typeof candidate.reason === "string" ? candidate.reason : undefined,
        requestId: typeof candidate.requestId === "string" ? candidate.requestId : undefined,
        message
      });
      break;
    }
    default:
      break;
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
