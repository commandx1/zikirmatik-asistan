import type { ThemeName } from "@zikirmatik/shared";

/** Yalnız premium'a açık temalar (tema seçicideki kilit + A-07/M-13 geri dönüşü tek kaynağı). */
export const PREMIUM_THEME_NAMES: ReadonlySet<ThemeName> = new Set<ThemeName>([
  "gece-lacivert",
  "kum-tasi-minimal",
  "zumrut-mermer",
  "saf-gece-amoled",
  "ay-isigi",
  "klasik-bej",
  "derin-mavi",
  "gul-bahcesi",
  "galaksi-girdabi",
  "hilal-gecesi",
  "su-dalgasi",
  "lacivert-indigo",
  "altin-varak"
]);

/** Ücretsiz varsayılan tema (store başlangıç değeri). */
export const FREE_DEFAULT_THEME: ThemeName = "gece-koyu";

/** A-07 + M-13: premium değilken premium-only tema ücretsiz varsayılana döner. */
export function resolveAllowedTheme(themeName: ThemeName, isPremium: boolean): ThemeName {
  return !isPremium && PREMIUM_THEME_NAMES.has(themeName) ? FREE_DEFAULT_THEME : themeName;
}
