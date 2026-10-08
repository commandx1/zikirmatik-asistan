// Halka oturumunun saf mantığı (RN import'suz) — circle-session-screen.tsx
// bu fonksiyonları kullanır; testler circle-session-logic.test.ts'te.

import { computeDisplayTotal } from "./circle-share";

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

/** "Gönderilmeyi bekleyen" göstergesi: tüm günlerde sunucuya gitmemiş toplam dokunuş. */
export function pendingTotal(counts: DayCounts, sent: DayCounts): number {
  return pendingFlushes(counts, sent).reduce((sum, item) => sum + (item.count - (sent[item.date] ?? 0)), 0);
}

/** Halka oturumu modeli: periyodik gönderim yok; yalnız bu olaylar otomatik gönderir. */
export type AutoSendEvent = "leave" | "background" | "goal" | "tap" | "timer";
const AUTO_SEND_EVENTS: readonly AutoSendEvent[] = ["leave", "background", "goal"];

export function shouldAutoSend(event: AutoSendEvent, pending: number): boolean {
  return pending > 0 && AUTO_SEND_EVENTS.includes(event);
}

/** "Gönder" yalnız bekleyen varken ve gönderim sürmüyorken (çift gönderim yok) etkindir. */
export function canManualSend(state: { pending: number; sending: boolean }): boolean {
  return state.pending > 0 && !state.sending;
}

/** "Toplamı yenile" yalnız yenileme sürmüyorken etkindir. */
export function canManualRefresh(state: { refreshing: boolean }): boolean {
  return !state.refreshing;
}

/** Gönder yanıtındaki (toplam, benim payım) çiftinden ekran toplamı: asla geriye düşmez. */
export function mergeResponseTotal(
  prevDisplay: number,
  response: { circleTotalCount?: number; count?: number },
  sentCount: number,
  liveToday: number
): { pair: { total: number; mine: number }; display: number } | null {
  if (typeof response.circleTotalCount !== "number") {
    return null;
  }
  // mine = sunucunun $max sonrası GERÇEK sayısı (başka cihaz daha yüksek yazmış olabilir).
  const mine = response.count ?? sentCount;
  return {
    pair: { total: response.circleTotalCount, mine },
    display: computeDisplayTotal(prevDisplay, response.circleTotalCount, mine, liveToday)
  };
}
