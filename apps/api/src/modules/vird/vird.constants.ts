/**
 * Vird Programı limitleri ve hata kodları. Sayısal limitler ve hata kodu
 * string'leri kasıtlı olarak aynı isimlendirmeyi taşır (bkz. ai/credits.constants.ts
 * AI_CREDIT_INSUFFICIENT_CODE deseni) — ForbiddenException({ code, message })
 * fırlatılırken code alanı VIRD_ERROR_CODE.* değerlerinden biri olur.
 */

// Ücretsiz planda MANUEL (source: 'manual') bir programda izin verilen en
// fazla distinct zikir sayısı (dhikrId veya customDhikrId bazında). AI/şablon
// kaynaklı programlar bu sınırdan muaftır.
export const VIRD_FREE_LIMIT_DHIKRS = 3;

// Ücretsiz planda aynı anda en fazla bu kadar AKTİF program olabilir.
export const VIRD_FREE_LIMIT_ACTIVE = 1;

// Premium planda aynı anda en fazla bu kadar AKTİF program olabilir.
export const PREMIUM_MAX_ACTIVE_PROGRAMS = 10;

// Kullanıcı başına saklanan arşivlenmiş program tavanı — aşılınca en eski
// (updatedAt en küçük) arşivlenmiş program(lar) silinir.
export const VIRD_ARCHIVE_MAX = 20;

// Taslak (draft) programlar bu kadar gün sonra otomatik silinir (TTL index,
// bkz. vird-program.schema.ts expiresAt). Aktifleştirilen/duraklatılan/
// tamamlanan/arşivlenen programlarda expiresAt temizlenir.
export const VIRD_DRAFT_EXPIRES_AFTER_DAYS = 30;

export const VIRD_ERROR_CODE = {
  FREE_LIMIT_DHIKRS: 'VIRD_FREE_LIMIT_DHIKRS',
  FREE_LIMIT_ACTIVE: 'VIRD_FREE_LIMIT_ACTIVE',
  PREMIUM_REQUIRED: 'VIRD_PREMIUM_REQUIRED',
  PREMIUM_MAX_ACTIVE_PROGRAMS: 'PREMIUM_MAX_ACTIVE_PROGRAMS',
} as const;

export type VirdErrorCode =
  (typeof VIRD_ERROR_CODE)[keyof typeof VIRD_ERROR_CODE];

export const VIRD_ERROR_MESSAGE: Record<VirdErrorCode, string> = {
  [VIRD_ERROR_CODE.FREE_LIMIT_DHIKRS]: `Ücretsiz planda manuel vird programında en fazla ${VIRD_FREE_LIMIT_DHIKRS} farklı zikir olabilir. Premium'a geçerek sınırsız ekleyebilirsin.`,
  [VIRD_ERROR_CODE.FREE_LIMIT_ACTIVE]: `Ücretsiz planda en fazla ${VIRD_FREE_LIMIT_ACTIVE} aktif vird programın olabilir. Premium'a geçerek daha fazla program aktifleştirebilirsin.`,
  [VIRD_ERROR_CODE.PREMIUM_REQUIRED]:
    'Bu özellik (hatırlatıcı, şablon veya AI ile program oluşturma) premium üyelik gerektirir.',
  [VIRD_ERROR_CODE.PREMIUM_MAX_ACTIVE_PROGRAMS]: `En fazla ${PREMIUM_MAX_ACTIVE_PROGRAMS} aktif vird programın olabilir.`,
};
