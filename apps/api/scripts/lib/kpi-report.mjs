// Saf fonksiyonlar: haftalık install kohortu + Dn retention hesaplama.
// DB'ye dokunmaz — kpi-report.mjs bu fonksiyonları Mongo'dan çektiği
// devices/app_events belgeleriyle besler. Test edilebilirlik için ayrıldı.

const DAY_MS = 24 * 60 * 60 * 1000;

// ISO hafta başlangıcı (Pazartesi, UTC gün başı).
export function isoWeekStart(date) {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dow = d.getUTCDay() || 7; // Pazar=0 -> 7
  if (dow > 1) d.setUTCDate(d.getUTCDate() - (dow - 1));
  return d;
}

export function isoWeekKey(date) {
  return isoWeekStart(date).toISOString().slice(0, 10);
}

/**
 * Cihazları haftalık kohortlara ayırır ve D1/D7/D30 retention hesaplar.
 * Retention birincil sinyali: devices.lastSeenAt >= createdAt + n gün VEYA
 * o eşikte/sonrasında bir app_opened olayı (ikisinin BİRLEŞİMİ — lastSeenAt
 * her aktivitede güncellenir, app_opened yalnızca app_opened emisyonu
 * yapıldıysa; biri diğerini kaçırabilir).
 * @param {{deviceId:string, platform:'ios'|'android', createdAt:Date, lastSeenAt?:Date}[]} devices
 * @param {Map<string, Date[]>} openEventsByDevice - deviceId -> app_opened createdAt listesi (sıralı olmasına gerek yok)
 * @param {Date} now - "bugün", ölçülebilirlik sınırı için
 * @returns {Array<{week:string, installs:number, android:number, ios:number, d1:number|null, d7:number|null, d30:number|null}>}
 */
export function computeCohorts(devices, openEventsByDevice, now) {
  const cohorts = new Map();
  for (const dev of devices) {
    const week = isoWeekKey(dev.createdAt);
    if (!cohorts.has(week)) {
      cohorts.set(week, { week, installs: 0, android: 0, ios: 0, retained: { 1: 0, 7: 0, 30: 0 }, measurable: { 1: 0, 7: 0, 30: 0 } });
    }
    const c = cohorts.get(week);
    c.installs += 1;
    if (dev.platform === 'android') c.android += 1;
    if (dev.platform === 'ios') c.ios += 1;

    const opens = openEventsByDevice.get(dev.deviceId) ?? [];
    for (const n of [1, 7, 30]) {
      const threshold = new Date(dev.createdAt.getTime() + n * DAY_MS);
      if (threshold > now) continue; // henüz ölçülebilir değil
      c.measurable[n] += 1;
      const seenViaLastSeen = dev.lastSeenAt && dev.lastSeenAt >= threshold;
      const seenViaOpenEvent = opens.some((t) => t >= threshold);
      if (seenViaLastSeen || seenViaOpenEvent) c.retained[n] += 1;
    }
  }

  return [...cohorts.values()]
    .sort((a, b) => a.week.localeCompare(b.week))
    .map((c) => ({
      week: c.week,
      installs: c.installs,
      android: c.android,
      ios: c.ios,
      d1: c.measurable[1] ? (c.retained[1] / c.measurable[1]) * 100 : null,
      d7: c.measurable[7] ? (c.retained[7] / c.measurable[7]) * 100 : null,
      d30: c.measurable[30] ? (c.retained[30] / c.measurable[30]) * 100 : null,
      // Raw counts alongside the percentages so a caller can weight a
      // summary across cohorts by installs instead of averaging percentages
      // (an unweighted mean overweights small/early cohorts).
      retainedD7: c.retained[7],
    }));
}
