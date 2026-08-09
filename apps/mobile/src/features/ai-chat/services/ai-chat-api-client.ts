import { Platform } from "react-native";
// expo/fetch: RN'de gerçek streaming Response.body (ReadableStream) sağlayan,
// expo paketiyle birlikte gelen (ekstra bağımlılık gerektirmeyen) fetch
// implementasyonu. Web'de globalThis.fetch'e fallback eder. SSE tüketimi
// için (native EventSource POST body desteklemediğinden) elle kullanılıyor.
import { fetch as streamFetch } from "expo/fetch";
import { i18n } from "../../../i18n";
import type { AiSourceCitation, ChatConversationSummary, ChatMessageRaw } from "../types";

export const AI_CREDIT_INSUFFICIENT_CODE = "AI_CREDIT_INSUFFICIENT";

export class AiChatApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AiChatApiError";
  }
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

const API_BASE_URL = resolveApiBaseUrl();

export async function createChatConversation(
  payload: CreateConversationPayload,
  accessToken?: string
): Promise<CreateConversationResponse> {
  return requestJson<CreateConversationResponse>("/v1/ai/chat/conversations", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function sendChatMessage(
  conversationId: string,
  payload: SendMessagePayload,
  accessToken?: string
): Promise<SendMessageResponse> {
  return requestJson<SendMessageResponse>(
    `/v1/ai/chat/conversations/${conversationId}/messages`,
    {
      method: "POST",
      body: payload,
      accessToken
    }
  );
}

export type ChatStreamDonePayload = {
  messageId: string;
  remainingCredits?: number;
  conversationId: string;
  conversation?: CreateConversationResponse["conversation"];
  userMessage: ChatMessageRaw;
  sourceCitations?: AiSourceCitation[];
};

export type ChatStreamHandlers = {
  onToken?: (delta: string) => void;
  onDone?: (payload: ChatStreamDonePayload) => void;
  /** Akış `event: error` gönderirse çağrılır (bağlantı hatalarından farklı — akış zaten başlamıştır). */
  onError?: (message: string) => void;
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
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);
    const message = extractErrorMessage(data, i18n.t("ai-chat:errors.serviceUnavailable"));
    const code = extractErrorCode(data);
    throw new AiChatApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
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
      const message =
        (data as { message?: unknown } | undefined)?.message;
      handlers.onError?.(typeof message === "string" && message.trim() ? message : i18n.t("ai-chat:errors.sendFailed"));
      break;
    }
    default:
      break;
  }
}

export async function listChatConversations(
  page = 1,
  limit = 20,
  accessToken?: string
): Promise<PaginatedResponse<ChatConversationSummary>> {
  return requestJson<PaginatedResponse<ChatConversationSummary>>(
    `/v1/ai/chat/conversations?page=${page}&limit=${limit}`,
    { method: "GET", accessToken }
  );
}

export async function listChatMessages(
  conversationId: string,
  page = 1,
  limit = 20,
  accessToken?: string
): Promise<PaginatedResponse<ChatMessageRaw>> {
  return requestJson<PaginatedResponse<ChatMessageRaw>>(
    `/v1/ai/chat/conversations/${conversationId}/messages?page=${page}&limit=${limit}`,
    { method: "GET", accessToken }
  );
}

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";
  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${port}`;
}

async function requestJson<TResponse>(
  path: string,
  options: { method: "GET" | "POST" | "PATCH"; body?: unknown; accessToken?: string }
): Promise<TResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json",
      "accept-language": i18n.language
    };
    if (options.accessToken?.trim()) {
      headers.authorization = `Bearer ${options.accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("ai-chat:errors.serviceUnavailable"));
      const code = extractErrorCode(data);
      throw new AiChatApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof AiChatApiError) {
      throw error;
    }

    throw new AiChatApiError("transient", i18n.t("ai-chat:errors.serviceUnreachable"));
  }
}

function safeParseJson(payload: string): unknown {
  if (!payload) {
    return undefined;
  }

  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

function unwrapDataEnvelope(payload: unknown) {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return payload;
  }

  return (payload as { data: unknown }).data;
}

function extractErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const candidate = payload as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code : undefined;
}

function extractErrorMessage(payload: unknown, fallback: string) {
  if (typeof payload === "string" && payload.trim()) {
    return payload;
  }

  if (!payload || typeof payload !== "object") {
    return fallback;
  }

  const candidate = payload as { message?: unknown; error?: unknown };
  if (typeof candidate.message === "string" && candidate.message.trim()) {
    return candidate.message;
  }

  if (typeof candidate.error === "string" && candidate.error.trim()) {
    return candidate.error;
  }

  return fallback;
}
