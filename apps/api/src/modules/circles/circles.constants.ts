import { randomInt } from 'node:crypto';

/**
 * Zikir Halkası limitleri, hata kodları ve push metinleri. vird.constants.ts
 * ile aynı desen: ForbiddenException({ code, message }) fırlatılırken code
 * alanı CIRCLE_ERROR_CODE.* değerlerinden biri olur.
 *
 * NOT: Bu dosya packages/shared/src/types/circle.ts içindeki istemci
 * aynasının sunucu kopyasıdır. apps/api @zikirmatik/shared'ı import EDEMEZ
 * (bkz. common/types/localized-text.ts başındaki nodenext açıklaması), bu
 * yüzden kodlar/limitler burada birebir tekrar edilir — iki dosya birlikte
 * güncellenmelidir.
 */

// Bir halkadaki en fazla üye sayısı.
export const CIRCLE_MAX_MEMBERS = 200;

// Bir kullanıcının aynı anda kurucusu olabileceği en fazla AKTİF halka.
export const CIRCLE_MAX_ACTIVE_PER_CREATOR = 10;

// Davet kodu alfabesi: karıştırılabilen 0/O/1/I harfleri kasıtlı olarak yok.
export const CIRCLE_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
export const CIRCLE_CODE_LENGTH = 8;

export const CIRCLE_ERROR_CODE = {
  PREMIUM_REQUIRED: 'CIRCLE_PREMIUM_REQUIRED',
  NOT_FOUND: 'CIRCLE_NOT_FOUND',
  NOT_ACTIVE: 'CIRCLE_NOT_ACTIVE',
  FULL: 'CIRCLE_FULL',
  MAX_ACTIVE: 'CIRCLE_MAX_ACTIVE',
  NOT_MEMBER: 'CIRCLE_NOT_MEMBER',
  DHIKR_MISMATCH: 'CIRCLE_DHIKR_MISMATCH',
  CREATOR_ONLY: 'CIRCLE_CREATOR_ONLY',
} as const;

export type CircleErrorCode =
  (typeof CIRCLE_ERROR_CODE)[keyof typeof CIRCLE_ERROR_CODE];

export const CIRCLE_ERROR_MESSAGE: Record<CircleErrorCode, string> = {
  [CIRCLE_ERROR_CODE.PREMIUM_REQUIRED]:
    'Zikir halkası kurmak premium üyelik gerektirir.',
  [CIRCLE_ERROR_CODE.NOT_FOUND]: 'Zikir halkası bulunamadı.',
  [CIRCLE_ERROR_CODE.NOT_ACTIVE]: 'Bu zikir halkası artık aktif değil.',
  [CIRCLE_ERROR_CODE.FULL]: `Bu zikir halkası dolu (en fazla ${CIRCLE_MAX_MEMBERS} kişi).`,
  [CIRCLE_ERROR_CODE.MAX_ACTIVE]: `En fazla ${CIRCLE_MAX_ACTIVE_PER_CREATOR} aktif zikir halkan olabilir.`,
  [CIRCLE_ERROR_CODE.NOT_MEMBER]: 'Bu zikir halkasının üyesi değilsin.',
  [CIRCLE_ERROR_CODE.DHIKR_MISMATCH]: 'Bu kayıt halkanın zikriyle eşleşmiyor.',
  [CIRCLE_ERROR_CODE.CREATOR_ONLY]:
    'Halkanın kurucusu ayrılamaz; halkayı kapatabilirsin.',
};

/** Davet kodu üretir. Kriptografik rastgelelik (node:crypto randomInt) —
 * kodun tahmin edilmesi bir yabancının halkaya katılmasını sağlardı. */
export function generateCircleCode(): string {
  let code = '';
  for (let index = 0; index < CIRCLE_CODE_LENGTH; index += 1) {
    code += CIRCLE_CODE_ALPHABET[randomInt(CIRCLE_CODE_ALPHABET.length)];
  }
  return code;
}

// --- Push metinleri (yalnız TR; bkz. push-campaigns/templates.ts) ---

export function circleCompletedPush(name: string): {
  title: string;
  body: string;
} {
  return {
    title: 'Halka hedefini tamamladı',
    body: `"${name}" halkası hedefe ulaştı. Emeğin kabul olsun.`,
  };
}

export function circleMemberJoinedPush(
  displayName: string,
  name: string,
): { title: string; body: string } {
  return {
    title: 'Halkana yeni katılım',
    body: `${displayName}, "${name}" halkana katıldı.`,
  };
}
