import { describe, expect, it } from "vitest";
import { getPrayerTimes, PrayerTimesError } from "./prayer-times";

// Sabit tarih, yerel bileşenlerle kurulur (bkz. prayer-times.ts dosya başı
// notu) — böylece `new Date(2026, 0, 15)`'in getFullYear/getMonth/getDate
// okuması, testi çalıştıran makinenin saat dilimi ne olursa olsun HER ZAMAN
// 2026-01-15'tir (yerel round-trip her zaman kendi içinde tutarlıdır).
// Doğrulanan aralıklar da bilerek UTC getter'ları (`getUTCHours`) kullanır:
// hesaplanan Date'lerin MUTLAK anı makineden bağımsızdır, ama yerel
// `getHours()` okuması makinenin kendi saat dilimine göre değişir — bu
// testin herhangi bir CI makinesinde (hangi saat diliminde olursa olsun)
// aynı sonucu vermesi için UTC okuması şarttır.
const fixedDate = new Date(2026, 0, 15);

describe("getPrayerTimes", () => {
  it("returns strictly increasing prayer times for Istanbul on a fixed date", () => {
    const times = getPrayerTimes("istanbul", fixedDate);

    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });

  it("computes reasonable (UTC, machine-timezone-independent) hour ranges for Istanbul in winter", () => {
    const times = getPrayerTimes("istanbul", fixedDate);

    expect(times.fajr.getUTCHours()).toBeGreaterThanOrEqual(2);
    expect(times.fajr.getUTCHours()).toBeLessThanOrEqual(5);

    expect(times.sunrise.getUTCHours()).toBeGreaterThanOrEqual(4);
    expect(times.sunrise.getUTCHours()).toBeLessThanOrEqual(6);

    expect(times.dhuhr.getUTCHours()).toBeGreaterThanOrEqual(9);
    expect(times.dhuhr.getUTCHours()).toBeLessThanOrEqual(11);

    expect(times.asr.getUTCHours()).toBeGreaterThanOrEqual(11);
    expect(times.asr.getUTCHours()).toBeLessThanOrEqual(14);

    expect(times.maghrib.getUTCHours()).toBeGreaterThanOrEqual(14);
    expect(times.maghrib.getUTCHours()).toBeLessThanOrEqual(17);

    expect(times.isha.getUTCHours()).toBeGreaterThanOrEqual(15);
    expect(times.isha.getUTCHours()).toBeLessThanOrEqual(18);
  });

  it("accepts an explicit {lat, lng} coordinate and matches the province lookup", () => {
    const byProvince = getPrayerTimes("istanbul", fixedDate);
    const byCoordinates = getPrayerTimes({ lat: 41.0082, lng: 28.9784 }, fixedDate);

    expect(byCoordinates.fajr.getTime()).toBe(byProvince.fajr.getTime());
    expect(byCoordinates.isha.getTime()).toBe(byProvince.isha.getTime());
  });

  it("is case-insensitive on the province key", () => {
    const lower = getPrayerTimes("istanbul", fixedDate);
    const upper = getPrayerTimes("ISTANBUL", fixedDate);
    expect(upper.fajr.getTime()).toBe(lower.fajr.getTime());
  });

  it("throws PrayerTimesError for an unknown province key", () => {
    expect(() => getPrayerTimes("not-a-real-province", fixedDate)).toThrow(PrayerTimesError);
  });
});
