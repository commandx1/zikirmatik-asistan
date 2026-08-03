import { Platform } from "react-native";
import { i18n } from "../../../i18n";

type UserNotifSettings = {
  dailyReminder?: boolean;
  reminderTime?: string;
  kandilNotifications?: boolean;
};

export type BackendUser = {
  _id: string;
  displayName?: string;
  profileImageUrl?: string;
  theme?: string;
  fontFamily?: "default" | "merriweather" | "intel-one-mono" | "finlandica-headline" | "indie-flower";
  hapticsEnabled?: boolean;
  isPremium?: boolean;
  createdAt?: string;
  onboarding?: {
    purpose?: string;
    completedAt?: string;
  };
  notifSettings?: UserNotifSettings;
};

export type UpdateOnboardingPayload = {
  purpose?: string;
};

export type UpdateUserPreferencesPayload = {
  theme?: string;
  fontFamily?: "default" | "merriweather" | "intel-one-mono" | "finlandica-headline" | "indie-flower";
  hapticsEnabled?: boolean;
  dailyReminder?: boolean;
  reminderTime?: string;
};

export class UsersApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "UsersApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();
// The API can cold-start, so requests need an upper bound instead of hanging forever.
const REQUEST_TIMEOUT_MS = 20_000;

export async function getUserById(userId: string, accessToken?: string): Promise<BackendUser> {
  return requestJson<BackendUser>(`/v1/users/${userId}`, {
    method: "GET",
    accessToken
  });
}

export async function saveUserOnboarding(
  userId: string,
  payload: UpdateOnboardingPayload,
  accessToken?: string
): Promise<BackendUser> {
  return requestJson<BackendUser>(`/v1/users/${userId}/onboarding`, {
    method: "PATCH",
    body: payload,
    accessToken
  });
}

export async function saveUserPreferences(
  userId: string,
  payload: UpdateUserPreferencesPayload,
  accessToken?: string
): Promise<BackendUser> {
  return requestJson<BackendUser>(`/v1/users/${userId}/preferences`, {
    method: "PATCH",
    body: payload,
    accessToken
  });
}

export async function deleteUser(userId: string, accessToken?: string): Promise<void> {
  await requestJson<void>(`/v1/users/${userId}`, { method: "DELETE", accessToken });
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
  options: {
    method: "GET" | "PATCH" | "DELETE";
    body?: unknown;
    accessToken?: string;
  }
): Promise<TResponse> {
  try {
    const headers: Record<string, string> = {
      "content-type": "application/json"
    };

    if (options.accessToken) {
      headers.authorization = `Bearer ${options.accessToken}`;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    let response: Response;
    try {
      response = await fetch(`${API_BASE_URL}${path}`, {
        method: options.method,
        headers,
        signal: controller.signal,
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
      });
    } finally {
      clearTimeout(timeoutId);
    }

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("users:errors.fetchFailed"));
      throw new UsersApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof UsersApiError) {
      throw error;
    }

    throw new UsersApiError("transient", i18n.t("users:errors.serverUnreachable"));
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
