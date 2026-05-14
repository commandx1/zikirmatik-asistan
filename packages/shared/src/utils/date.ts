export function toDateKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getStreakDays(lastActiveDateKey: string, today = new Date()): number {
  const [y, m, d] = lastActiveDateKey.split("-").map(Number);
  const last = new Date(y, (m ?? 1) - 1, d ?? 1);
  const diffMs = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime() -
    new Date(last.getFullYear(), last.getMonth(), last.getDate()).getTime();
  return Math.floor(diffMs / 86400000);
}
