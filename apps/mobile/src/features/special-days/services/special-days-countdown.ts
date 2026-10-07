// Özel gün geri sayımı (B-38): "bugün" cihazın YEREL günüdür. Önceden UTC günü
// kullanılıyordu; TR'de (UTC+3) 00:00–03:00 arası bir gün fazla gösteriyordu.
// Karşılaştırma yalnız takvim günü üzerinden (UTC epoch'ta iki "gün ismi"), saat
// kayması/yaz saati etkisi yok.
export function daysUntil(isoDate: string, now: Date = new Date()): number {
  const todayUtc = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  const [year, month, day] = isoDate.split("-").map(Number);
  // isoDate is always "YYYY-MM-DD", so all three parts exist.
  const targetUtc = Date.UTC(year!, month! - 1, day!);
  return Math.max(0, Math.round((targetUtc - todayUtc) / 86_400_000));
}
