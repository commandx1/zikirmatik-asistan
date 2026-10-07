// Sohbet SSE akışının saf parçaları (RN/i18n'siz): olay ayrıştırma, boşta
// kalma bekçisi (B-28) ve `done`'sız kapanma tespiti (B-29). Ağ çağrısı ve
// hata eşlemesi ai-chat-api-client.ts'dedir.
import type { ChatStreamDonePayload, ChatStreamHandlers } from "./ai-chat-api-client";

/** Sunucudan bu kadar süre hiç bayt gelmezse akış koptu sayılır (HTTP istemcisinin 120 sn AI zaman aşımıyla aynı). */
export const SSE_IDLE_TIMEOUT_MS = 120_000;

export class SseStreamError extends Error {
  constructor(public readonly reason: "idle_timeout" | "closed_without_done") {
    super(reason);
    this.name = "SseStreamError";
  }
}

export type SseReader = { read: () => Promise<{ done: boolean; value?: Uint8Array }>; cancel?: () => Promise<void> };

function parseJson(payload: string): unknown {
  try {
    return JSON.parse(payload);
  } catch {
    return payload;
  }
}

/** @returns true yalnız `done` olayı işlendiyse. */
export function processSseEvent(rawEvent: string, handlers: ChatStreamHandlers, fallbackErrorMessage: string): boolean {
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
    return false;
  }

  const data = parseJson(dataLines.join("\n"));

  switch (eventName) {
    case "token": {
      const delta = (data as { delta?: unknown } | undefined)?.delta;
      if (typeof delta === "string") {
        handlers.onToken?.(delta);
      }
      return false;
    }
    case "done":
      handlers.onDone?.(data as ChatStreamDonePayload);
      return true;
    case "error": {
      const c = (data as { code?: unknown; reason?: unknown; requestId?: unknown; message?: unknown } | undefined) ?? {};
      handlers.onError?.({
        code: typeof c.code === "string" ? c.code : undefined,
        reason: typeof c.reason === "string" ? c.reason : undefined,
        requestId: typeof c.requestId === "string" ? c.requestId : undefined,
        message: typeof c.message === "string" && c.message.trim() ? c.message : fallbackErrorMessage
      });
      return false;
    }
    default:
      return false;
  }
}

/**
 * Akışı sonuna kadar okur. Her okuma `idleMs` içinde bayt getirmezse
 * SseStreamError("idle_timeout"); `done` görülmeden kapanırsa
 * SseStreamError("closed_without_done") fırlatır.
 */
export async function readSse(
  reader: SseReader,
  handlers: ChatStreamHandlers,
  fallbackErrorMessage: string,
  idleMs: number = SSE_IDLE_TIMEOUT_MS
): Promise<void> {
  const decoder = new TextDecoder();
  let buffer = "";
  let sawDone = false;

  while (true) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    const idle = new Promise<never>((_, reject) => {
      timer = setTimeout(() => reject(new SseStreamError("idle_timeout")), idleMs);
    });
    let chunk: Awaited<ReturnType<SseReader["read"]>>;
    try {
      chunk = await Promise.race([reader.read(), idle]);
    } catch (error) {
      void reader.cancel?.().catch(() => {});
      throw error;
    } finally {
      clearTimeout(timer);
    }

    if (chunk.done) break;
    buffer += decoder.decode(chunk.value, { stream: true });

    let boundary = buffer.indexOf("\n\n");
    while (boundary !== -1) {
      const rawEvent = buffer.slice(0, boundary);
      buffer = buffer.slice(boundary + 2);
      if (processSseEvent(rawEvent, handlers, fallbackErrorMessage)) sawDone = true;
      boundary = buffer.indexOf("\n\n");
    }
  }

  if (!sawDone) {
    throw new SseStreamError("closed_without_done");
  }
}
