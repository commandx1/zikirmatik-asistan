import { API_BASE_URL } from "../env";
import { getAuthBridge } from "./auth-bridge";

// Same positional shape as every legacy XxxApiError, so per-feature aliases
// (`export const DhikrsApiError = ApiError`) keep call sites and instanceof working.
export class ApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export type RequestOptions<T> = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** true: session token via the auth bridge (+ one refresh/retry on 401). string: explicit token, no retry. */
  auth?: boolean | string;
  headers?: Record<string, string>;
  timeoutMs?: number;
  parse?: (raw: unknown) => T;
  /** Returned for an empty/`null` success body. Defaults to `{}`; pass `undefined` explicitly to get it back raw. */
  emptyValue?: T;
  /** Per-endpoint i18n messages: non-2xx fallback and network/timeout failure. */
  errors: { failed: string; unreachable: string };
};

export async function request<T>(path: string, options: RequestOptions<T>): Promise<T> {
  const { auth } = options;
  const token = typeof auth === "string" ? auth.trim() : auth ? getAuthBridge().getAccessToken()?.trim() : undefined;

  let raw: unknown;
  try {
    raw = await send(path, options, token);
  } catch (error) {
    if (auth !== true || !(error instanceof ApiError) || error.status !== 401) {
      throw error;
    }

    const bridge = getAuthBridge();
    await bridge.refresh().catch(() => undefined);
    const refreshed = bridge.getAccessToken()?.trim();
    if (!refreshed || refreshed === token) {
      throw error;
    }

    raw = await send(path, options, refreshed);
  }

  // Outside the try on purpose: a validation failure must not masquerade as "unreachable".
  return options.parse ? options.parse(raw) : (raw as T);
}

async function send<T>(path: string, options: RequestOptions<T>, token: string | undefined): Promise<unknown> {
  const { method = "GET", body, timeoutMs, errors } = options;
  const headers: Record<string, string> = { "content-type": "application/json", ...options.headers };
  if (token) {
    headers.authorization = `Bearer ${token}`;
  }

  try {
    const controller = timeoutMs === undefined ? undefined : new AbortController();
    const timeoutId = controller ? setTimeout(() => controller.abort(), timeoutMs) : undefined;

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method,
        headers,
        ...(controller ? { signal: controller.signal } : {}),
        ...(body !== undefined ? { body: JSON.stringify(body) } : {})
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const data = unwrapDataEnvelope(safeParseJson(await response.text()));

    if (!response.ok) {
      throw new ApiError(
        response.status >= 500 ? "transient" : "terminal",
        extractErrorMessage(data, errors.failed),
        response.status,
        extractErrorCode(data)
      );
    }

    return data ?? ("emptyValue" in options ? options.emptyValue : {});
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }

    throw new ApiError("transient", errors.unreachable);
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

function extractErrorCode(payload: unknown): string | undefined {
  if (!payload || typeof payload !== "object") return undefined;
  const candidate = payload as { code?: unknown };
  return typeof candidate.code === "string" ? candidate.code : undefined;
}
