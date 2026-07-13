export const AI_CREDIT_REASONS = {
  FREE_DAILY_GRANT: 'FREE_DAILY_GRANT',
  PREMIUM_MONTHLY_GRANT: 'PREMIUM_MONTHLY_GRANT',
  RECOMMENDATION_DEBIT: 'RECOMMENDATION_DEBIT',
  TOPUP_PURCHASE: 'TOPUP_PURCHASE',
  REFUND: 'REFUND',
} as const;

export type AiCreditReason =
  (typeof AI_CREDIT_REASONS)[keyof typeof AI_CREDIT_REASONS];

export const FREE_DAILY_CREDIT_AMOUNT = 1;
export const PREMIUM_MONTHLY_CREDIT_AMOUNT = 50;

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
