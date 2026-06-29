import { Platform } from "react-native";

export type CreateAiRecommendationPayload = {
  userId: string;
  freeText?: string;
  timeContext?: {
    hour: number;
    dayOfWeek: number;
    isSpecialDay: boolean;
    specialDayName?: string;
  };
  maxRecommendations?: number;
  socketId?: string;
};

export type CreateAiRecommendationResponse =
  | {
      offTopic: true;
      message: string;
      recommendedIds: [];
      items: [];
      usedModel: "openai";
    }
  | {
      offTopic?: false;
      recommendationId: string;
      recommendedIds: string[];
      reasoning: string;
      items: Array<{
        id: string;
        nameTurkish: string;
        nameArabic: string;
        transliteration: string;
        meaning: string;
        virtue?: string;
        source?: string;
        recommendedCount?: number;
      }>;
      usedModel: "openai" | "fallback" | "retrieval" | "cache";
      dailyFreeUsed?: number;
    };

export const DAILY_LIMIT_REACHED_CODE = "DAILY_LIMIT_REACHED";
export const FREE_DAILY_LIMIT = 2;

export type BackendAiRecommendation = {
  _id: string;
  userId: string;
  freeText?: string;
  assistantNote?: string;
  recommendedDhikrIds: string[];
  selectedDhikrId?: string;
  createdAt: string;
};

export class AiApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "AiApiError";
  }
}

const API_BASE_URL = resolveApiBaseUrl();

export async function createAiRecommendation(
  payload: CreateAiRecommendationPayload,
  accessToken?: string
): Promise<CreateAiRecommendationResponse> {
  return requestJson<CreateAiRecommendationResponse>("/v1/ai/recommendations", {
    method: "POST",
    body: payload,
    accessToken
  });
}

export async function selectAiRecommendation(
  recommendationId: string,
  selectedDhikrId: string,
  accessToken?: string
) {
  return requestJson(`/v1/ai/recommendations/${recommendationId}/select`, {
    method: "PATCH",
    body: { selectedDhikrId },
    accessToken
  });
}

export type AiDailyQuota = {
  used: number;
  limit: number | null;
  isPremium: boolean;
};

export async function getAiDailyQuota(accessToken?: string): Promise<AiDailyQuota> {
  return requestJson<AiDailyQuota>("/v1/ai/quota", {
    method: "GET",
    accessToken
  });
}

export async function listAiRecommendations(accessToken?: string) {
  return requestJson<BackendAiRecommendation[]>("/v1/ai/recommendations", {
    method: "GET",
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
  options: { method: "GET" | "POST" | "PATCH"; body?: unknown; accessToken?: string }
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
      body: options.body === undefined ? undefined : JSON.stringify(options.body)
    });

    const rawResponse = await response.text();
    const parsed = safeParseJson(rawResponse);
    const data = unwrapDataEnvelope(parsed);

    if (!response.ok) {
      const message = extractErrorMessage(data, "Asistan servisi şu anda yanıt veremiyor.");
      const code = extractErrorCode(data);
      throw new AiApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof AiApiError) {
      throw error;
    }

    throw new AiApiError("transient", "Asistan servisine ulaşılamadı. Lütfen tekrar deneyin.");
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
