import type { VirdSlotKey } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

// --- Vird programı alanları (opsiyonel) ---
// Bir log bir vird programının bir dilimine bağlıysa doldurulur (bkz.
// apps/api/src/modules/dhikr-logs/schemas/dhikr-log.schema.ts — aynı adlarla
// birebir sunucu karşılığı). Sunucu bu alanları GÖRDÜĞÜNDE dhikr_logs'u
// (userId, dhikrId/customDhikrId, date, virdProgramId, virdSlot,
// virdPrayerIndex) anahtarıyla upsert eder ve vird ilerlemesini bu logdan
// türetir (VirdProgressService.applyLogWrite) — vird'in kendi ayrı bir
// "ilerleme yaz" ucu YOKTUR, tek kaynak dhikr-logs'tur. bkz.
// features/vird/hooks/use-vird-counter-bridge.ts.
export type VirdLogFields = {
  virdProgramId?: string;
  virdSlot?: VirdSlotKey;
  virdDayIndex?: number;
  /** Yalnız virdSlot:'prayer' için anlamlıdır (1..5). */
  virdPrayerIndex?: number;
};

export type BackendDhikrLog = {
  _id: string;
  userId: string;
  dhikrId?: string;
  customDhikrId?: string;
  customDhikrName?: string;
  customDhikrArabic?: string;
  count: number;
  targetCount: number;
  date: string;
  source?: "manual" | "ai" | "special-day" | "notification" | "circle";
  aiRecommendationId?: string;
  aiPrompt?: string;
  aiAssistantNote?: string;
  isCompleted: boolean;
  isFavorite?: boolean;
  createdAt?: string;
  /** Bir log bir Zikir Halkası'na bağlıysa doldurulur (bkz.
   * features/circle/services/circle-share.ts buildCircleLogPayload). */
  circleId?: string;
  /** Halka logunda sunucunun aynı yanıtta döndürdüğü güncel halka toplamı
   * (bkz. circle-session-screen.tsx flush) — yoksa toplam tazelemesi atlanır. */
  circleTotalCount?: number;
} & VirdLogFields;

export type CreateDhikrLogPayload = {
  userId: string;
  dhikrId?: string;
  customDhikrId?: string;
  customDhikrName?: string;
  customDhikrArabic?: string;
  aiRecommendationId?: string;
  aiPrompt?: string;
  aiAssistantNote?: string;
  count: number;
  targetCount: number;
  date: string;
  source?: "manual" | "ai" | "special-day" | "notification" | "circle";
  isCompleted?: boolean;
  isFavorite?: boolean;
  circleId?: string;
} & VirdLogFields;

export const DhikrLogsApiError = ApiError;
export type DhikrLogsApiError = ApiError;

const errors = () => ({
  failed: i18n.t("dhikrs:errors.logActionFailed"),
  unreachable: i18n.t("dhikrs:errors.serverUnreachable")
});

function options(method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown) {
  return {
    method,
    body,
    auth: true as const,
    errors: errors()
  };
}

export async function listDhikrLogsByUser(
  userId: string,
  dateFrom?: string,
  dateTo?: string
): Promise<BackendDhikrLog[]> {
  const params = new URLSearchParams({ userId });
  if (dateFrom) {
    params.set("dateFrom", dateFrom);
  }
  if (dateTo) {
    params.set("dateTo", dateTo);
  }

  return request<BackendDhikrLog[]>(`/v1/dhikr-logs?${params.toString()}`, options("GET"));
}

export async function createDhikrLog(payload: CreateDhikrLogPayload): Promise<BackendDhikrLog> {
  return request<BackendDhikrLog>("/v1/dhikr-logs", options("POST", payload));
}

export async function deleteDhikrLogsByKey(payload: {
  dhikrId?: string;
  customDhikrId?: string;
}): Promise<{ deleted: boolean; deletedCount: number }> {
  const params = new URLSearchParams();
  if (payload.dhikrId?.trim()) {
    params.set("dhikrId", payload.dhikrId.trim());
  }
  if (payload.customDhikrId?.trim()) {
    params.set("customDhikrId", payload.customDhikrId.trim());
  }

  return request<{ deleted: boolean; deletedCount: number }>(
    `/v1/dhikr-logs/by-dhikr?${params.toString()}`,
    options("DELETE")
  );
}

export async function setDhikrFavoriteByKey(payload: {
  dhikrId?: string;
  customDhikrId?: string;
  isFavorite: boolean;
}): Promise<{ updated: boolean; matchedCount: number; modifiedCount: number; isFavorite: boolean }> {
  return request<{ updated: boolean; matchedCount: number; modifiedCount: number; isFavorite: boolean }>(
    "/v1/dhikr-logs/favorite/by-dhikr",
    options("PATCH", payload)
  );
}
