import { resolveLocalizedText, type LocalizedText } from "@zikirmatik/shared";

/** Preferred display name for a dhikr: name, falling back to transliteration. */
export function dhikrDisplayName(
  item: { name: LocalizedText | string; transliteration: LocalizedText | string },
  locale: "tr" | "en"
): string {
  return resolveLocalizedText(item.name, locale) || resolveLocalizedText(item.transliteration, locale);
}
