import { Platform } from "react-native";
import { i18n } from "../../../i18n";
import type { LocalizedText, VirdSlotKey } from "@zikirmatik/shared";
import { AI_UNAVAILABLE_CODE } from "../../ai-shared/ai-error-codes";

export type CreateAiRecommendationPayload = {
  userId: string;
  flowId: string;
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

export type CreateAiRecommendationItem = {
  id: string;
  name: LocalizedText;
  nameArabic: string;
  transliteration: LocalizedText;
  meaning: LocalizedText;
  virtue?: LocalizedText;
  source?: LocalizedText;
  recommendedCount?: number;
};

/**
 * Yeni sözleşme `kind` alanıyla ayrımlanır (recommendations/offTopic/
 * clarification). `offTopic`/`needsClarification` bayrakları geriye
 * dönük uyumluluk için hâlâ okunabilir durumda — API `kind`'ı henüz
 * göndermiyorsa bu bayraklara göre karar verilir (bkz.
 * isAiOffTopicResponse / isAiClarificationResponse).
 */
export type CreateAiRecommendationResponse =
  | {
      kind?: "offTopic";
      offTopic: true;
      needsClarification?: false;
      message: string;
      recommendedIds: [];
      items: [];
      usedModel: "openai";
    }
  | {
      kind?: "clarification";
      offTopic?: false;
      needsClarification: true;
      /** AI tarafından üretilen tek cümlelik netleştirme sorusu. */
      message: string;
      // Not: sunucu geriye dönük uyumluluk için hâlâ legacy bir kategori
      // dizisi alanı gönderiyor (her zaman boş, kaldırılacak) — istemci
      // artık kategori seçim akışı kullanmadığından bilerek tipe eklenmedi.
      recommendedIds: [];
      items: [];
      usedModel: "openai";
    }
  | {
      kind?: "recommendations";
      offTopic?: false;
      needsClarification?: false;
      recommendationId: string;
      recommendedIds: string[];
      reasoning: string;
      items: CreateAiRecommendationItem[];
      usedModel: "openai" | "fallback" | "retrieval" | "cache";
      locale?: string;
      remainingCredits?: number;
    };

export type AiOffTopicRecommendationResponse = Extract<
  CreateAiRecommendationResponse,
  { offTopic: true }
>;
export type AiClarificationRecommendationResponse = Extract<
  CreateAiRecommendationResponse,
  { needsClarification: true }
>;

/**
 * `response.kind` sunucudan geliyorsa onu kullanır; henüz gelmiyorsa eski
 * `offTopic` bayrağına düşer. Rollout sırası garanti edilmediği için her
 * iki şekil de desteklenir (bkz. görev tanımı).
 */
export function isAiOffTopicResponse(
  response: CreateAiRecommendationResponse
): response is AiOffTopicRecommendationResponse {
  return response.kind ? response.kind === "offTopic" : Boolean(response.offTopic);
}

/**
 * `response.kind` sunucudan geliyorsa onu kullanır; henüz gelmiyorsa eski
 * `needsClarification` bayrağına düşer.
 */
export function isAiClarificationResponse(
  response: CreateAiRecommendationResponse
): response is AiClarificationRecommendationResponse {
  return response.kind ? response.kind === "clarification" : Boolean(response.needsClarification);
}

export const DAILY_LIMIT_REACHED_CODE = "DAILY_LIMIT_REACHED";
export const AI_CREDIT_INSUFFICIENT_CODE = "AI_CREDIT_INSUFFICIENT";
/**
 * Sunucu tarafında geçici bir kesinti/hata durumunda (503) dönen kod.
 * Bu hata alındığında kredi düşülmemiştir — istemci aynı flowId ile
 * "Tekrar dene" seçeneği sunmalı (bkz. use-ai-guide.ts retryLastRequest).
 * Ortak tanım: ../../ai-shared/ai-error-codes (ai-chat ile paylaşılır).
 */
export { AI_UNAVAILABLE_CODE };

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

export type AiCredits = {
  balance: number;
  isPremium: boolean;
  dailyGrant: number;
  monthlyGrant: number;
};

export async function getAiCredits(accessToken?: string): Promise<AiCredits> {
  return requestJson<AiCredits>("/v1/ai/credits", {
    method: "GET",
    accessToken
  });
}

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

// --- AI Vird Programı (POST /v1/ai/vird-programs) — sözleşme: docs/vird-programi.md
// §3 + apps/api/src/modules/ai/{dto/create-ai-vird-program.dto.ts,ai-vird.service.ts}.
// `userId` payload'da YOKTUR (sunucu @CurrentUserId() ile JWT'den okur) — yukarıdaki
// CreateAiRecommendationPayload.userId deseninden BİLİNÇLİ bir sapma (bkz. dosya başı
// notu create-ai-vird-program.dto.ts). 3 kredi (VIRD_PROGRAM_CREDIT_COST); hata kodları
// AI_CREDIT_INSUFFICIENT_CODE / AI_UNAVAILABLE_CODE ile aynı (yukarıda tanımlı).

export type CreateAiVirdProgramPayload = {
  flowId: string;
  freeText?: string;
  durationDays: 7 | 14 | 30;
  slots: VirdSlotKey[];
  prayerSelection?: number[];
  locale?: "tr" | "en";
};

export type AiVirdProgramPreviewItem = {
  dhikrId: string;
  /** Sunucu her zaman dhikr.name.tr döner (bkz. AiVirdService.buildPreview) — tek locale'lik düz metin, LocalizedText DEĞİL. */
  name: string;
  target: number;
};

export type AiVirdProgramPreviewPhase = {
  fromDay: number;
  /** null = bir sonraki faza/sonsuza dek sürer. */
  toDay: number | null;
  note?: string;
  slots: Partial<Record<VirdSlotKey, AiVirdProgramPreviewItem[]>>;
};

export type AiVirdProgramPreview = {
  title: string;
  summary: string;
  durationDays: number;
  phases: AiVirdProgramPreviewPhase[];
};

export type CreateAiVirdProgramResponse =
  | { kind: "offTopic"; message: string }
  | {
      kind: "program";
      programId: string;
      program: AiVirdProgramPreview;
      remainingCredits: number;
    };

export type AiVirdOffTopicResponse = Extract<CreateAiVirdProgramResponse, { kind: "offTopic" }>;

export function isAiVirdProgramOffTopicResponse(
  response: CreateAiVirdProgramResponse
): response is AiVirdOffTopicResponse {
  return response.kind === "offTopic";
}

/**
 * `POST /v1/ai/vird-programs` — üretilen program her zaman `draft` olarak
 * kaydedilir (aktivasyon için bkz. features/vird/services/vird-api-client.ts
 * activateVirdProgram). Aynı `flowId` ile ikinci çağrı agent'ı yeniden
 * çalıştırmaz/kredi düşmez (idempotent) — 503 (AI_UNAVAILABLE_CODE) sonrası
 * aynı flowId ile tekrar denemek güvenlidir.
 */
export async function createAiVirdProgram(
  payload: CreateAiVirdProgramPayload,
  accessToken?: string
): Promise<CreateAiVirdProgramResponse> {
  return requestJson<CreateAiVirdProgramResponse>("/v1/ai/vird-programs", {
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
      const message = extractErrorMessage(data, i18n.t("ai-guide:errors.serviceUnavailable"));
      const code = extractErrorCode(data);
      throw new AiApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof AiApiError) {
      throw error;
    }

    throw new AiApiError("transient", i18n.t("ai-guide:errors.serviceUnreachable"));
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
