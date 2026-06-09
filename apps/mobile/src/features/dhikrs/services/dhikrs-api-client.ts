import { Platform } from "react-native";

export type BackendDhikr = {
  _id: string;
  nameArabic: string;
  nameTurkish: string;
  transliteration: string;
  meaning: string;
  virtue?: string;
  source?: string;
  recommendedCount: number;
};

export class DhikrsApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number
  ) {
    super(message);
    this.name = "DhikrsApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function listVerifiedActiveDhikrs(): Promise<BackendDhikr[]> {
  return requestJson<BackendDhikr[]>("/v1/dhikrs/verified-active");
}

export async function findVerifiedActiveDhikrByTransliteration(transliteration: string): Promise<BackendDhikr> {
  return requestJson<BackendDhikr>(
    `/v1/dhikrs/lookup?transliteration=${encodeURIComponent(transliteration)}`
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
      const message = extractErrorMessage(data, "Zikir listesi alınamadı.");
      throw new DhikrsApiError(response.status >= 500 ? "transient" : "terminal", message, response.status);
    }

    return (data ?? []) as TResponse;
  } catch (error) {
    if (error instanceof DhikrsApiError) {
      throw error;
    }

    throw new DhikrsApiError("transient", "Sunucuya ulaşılamıyor. Lütfen tekrar deneyin.");
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
