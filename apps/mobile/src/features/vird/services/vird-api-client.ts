// Vird API istemcisi. Sunucu sözleşmesi: apps/api/src/modules/vird/
// vird.controller.ts (v1/vird/programs*, v1/vird/today, v1/vird/history —
// hepsi JwtAuthGuard, accessToken ZORUNLU) ve vird-templates.controller.ts
// (v1/vird/templates* — OptionalJwtAuthGuard, misafir de erişebilir,
// accessToken OPSİYONEL).
//
// Sunucu yanıtları ham "lean" Mongo belgeleridir: `_id` (ObjectId'nin string
// hali) ve Date alanları ISO string olarak gelir. Bu dosya her programı
// `_id` -> `id` eşlemesiyle @zikirmatik/shared'deki VirdProgram şekline
// çevirir; diğer alanlar zaten sunucu ile aynı isimdedir.
import type {
  CreateVirdProgramRequest,
  UpdateVirdProgramRequest,
  VirdHistoryResponse,
  VirdProgram,
  VirdTemplateDetail,
  VirdTemplateSummary,
  VirdTodayResponse
} from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export type { CreateVirdProgramRequest, UpdateVirdProgramRequest, VirdProgram, VirdTodayResponse, VirdHistoryResponse };

export const VirdApiError = ApiError;
export type VirdApiError = ApiError;

// --- Ham (sunucu) belge şekilleri: _id, id yerine. ---
type RawVirdProgram = Omit<VirdProgram, "id"> & { _id: string };
type RawVirdTodayResponse = Omit<VirdTodayResponse, "program"> & { program: RawVirdProgram | null };

function mapProgram(raw: RawVirdProgram): VirdProgram {
  const { _id, ...rest } = raw;
  return { id: _id, ...rest };
}

function mapTodayResponse(raw: RawVirdTodayResponse): VirdTodayResponse {
  return { ...raw, program: raw.program ? mapProgram(raw.program) : null };
}

const errors = () => ({
  failed: i18n.t("vird:errors.serviceUnavailable"),
  unreachable: i18n.t("vird:errors.serviceUnreachable")
});

function options(method: "GET" | "POST" | "PATCH" | "DELETE", body?: unknown) {
  return {
    method,
    body,
    auth: true as const,
    headers: { "accept-language": i18n.language },
    errors: errors()
  };
}

// --- Programlar (v1/vird/programs*) — accessToken zorunlu (JwtAuthGuard). ---

export async function fetchVirdPrograms(): Promise<VirdProgram[]> {
  const raw = await request<RawVirdProgram[]>("/v1/vird/programs", options("GET"));
  return raw.map(mapProgram);
}

export async function createVirdProgram(payload: CreateVirdProgramRequest): Promise<VirdProgram> {
  const raw = await request<RawVirdProgram>("/v1/vird/programs", options("POST", payload));
  return mapProgram(raw);
}

export async function fetchVirdProgram(id: string): Promise<VirdProgram> {
  const raw = await request<RawVirdProgram>(`/v1/vird/programs/${encodeURIComponent(id)}`, options("GET"));
  return mapProgram(raw);
}

export async function updateVirdProgram(id: string, payload: UpdateVirdProgramRequest): Promise<VirdProgram> {
  const raw = await request<RawVirdProgram>(
    `/v1/vird/programs/${encodeURIComponent(id)}`,
    options("PATCH", payload)
  );
  return mapProgram(raw);
}

export async function deleteVirdProgram(id: string): Promise<{ deleted: true }> {
  return request<{ deleted: true }>(`/v1/vird/programs/${encodeURIComponent(id)}`, options("DELETE"));
}

export async function activateVirdProgram(id: string): Promise<VirdProgram> {
  const raw = await request<RawVirdProgram>(
    `/v1/vird/programs/${encodeURIComponent(id)}/activate`,
    options("POST")
  );
  return mapProgram(raw);
}

// --- İlerleme (v1/vird/today, v1/vird/history) — accessToken zorunlu. ---

export async function fetchVirdToday(date?: string, programId?: string): Promise<VirdTodayResponse> {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (programId) params.set("programId", programId);
  const query = params.toString();
  const raw = await request<RawVirdTodayResponse>(
    `/v1/vird/today${query ? `?${query}` : ""}`,
    options("GET")
  );
  return mapTodayResponse(raw);
}

export async function fetchVirdHistory(range?: { from?: string; to?: string }): Promise<VirdHistoryResponse> {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const query = params.toString();
  return request<VirdHistoryResponse>(`/v1/vird/history${query ? `?${query}` : ""}`, options("GET"));
}

// --- Şablonlar (v1/vird/templates*) — accessToken OPSİYONEL (OptionalJwtAuthGuard,
// misafir çevrimdışı kullanabilsin diye). `auth: true` sağlanabiliyorsa token'ı
// otomatik ekler, oturum yoksa eksik gönderilir; istek reddedilmez. ---

export async function fetchVirdTemplates(): Promise<VirdTemplateSummary[]> {
  return request<VirdTemplateSummary[]>("/v1/vird/templates", options("GET"));
}

export async function fetchVirdTemplate(key: string): Promise<VirdTemplateDetail> {
  return request<VirdTemplateDetail>(`/v1/vird/templates/${encodeURIComponent(key)}`, options("GET"));
}
