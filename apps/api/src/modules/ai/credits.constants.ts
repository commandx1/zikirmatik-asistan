export const AI_CREDIT_REASONS = {
  FREE_DAILY_GRANT: 'FREE_DAILY_GRANT',
  PREMIUM_MONTHLY_GRANT: 'PREMIUM_MONTHLY_GRANT',
  RECOMMENDATION_DEBIT: 'RECOMMENDATION_DEBIT',
  CHAT_MESSAGE_DEBIT: 'CHAT_MESSAGE_DEBIT',
  VIRD_PROGRAM_DEBIT: 'VIRD_PROGRAM_DEBIT',
  TOPUP_PURCHASE: 'TOPUP_PURCHASE',
  REFUND: 'REFUND',
} as const;

export type AiCreditReason =
  (typeof AI_CREDIT_REASONS)[keyof typeof AI_CREDIT_REASONS];

export const FREE_DAILY_CREDIT_AMOUNT = 1;
export const PREMIUM_MONTHLY_CREDIT_AMOUNT = 50;

// AI Vird Programı üretimi (POST /v1/ai/vird-programs) tek seferde bu kadar
// krediye mal olur — RECOMMENDATION_DEBIT/CHAT_MESSAGE_DEBIT'in aksine
// amount=1 değildir (bkz. ai-credits.service.ts ensureCreditAccessForFlow/
// debitCreditForFlow amount parametresi).
export const VIRD_PROGRAM_CREDIT_COST = 3;

// Kullanıcının hiç FREE_DAILY_GRANT almadığı ilk gün için tek seferlik
// karşılama bonusu; sonraki günler FREE_DAILY_CREDIT_AMOUNT'a döner.
export const FREE_SIGNUP_BONUS_CREDIT_AMOUNT = 3;

export const AI_CREDIT_INSUFFICIENT_CODE = 'AI_CREDIT_INSUFFICIENT';

/**
 * Kredi paketi kataloğunun tek kaynağı. Mobildeki CREDIT_TOPUP_CREDITS
 * (apps/mobile/src/features/subscriptions/services/revenuecat-client.ts)
 * ile birebir aynı product id ve miktarları içerir.
 * AI_CREDIT_TOPUP_PRODUCTS env değişkeni tanımlıysa bu default'u override eder.
 */
export const AI_CREDIT_DEFAULT_TOPUP_PRODUCTS: Record<string, number> = {
  topupsmall: 10,
  topupmedium: 30,
  topuplarge: 75,
};

// Kötüye kullanım sınırları (2026-10-08 kullanıcı kararı). Kira ve sayaç
// kullanıcının cüzdan belgesinde tutulur (kullanıcı başına tek belge, unique).
// Aynı anda tek AI isteği (öneri, vird programı, sohbet REST+SSE): ikincisi
// beklemeden 429 alır. Kira süresi en uzun AI isteğinin (ajan adımları × ≤45 sn
// zaman aşımı) üstünde; süreç ölürse kira bu süre sonunda kendiliğinden düşer.
export const AI_REQUEST_IN_FLIGHT_CODE = 'AI_REQUEST_IN_FLIGHT';
export const AI_REQUEST_LEASE_MS = 5 * 60_000;
// UTC günü başına kredi DÜŞMEYEN AI koşusu sınırı (konu dışı, netleştirme,
// 503/hata, iade, istemci kopması); ücretlenen koşular sayılmaz.
export const AI_DAILY_FREE_LIMIT_CODE = 'AI_DAILY_FREE_LIMIT';
export const AI_DAILY_FREE_RUN_LIMIT = 20;
