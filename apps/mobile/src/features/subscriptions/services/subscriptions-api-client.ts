import { Platform } from "react-native";
import { i18n } from "../../../i18n";

type SubscriptionProvider = "apple" | "google";
type SubscriptionStatus = "active" | "expired" | "cancelled";
type SubscriptionPlan = "free" | "premium";

export type CreateSubscriptionPayload = {
  userId: string;
  plan: SubscriptionPlan;
  provider: SubscriptionProvider;
  status: SubscriptionStatus;
  productId: string;
  startDate: string;
  endDate: string;
};

export type SyncSubscriptionPayload = {
  hasActivePremiumEntitlement?: boolean;
  provider?: SubscriptionProvider;
};

export class SubscriptionsApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "SubscriptionsApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function createSubscription(payload: CreateSubscriptionPayload, accessToken?: string) {
  return requestJson("/v1/subscriptions", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function syncSubscriptionForUser(
  userId: string,
  accessToken?: string,
  payload: SyncSubscriptionPayload = {}
): Promise<{ userId: string; isPremium: boolean }> {
  return requestJson(`/v1/subscriptions/sync-user/${userId}`, {
    method: "POST",
    body: payload,
    accessToken
  });
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
  options: { method: "POST"; body: unknown; accessToken?: string }
): Promise<TResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };
    if (options.accessToken?.trim()) {
      headers.authorization = `Bearer ${options.accessToken.trim()}`;
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method,
      headers,
      body: JSON.stringify(options.body)
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("subscriptions:errors.requestFailed"));
      throw new SubscriptionsApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof SubscriptionsApiError) {
      throw error;
    }

    throw new SubscriptionsApiError("transient", i18n.t("subscriptions:errors.serverUnreachable"));
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
