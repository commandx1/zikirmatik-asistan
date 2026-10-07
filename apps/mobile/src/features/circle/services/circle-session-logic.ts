// Halka oturumunun saf mantığı (RN import'suz) — circle-session-screen.tsx
// bu fonksiyonları kullanır; testler circle-session-logic.test.ts'te.

/** Gün anahtarı (cihazın YEREL günü, YYYY-MM-DD) -> o günkü yerel sayım. */
export type DayCounts = Record<string, number>;

/** M-24: dokunuş, dokunuş ANININ gününe yazılır (oturum gece yarısını geçse de). */
export function tapDay(counts: DayCounts, todayKey: string): DayCounts {
  return { ...counts, [todayKey]: (counts[todayKey] ?? 0) + 1 };
}

/** Sunucuya henüz gönderilmemiş (sent'ten büyük) günler, tarihe göre sıralı. */
export function pendingFlushes(counts: DayCounts, sent: DayCounts): { date: string; count: number }[] {
  return Object.entries(counts)
    .filter(([date, count]) => count > (sent[date] ?? 0))
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

/** İlk detayda bugünkü yerel sayacın tohumu: yerel (kalıcı) ile sunucudaki payın büyüğü. */
export function seedTodayCount(
  local: { dateKey: string; count: number } | undefined,
  todayKey: string,
  serverMine: number
): number {
  return Math.max(local && local.dateKey === todayKey ? local.count : 0, serverMine);
}

/** M-12: ilk detay gelene kadar ve kilitliyken dokunuş yok. */
export function canTapCircle(state: { loaded: boolean; locked: boolean }): boolean {
  return state.loaded && !state.locked;
}

/** M-11: yerel toplam hedefe ulaştıysa sayaç anında kilitlenir. */
export function isGoalReached(displayTotal: number, goal: number): boolean {
  return goal > 0 && displayTotal >= goal;
}
