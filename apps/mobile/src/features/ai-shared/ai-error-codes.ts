/**
 * AI özellikleri (Rehber + Sohbet + Vird programı) arasında paylaşılan hata
 * kodları — tek tanım yeri; api client'lar buradan yeniden export eder.
 *
 * AI_UNAVAILABLE: sunucu bu kodla 503 döndüğünde kredi düşülmemiş demektir —
 * istemci kullanıcıya "Tekrar dene" aksiyonu sunmalı (bkz. use-ai-guide.ts
 * retryLastRequest, use-ai-chat.ts runSend onError).
 */
export const AI_UNAVAILABLE_CODE = "AI_UNAVAILABLE";
export const AI_CREDIT_INSUFFICIENT_CODE = "AI_CREDIT_INSUFFICIENT";
export const DAILY_LIMIT_REACHED_CODE = "DAILY_LIMIT_REACHED";
