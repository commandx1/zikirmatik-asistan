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

// Sunucu kötüye kullanım sınırları (429): kullanıcının başka bir AI isteği
// sürüyor / bugünkü kredi düşmeyen deneme sınırı doldu. Kredi düşmez; yazılan
// metin korunur, yalnız açıklayıcı mesaj gösterilir (Rehber, Vird, Sohbet).
export const AI_REQUEST_IN_FLIGHT_CODE = "AI_REQUEST_IN_FLIGHT";
export const AI_DAILY_FREE_LIMIT_CODE = "AI_DAILY_FREE_LIMIT";

/** 429 sınır kodunun yerelleştirilmiş mesaj anahtarı; başka kodlar için undefined. */
export function aiLimitMessageKey(code: string | undefined) {
  if (code === AI_REQUEST_IN_FLIGHT_CODE) return "common:aiLimits.inFlight" as const;
  if (code === AI_DAILY_FREE_LIMIT_CODE) return "common:aiLimits.dailyFreeLimit" as const;
  return undefined;
}
