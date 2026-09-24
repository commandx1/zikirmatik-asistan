import { i18n } from "../../../i18n";
import type { LocalizedText, VirdSlotKey } from "@zikirmatik/shared";
import {
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_UNAVAILABLE_CODE,
  DAILY_LIMIT_REACHED_CODE
} from "../../ai-shared/ai-error-codes";
import { ApiError, request } from "../../../lib/http/client";

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

/**
 * Sunucu tarafında geçici bir kesinti/hata durumunda (503) dönen kod.
 * Bu hata alındığında kredi düşülmemiştir — istemci aynı flowId ile
 * "Tekrar dene" seçeneği sunmalı (bkz. use-ai-guide.ts retryLastRequest).
 * Ortak tanım: ../../ai-shared/ai-error-codes (ai-chat ile paylaşılır).
 */
export { AI_CREDIT_INSUFFICIENT_CODE, AI_UNAVAILABLE_CODE, DAILY_LIMIT_REACHED_CODE };

export type BackendAiRecommendation = {
  _id: string;
  userId: string;
  freeText?: string;
  assistantNote?: string;
  recommendedDhikrIds: string[];
  selectedDhikrId?: string;
  createdAt: string;
};

export const AiApiError = ApiError;
export type AiApiError = ApiError;

const errors = () => ({
  failed: i18n.t("ai-guide:errors.serviceUnavailable"),
  unreachable: i18n.t("ai-guide:errors.serviceUnreachable")
});

function options(method: "GET" | "POST" | "PATCH", body?: unknown) {
  return {
    method,
    body,
    auth: true as const,
    headers: { "accept-language": i18n.language },
    errors: errors()
  };
}

export async function createAiRecommendation(
  payload: CreateAiRecommendationPayload
): Promise<CreateAiRecommendationResponse> {
  return request<CreateAiRecommendationResponse>(
    "/v1/ai/recommendations",
    options("POST", payload)
  );
}

export async function selectAiRecommendation(
  recommendationId: string,
  selectedDhikrId: string
) {
  return request(
    `/v1/ai/recommendations/${recommendationId}/select`,
    options("PATCH", { selectedDhikrId })
  );
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

export async function getAiCredits(): Promise<AiCredits> {
  return request<AiCredits>("/v1/ai/credits", options("GET"));
}

export async function getAiDailyQuota(): Promise<AiDailyQuota> {
  return request<AiDailyQuota>("/v1/ai/quota", options("GET"));
}

export async function listAiRecommendations() {
  return request<BackendAiRecommendation[]>("/v1/ai/recommendations", options("GET"));
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
  payload: CreateAiVirdProgramPayload
): Promise<CreateAiVirdProgramResponse> {
  return request<CreateAiVirdProgramResponse>(
    "/v1/ai/vird-programs",
    options("POST", payload)
  );
}
