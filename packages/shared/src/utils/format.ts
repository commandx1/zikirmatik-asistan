export function toPercent(value: number, total: number): number {
  if (total <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((value / total) * 100)));
}

export function formatCounter(value: number): string {
  return new Intl.NumberFormat("tr-TR").format(value);
}

export function formatRelativeDays(days: number): string {
  if (days <= 0) return "Bugün";
  if (days === 1) return "Yarın";
  return `${days} gün kaldı`;
}
