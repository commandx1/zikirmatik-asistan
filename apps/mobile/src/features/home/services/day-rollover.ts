import { toDateKey } from "@zikirmatik/shared";

export type DayRolloverDecision =
  | { kind: "none" }
  /** Yeni gün: sayaç sessizce 0'dan başlar. */
  | { kind: "reset" }
  /** Üyenin dünkü kaydedilmemiş sayımı: "kaydet / at" sorulur; `dateKey` = sayımın yapıldığı gün. */
  | { kind: "ask"; count: number; dateKey: string };

/**
 * M-01: günü cihazın yerel takvim günü belirler. Seçili zikrin son hareketi
 * önceki bir günde kaldıysa sayaç yeni günde 0'dan başlar; yalnızca üyenin
 * kaydedilmemiş (>0) sayımı için bir kez sorulur. Misafirin yerel ilerlemesi
 * "kaydedilmiş" sayılır (M-03) ve gün anahtarı activeDayKeys'te zaten durur.
 */
export function decideDayRollover(
  input: { current: number; lastActivityAt?: string; isUnsaved: boolean; isMember: boolean },
  now: Date
): DayRolloverDecision {
  if (input.current <= 0 || !input.lastActivityAt) {
    return { kind: "none" };
  }
  const last = new Date(input.lastActivityAt);
  if (Number.isNaN(last.getTime())) {
    return { kind: "none" };
  }
  const dateKey = toDateKey(new Date(last.getFullYear(), last.getMonth(), last.getDate()));
  if (dateKey === toDateKey(now)) {
    return { kind: "none" };
  }
  return input.isMember && input.isUnsaved
    ? { kind: "ask", count: input.current, dateKey }
    : { kind: "reset" };
}

/** Sunucudan gelen son log yalnızca bugünün logu ise sayaca yazılır (HID-06). */
export function isLogFromToday(log: { date?: string; createdAt?: string }, now: Date): boolean {
  const day = log.date?.slice(0, 10);
  if (day && /^\d{4}-\d{2}-\d{2}$/.test(day)) {
    return day === toDateKey(now);
  }
  if (log.createdAt) {
    const created = new Date(log.createdAt);
    if (!Number.isNaN(created.getTime())) {
      return toDateKey(created) === toDateKey(now);
    }
  }
  return true;
}
