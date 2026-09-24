// Vird API istemcisi. Sunucu sözleşmesi: apps/api/src/modules/vird/
// vird.controller.ts (v1/vird/programs*, v1/vird/today, v1/vird/history —
// hepsi JwtAuthGuard, accessToken ZORUNLU) ve vird-templates.controller.ts
// (v1/vird/templates* — OptionalJwtAuthGuard, misafir de erişebilir,
// accessToken OPSİYONEL). Desen ai-api-client.ts ile aynı (requestJson,
// {success,data} zarfını açma, hata code/message çıkarımı) — her istemci
// dosyası kasıtlı olarak kendi küçük kopyasını taşır, ortak taban yok (bkz.
// dhikrs-api-client.ts, ai-api-client.ts).
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
import { API_BASE_URL } from "../../../lib/env";

export type { CreateVirdProgramRequest, UpdateVirdProgramRequest, VirdProgram, VirdTodayResponse, VirdHistoryResponse };

export class VirdApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "VirdApiError";
  }
}

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

// --- Programlar (v1/vird/programs*) — accessToken zorunlu (JwtAuthGuard). ---

export async function fetchVirdPrograms(accessToken: string): Promise<VirdProgram[]> {
  const raw = await requestJson<RawVirdProgram[]>("/v1/vird/programs", { method: "GET", accessToken });
  return raw.map(mapProgram);
}

export async function createVirdProgram(payload: CreateVirdProgramRequest, accessToken: string): Promise<VirdProgram> {
  const raw = await requestJson<RawVirdProgram>("/v1/vird/programs", { method: "POST", body: payload, accessToken });
  return mapProgram(raw);
}

export async function fetchVirdProgram(id: string, accessToken: string): Promise<VirdProgram> {
  const raw = await requestJson<RawVirdProgram>(`/v1/vird/programs/${encodeURIComponent(id)}`, {
    method: "GET",
    accessToken
  });
  return mapProgram(raw);
}

export async function updateVirdProgram(id: string, payload: UpdateVirdProgramRequest, accessToken: string): Promise<VirdProgram> {
  const raw = await requestJson<RawVirdProgram>(`/v1/vird/programs/${encodeURIComponent(id)}`, {
    method: "PATCH",
    body: payload,
    accessToken
  });
  return mapProgram(raw);
}

export async function deleteVirdProgram(id: string, accessToken: string): Promise<{ deleted: true }> {
  return requestJson<{ deleted: true }>(`/v1/vird/programs/${encodeURIComponent(id)}`, {
    method: "DELETE",
    accessToken
  });
}

export async function activateVirdProgram(id: string, accessToken: string): Promise<VirdProgram> {
  const raw = await requestJson<RawVirdProgram>(`/v1/vird/programs/${encodeURIComponent(id)}/activate`, {
    method: "POST",
    accessToken
  });
  return mapProgram(raw);
}

// --- İlerleme (v1/vird/today, v1/vird/history) — accessToken zorunlu. ---

export async function fetchVirdToday(
  accessToken: string,
  date?: string,
  programId?: string
): Promise<VirdTodayResponse> {
  const params = new URLSearchParams();
  if (date) params.set("date", date);
  if (programId) params.set("programId", programId);
  const query = params.toString();
  const raw = await requestJson<RawVirdTodayResponse>(`/v1/vird/today${query ? `?${query}` : ""}`, {
    method: "GET",
    accessToken
  });
  return mapTodayResponse(raw);
}

export async function fetchVirdHistory(accessToken: string, range?: { from?: string; to?: string }): Promise<VirdHistoryResponse> {
  const params = new URLSearchParams();
  if (range?.from) params.set("from", range.from);
  if (range?.to) params.set("to", range.to);
  const query = params.toString();
  return requestJson<VirdHistoryResponse>(`/v1/vird/history${query ? `?${query}` : ""}`, {
    method: "GET",
    accessToken
  });
}

// --- Şablonlar (v1/vird/templates*) — accessToken OPSİYONEL (OptionalJwtAuthGuard,
// misafir çevrimdışı kullanabilsin diye). Sağlanırsa gönderilir (kişiselleştirme
// için ileride kullanılabilir) ama eksikse istek reddedilmez. ---

export async function fetchVirdTemplates(accessToken?: string): Promise<VirdTemplateSummary[]> {
  return requestJson<VirdTemplateSummary[]>("/v1/vird/templates", { method: "GET", accessToken });
}

export async function fetchVirdTemplate(key: string, accessToken?: string): Promise<VirdTemplateDetail> {
  return requestJson<VirdTemplateDetail>(`/v1/vird/templates/${encodeURIComponent(key)}`, {
    method: "GET",
    accessToken
  });
}

// --- İstek altyapısı (ai-api-client.ts / dhikrs-api-client.ts ile aynı desen). ---

async function requestJson<TResponse>(
  path: string,
  options: { method: "GET" | "POST" | "PATCH" | "DELETE"; body?: unknown; accessToken?: string }
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
      const message = extractErrorMessage(data, i18n.t("vird:errors.serviceUnavailable"));
      const code = extractErrorCode(data);
      throw new VirdApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof VirdApiError) {
      throw error;
    }

    throw new VirdApiError("transient", i18n.t("vird:errors.serviceUnreachable"));
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
