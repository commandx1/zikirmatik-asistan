import type { StatsSourceKey } from "@zikirmatik/shared";

/** Convert a #rrggbb(aa) hex to an rgba() string with the given alpha. */
export function withAlpha(hex: string, alpha: number): string {
  const normalized = hex.replace("#", "");
  if (!(normalized.length === 6 || normalized.length === 8)) {
    return hex;
  }
  const r = Number.parseInt(normalized.slice(0, 2), 16);
  const g = Number.parseInt(normalized.slice(2, 4), 16);
  const b = Number.parseInt(normalized.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${Math.max(0, Math.min(1, alpha))})`;
}

/** Mongo $dayOfWeek: 1=Sunday..7=Saturday. Turkish short labels. */
export const WEEKDAY_LABELS: Record<number, string> = {
  1: "Paz",
  2: "Pzt",
  3: "Sal",
  4: "Çar",
  5: "Per",
  6: "Cum",
  7: "Cmt"
};

/** Display order starting Monday (Turkish convention). */
export const WEEKDAY_DISPLAY_ORDER = [2, 3, 4, 5, 6, 7, 1];

export const SOURCE_LABELS: Record<StatsSourceKey, string> = {
  manual: "Elle",
  ai: "AI önerisi",
  "special-day": "Özel gün",
  notification: "Hatırlatıcı"
};

/** Distinct hue offsets for source segments, derived from the theme accent. */
export const SOURCE_ORDER: StatsSourceKey[] = [
  "manual",
  "ai",
  "special-day"
];

/**
 * Heatmap intensity color for a cell. `level` is 0..1; returns an accent tint
 * (empty cells use a faint track color).
 */
export function heatmapColor(
  count: number,
  max: number,
  accent: string,
  emptyColor: string
): string {
  if (count <= 0 || max <= 0) {
    return emptyColor;
  }
  const ratio = count / max;
  // Bucketize into 4 visible levels so low values still register.
  const level = ratio > 0.66 ? 1 : ratio > 0.33 ? 0.7 : ratio > 0.1 ? 0.45 : 0.25;
  return withAlpha(accent, level);
}

export function maxOf(values: number[]): number {
  return values.reduce((max, value) => (value > max ? value : max), 0);
}
