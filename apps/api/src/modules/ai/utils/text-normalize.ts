/**
 * Türkçe metinleri karşılaştırılabilir hale getirmek için ortak normalizasyon
 * yardımcı fonksiyonu. Hem ai.service.ts (cache key, keyword eşleştirme)
 * hem de fallback-recommender.ts (tokenize) tarafından paylaşılır — böylece
 * "kaygı" ve "kaygi" gibi yazım farklılıkları aynı şekilde katlanır.
 */
export function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
