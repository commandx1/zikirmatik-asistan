// Saf (side-effect'siz) "şimdi hangi dilim?" çözümleyicisi — Bugünkü Vird
// kartının (todays-vird-card.tsx) hangi dilimi öne çıkaracağını belirler.
// `prayerTimes` verilmezse (B'deki gibi) saat aralıklarıyla basit bir sezgi
// kullanılır (<12 sabah, 12–17 namaz/serbest, 17–21 akşam, ≥21 gece).
// FAZ C: `prayerTimes` (adhan/resolvePrayerTimes ile hesaplanmış gerçek
// vakitler) verildiğinde sezgi yerine gerçek vakit sınırları kullanılır:
// fajr'dan önce gece, [fajr, dhuhr) sabah, [dhuhr, maghrib) namaz/serbest,
// [maghrib, isha) akşam, isha'dan sonra gece.
import type { PrayerTimesResult } from "./prayer-times";
import { VIRD_SLOT_KEYS, type VirdSlotProgressView } from "./vird-day";
import type { VirdSlotKey } from "../types";

function timeBucketSlot(now: Date, prayerTimes?: PrayerTimesResult): VirdSlotKey {
  if (prayerTimes) {
    const t = now.getTime();
    if (t < prayerTimes.fajr.getTime()) return "night";
    if (t < prayerTimes.dhuhr.getTime()) return "morning";
    if (t < prayerTimes.maghrib.getTime()) return "prayer";
    if (t < prayerTimes.isha.getTime()) return "evening";
    return "night";
  }

  const hour = now.getHours();
  if (hour < 12) return "morning";
  if (hour < 17) return "prayer";
  if (hour < 21) return "evening";
  return "night";
}

/**
 * Zaman dilimine göre başlangıç dilimini belirler, ardından beklenen
 * item'ları olan (`progress[slot]` var) dilimler arasında, o başlangıç
 * dilimden itibaren sırayla dolaşıp ilk TAMAMLANMAMIŞ dilimi döner. Hiçbiri
 * eksik değilse (hepsi tamam ya da hiç item yoksa) zaman dilimine denk gelen
 * dilim varsa onu, yoksa item'ı olan İLK dilimi, o da yoksa `null` döner.
 */
export function resolveNowSlot(
  progress: Partial<Record<VirdSlotKey, VirdSlotProgressView>>,
  now: Date,
  prayerTimes?: PrayerTimesResult
): VirdSlotKey | null {
  const startSlot = timeBucketSlot(now, prayerTimes);
  const startIndex = VIRD_SLOT_KEYS.indexOf(startSlot);
  const rotated = [...VIRD_SLOT_KEYS.slice(startIndex), ...VIRD_SLOT_KEYS.slice(0, startIndex)];

  for (const slot of rotated) {
    const view = progress[slot];
    if (view && view.done < view.total) {
      return slot;
    }
  }

  if (progress[startSlot]) {
    return startSlot;
  }

  return VIRD_SLOT_KEYS.find((slot) => progress[slot]) ?? null;
}
