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
