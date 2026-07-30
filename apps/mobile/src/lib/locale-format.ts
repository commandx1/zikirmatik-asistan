import type { SupportedLocale } from "../i18n";

export function toIntlLocale(locale: SupportedLocale): string {
  return locale === "en" ? "en-US" : "tr-TR";
}

/**
 * Locale-aware büyük harf. RN'in stil bazlı büyük harf dönüşümü Android'de
 * cihaz locale'ini kullandığı için İngilizce'de "i" → "İ" oluyordu; bu yüzden
 * büyük harfe çevirme JS tarafında, uygulamanın seçili diline göre yapılıyor.
 */
export function toLocaleUpper(value: string, locale: SupportedLocale): string {
  return value.toLocaleUpperCase(toIntlLocale(locale));
}

/**
 * Uzun okunur tarih etiketi (gün + ay + yıl + haftanın günü), kullanıcının
 * seçili diline göre. Örn. tr: "13 Eylül 2025 Cumartesi", en: "Saturday, September 13, 2025".
 * API artık dateLabel göndermediği için özel gün ekranlarında burada üretilir.
 */
export function formatLongDate(isoDate: string, locale: SupportedLocale): string {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  return new Intl.DateTimeFormat(toIntlLocale(locale), {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}
