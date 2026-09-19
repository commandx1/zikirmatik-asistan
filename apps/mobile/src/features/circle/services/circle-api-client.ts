// Zikir Halkası API istemcisi. Sunucu sözleşmesi: apps/api/src/modules/circles/
// (v1/circles* — JwtAuthGuard, v1/circles/preview/:code hariç herkese açık).
// Desen vird-api-client.ts ile aynı (requestJson, {success,data} zarfını açma,
// hata code/message çıkarımı) — her istemci dosyası kasıtlı olarak kendi küçük
// kopyasını taşır, ortak taban yok (bkz. vird-api-client.ts dosya başı notu).
import { Platform } from "react-native";
import {
  CIRCLE_ERROR_CODE,
  type CircleDetail,
  type CircleErrorCode,
  type CirclePreview,
  type CircleSummary,
  type CreateCircleRequest
} from "@zikirmatik/shared";
import { i18n } from "../../../i18n";

export { CIRCLE_ERROR_CODE };

export class CircleApiError extends Error {
  constructor(
    public readonly kind: "transient" | "terminal",
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = "CircleApiError";
  }
}

export async function fetchCircles(accessToken: string): Promise<CircleSummary[]> {
  return requestJson<CircleSummary[]>("/v1/circles", { method: "GET", accessToken });
}

export async function fetchCircle(id: string, accessToken: string, date?: string): Promise<CircleDetail> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return requestJson<CircleDetail>(`/v1/circles/${encodeURIComponent(id)}${query}`, { method: "GET", accessToken });
}

export async function fetchCirclePreview(code: string): Promise<CirclePreview> {
  return requestJson<CirclePreview>(`/v1/circles/preview/${encodeURIComponent(code)}`, { method: "GET" });
}

export async function createCircle(body: CreateCircleRequest, accessToken: string): Promise<CircleSummary> {
  return requestJson<CircleSummary>("/v1/circles", { method: "POST", body, accessToken });
}

export async function joinCircle(code: string, accessToken: string): Promise<CircleSummary> {
  return requestJson<CircleSummary>("/v1/circles/join", { method: "POST", body: { code }, accessToken });
}

export async function leaveCircle(id: string, accessToken: string): Promise<void> {
  await requestJson<unknown>(`/v1/circles/${encodeURIComponent(id)}/leave`, { method: "POST", accessToken });
}

export async function closeCircle(id: string, accessToken: string): Promise<void> {
  await requestJson<unknown>(`/v1/circles/${encodeURIComponent(id)}/close`, { method: "POST", accessToken });
}

// CIRCLE_ERROR_CODE.* -> circle.json çeviri anahtarı (bkz. vird-error-codes.ts
// ile aynı desen, tek fark: bu görevde ayrı bir dosyaya çıkarılmadı, bu
// istemci zaten hataları burada işliyor).
const CIRCLE_ERROR_MESSAGE_KEY: Record<CircleErrorCode, string> = {
  [CIRCLE_ERROR_CODE.PREMIUM_REQUIRED]: "circle:errors.premiumRequired",
  [CIRCLE_ERROR_CODE.NOT_FOUND]: "circle:errors.notFound",
  [CIRCLE_ERROR_CODE.NOT_ACTIVE]: "circle:errors.notActive",
  [CIRCLE_ERROR_CODE.FULL]: "circle:errors.full",
  [CIRCLE_ERROR_CODE.MAX_ACTIVE]: "circle:errors.maxActive",
  [CIRCLE_ERROR_CODE.NOT_MEMBER]: "circle:errors.notMember",
  [CIRCLE_ERROR_CODE.DHIKR_MISMATCH]: "circle:errors.dhikrMismatch",
  [CIRCLE_ERROR_CODE.CREATOR_ONLY]: "circle:errors.creatorOnly"
};

function isCircleErrorCode(code: unknown): code is CircleErrorCode {
  return typeof code === "string" && (Object.values(CIRCLE_ERROR_CODE) as string[]).includes(code);
}

/** Bilinen bir CIRCLE_ERROR_CODE için yerelleştirilmiş kullanıcı mesajı döner;
 * kod yoksa/tanınmıyorsa `fallback` döner (bkz. vird-error-codes.ts). */
export function resolveCircleErrorMessage(code: string | undefined, fallback: string): string {
  if (code && isCircleErrorCode(code)) {
    return i18n.t(CIRCLE_ERROR_MESSAGE_KEY[code]);
  }
  return fallback;
}

// --- İstek altyapısı (vird-api-client.ts ile aynı desen). ---

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";
  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${port}`;
}

const API_BASE_URL = resolveApiBaseUrl();

async function requestJson<TResponse>(
  path: string,
  options: { method: "GET" | "POST"; body?: unknown; accessToken?: string }
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
      const message = extractErrorMessage(data, i18n.t("circle:errors.serviceUnavailable"));
      const code = extractErrorCode(data);
      throw new CircleApiError(response.status >= 500 ? "transient" : "terminal", message, response.status, code);
    }

    return (data ?? {}) as TResponse;
  } catch (error) {
    if (error instanceof CircleApiError) {
      throw error;
    }

    throw new CircleApiError("transient", i18n.t("circle:errors.serviceUnreachable"));
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
