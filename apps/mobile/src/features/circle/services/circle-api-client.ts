// Zikir Halkası API istemcisi. Sunucu sözleşmesi: apps/api/src/modules/circles/
// (v1/circles* — JwtAuthGuard, v1/circles/preview/:code hariç herkese açık).
import {
  CIRCLE_ERROR_CODE,
  type CircleDetail,
  type CircleErrorCode,
  type CirclePreview,
  type CircleSummary,
  type CreateCircleRequest
} from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { ApiError, request } from "../../../lib/http/client";

export { CIRCLE_ERROR_CODE };

export const CircleApiError = ApiError;
export type CircleApiError = ApiError;

const errors = () => ({
  failed: i18n.t("circle:errors.serviceUnavailable"),
  unreachable: i18n.t("circle:errors.serviceUnreachable")
});

function options(method: "GET" | "POST", body?: unknown, auth: boolean = true) {
  return {
    method,
    body,
    auth,
    headers: { "accept-language": i18n.language },
    errors: errors()
  };
}

export async function fetchCircles(): Promise<CircleSummary[]> {
  return request<CircleSummary[]>("/v1/circles", options("GET"));
}

export async function fetchCircle(id: string, date?: string): Promise<CircleDetail> {
  const query = date ? `?date=${encodeURIComponent(date)}` : "";
  return request<CircleDetail>(`/v1/circles/${encodeURIComponent(id)}${query}`, options("GET"));
}

export async function fetchCirclePreview(code: string): Promise<CirclePreview> {
  return request<CirclePreview>(`/v1/circles/preview/${encodeURIComponent(code)}`, options("GET", undefined, false));
}

export async function createCircle(body: CreateCircleRequest): Promise<CircleSummary> {
  return request<CircleSummary>("/v1/circles", options("POST", body));
}

export async function joinCircle(code: string): Promise<CircleSummary> {
  return request<CircleSummary>("/v1/circles/join", options("POST", { code }));
}

export async function leaveCircle(id: string): Promise<void> {
  await request<unknown>(`/v1/circles/${encodeURIComponent(id)}/leave`, options("POST"));
}

export async function closeCircle(id: string): Promise<void> {
  await request<unknown>(`/v1/circles/${encodeURIComponent(id)}/close`, options("POST"));
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
