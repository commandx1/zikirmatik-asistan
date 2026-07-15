import { Platform } from "react-native";
import { i18n } from "../../../i18n";

export type BackendUserDhikr = {
  _id: string;
  userId: string;
  clientId: string;
  name: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target: number;
  isFavorite: boolean;
  createdAt?: string;
  updatedAt?: string;
};

export type CreateUserDhikrPayload = {
  clientId?: string;
  name?: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target?: number;
  isFavorite?: boolean;
};

export type UpdateUserDhikrPayload = {
  name?: string;
  transliteration?: string;
  arabic?: string;
  meaning?: string;
  target?: number;
  isFavorite?: boolean;
};

export class UserDhikrsApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "UserDhikrsApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function listUserDhikrs(accessToken?: string): Promise<BackendUserDhikr[]> {
  return requestJson<BackendUserDhikr[]>("/v1/user-dhikrs", {
    method: "GET",
    accessToken
  });
}

export async function createUserDhikr(
  payload: CreateUserDhikrPayload,
  accessToken?: string
): Promise<BackendUserDhikr> {
  return requestJson<BackendUserDhikr>("/v1/user-dhikrs", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function updateUserDhikrByClientId(
  clientId: string,
  payload: UpdateUserDhikrPayload,
  accessToken?: string
): Promise<BackendUserDhikr> {
  return requestJson<BackendUserDhikr>(`/v1/user-dhikrs/${encodeURIComponent(clientId)}`, {
    method: "PATCH",
    body: payload,
    accessToken
  });
}

export async function deleteUserDhikrByClientId(
  clientId: string,
  accessToken?: string
): Promise<{ deleted: boolean; clientId: string }> {
  return requestJson<{ deleted: boolean; clientId: string }>(`/v1/user-dhikrs/${encodeURIComponent(clientId)}`, {
    method: "DELETE",
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
  options: {
    method: "GET" | "POST" | "PATCH" | "DELETE";
    body?: unknown;
    accessToken?: string;
  }
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
      ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {})
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, i18n.t("dhikrs:errors.actionFailed"));
      throw new UserDhikrsApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof UserDhikrsApiError) {
      throw error;
    }

    throw new UserDhikrsApiError("transient", i18n.t("dhikrs:errors.serverUnreachable"));
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
