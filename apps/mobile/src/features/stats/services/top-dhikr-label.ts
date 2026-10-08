import type { StatsTopDhikr } from "@zikirmatik/shared";

/** A-21: `nameI18n[locale]` varsa o, yoksa sunucunun `label` alanı. */
export function resolveTopDhikrLabel(item: Pick<StatsTopDhikr, "label" | "nameI18n">, locale: "tr" | "en"): string {
  return item.nameI18n?.[locale]?.trim() || item.label;
}
