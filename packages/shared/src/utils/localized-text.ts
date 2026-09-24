import type { LocalizedText } from "../types/domain";

/**
 * Resolves a (possibly not-yet-localized) text field to a plain string for
 * the given locale. Backward compatible with plain strings (e.g. user-authored
 * personal dhikrs, which stay single-language by design) — those are
 * returned as-is.
 */
export function resolveLocalizedText(text: LocalizedText | string, locale: "tr" | "en"): string {
  if (typeof text === "string") {
    return text;
  }

  return text[locale] ?? text.tr ?? text.en ?? "";
}
