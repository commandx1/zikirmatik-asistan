import type { SupportedLocale } from "../i18n";

export function toIntlLocale(locale: SupportedLocale): string {
  return locale === "en" ? "en-US" : "tr-TR";
}
