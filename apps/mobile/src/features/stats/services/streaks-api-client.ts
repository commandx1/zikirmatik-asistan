import { Platform } from "react-native";

export type BackendStreak = {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
  lastActiveDate?: string;
};

export class StreaksApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "StreaksApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function getUserStreak(userId: string): Promise<BackendStreak> {
  return requestJson<BackendStreak>(`/v1/streaks/${userId}`);
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

async function requestJson<TResponse>(path: string): Promise<TResponse> {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method: "GET",
      headers: {
        "content-type": "application/json"
      }
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, "İstatistik verisi alınamadı.");
      throw new StreaksApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof StreaksApiError) {
      throw error;
    }

    throw new StreaksApiError("transient", "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
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
