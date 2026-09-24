import type {
  AuthProviderVerifyRequest,
  AuthProviderVerifyResponse,
  RefreshTokenRequest,
  RefreshTokenResponse
} from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { API_BASE_URL } from "../../../lib/env";

export class AuthApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "AuthApiError";
  }
}

export async function verifyProvider(payload: AuthProviderVerifyRequest): Promise<AuthProviderVerifyResponse> {
  return requestJson<AuthProviderVerifyResponse>("/v1/auth/provider/verify", payload);
}

export async function refreshSession(payload: RefreshTokenRequest): Promise<RefreshTokenResponse> {
  return requestJson<RefreshTokenResponse>("/v1/auth/refresh", payload);
}

async function requestJson<TResponse>(path: string, body: unknown): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "POST",
      headers: {
        "content-type": "application/json"
      },
      body: JSON.stringify(body)
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("auth:errors.requestFailed"));
      throw new AuthApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof AuthApiError) {
      throw error;
    }

    throw new AuthApiError(
      "transient",
      i18n.t("auth:errors.serverUnreachable")
    );
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
