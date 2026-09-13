// Vird API'sinin tipli hata kodları. Sunucu ForbiddenException({code, message})
// fırlattığında (bkz. apps/api/src/modules/vird/vird.constants.ts) yanıt gövdesi
// düz bir { statusCode, code, message } nesnesidir (global success zarfı olan
// {success:true,data} yalnız BAŞARILI yanıtlara uygulanır — bkz.
// apps/api/src/common/interceptors/response-transform.interceptor.ts).
// vird-api-client.ts bu koddan VirdApiError.code'u doldurur.
import { VIRD_ERROR_CODE, type VirdErrorCode } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";

export { VIRD_ERROR_CODE };
export type { VirdErrorCode };

export function isVirdErrorCode(code: unknown): code is VirdErrorCode {
  return typeof code === "string" && (Object.values(VIRD_ERROR_CODE) as string[]).includes(code);
}

// VIRD_ERROR_CODE.* -> vird.json çeviri anahtarı. UI bu anahtarla i18n.t(...)
// çağırabilir; henüz tanınmayan bir kod (ör. sunucu yeni bir kod eklemiş)
// generic bir hata anahtarına düşer.
const VIRD_ERROR_MESSAGE_KEY: Record<VirdErrorCode, string> = {
  [VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS]: "vird:errors.freeLimitDhikrs",
  [VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE]: "vird:errors.freeLimitActive",
  [VIRD_ERROR_CODE.PREMIUM_REQUIRED]: "vird:errors.premiumRequired",
  [VIRD_ERROR_CODE.PREMIUM_MAX_ACTIVE_PROGRAMS]: "vird:errors.premiumMaxActivePrograms"
};

/**
 * Bilinen bir VIRD_ERROR_CODE için yerelleştirilmiş kullanıcı mesajı döner;
 * kod yoksa/tanınmıyorsa (network hatası, 404, vb.) `fallback` döner.
 */
export function resolveVirdErrorMessage(code: string | undefined, fallback: string): string {
  if (code && isVirdErrorCode(code)) {
    return i18n.t(VIRD_ERROR_MESSAGE_KEY[code]);
  }
  return fallback;
}
