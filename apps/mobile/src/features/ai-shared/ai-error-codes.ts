/**
 * AI özellikleri (Rehber + Sohbet) arasında paylaşılan hata kodları.
 * Sunucu bu kodla 503 döndüğünde kredi düşülmemiş demektir — istemci
 * kullanıcıya "Tekrar dene" aksiyonu sunmalı (bkz. use-ai-guide.ts
 * retryLastRequest, use-ai-chat.ts runSend onError).
 */
export const AI_UNAVAILABLE_CODE = "AI_UNAVAILABLE";
