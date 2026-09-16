import { describe, expect, it } from "vitest";
import { getPrayerTimes, resolvePrayerTimes } from "./prayer-times";

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
const istanbulCoords = { lat: 41.0082, lng: 28.9784 };

describe("getPrayerTimes", () => {
  it("returns strictly increasing prayer times for a coordinate on a fixed date", () => {
    const times = getPrayerTimes(istanbulCoords, fixedDate);

    expect(times.fajr.getTime()).toBeLessThan(times.sunrise.getTime());
    expect(times.sunrise.getTime()).toBeLessThan(times.dhuhr.getTime());
    expect(times.dhuhr.getTime()).toBeLessThan(times.asr.getTime());
    expect(times.asr.getTime()).toBeLessThan(times.maghrib.getTime());
    expect(times.maghrib.getTime()).toBeLessThan(times.isha.getTime());
  });

  it("computes reasonable (UTC, machine-timezone-independent) hour ranges for Istanbul in winter", () => {
    const times = getPrayerTimes(istanbulCoords, fixedDate);

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
});

describe("resolvePrayerTimes", () => {
  it("delegates to getPrayerTimes when coords are given", () => {
    const viaResolve = resolvePrayerTimes(istanbulCoords, fixedDate);
    const direct = getPrayerTimes(istanbulCoords, fixedDate);

    expect(viaResolve.fajr.getTime()).toBe(direct.fajr.getTime());
    expect(viaResolve.isha.getTime()).toBe(direct.isha.getTime());
  });

  it("falls back to a fixed local-time table when coords are null", () => {
    const times = resolvePrayerTimes(null, fixedDate);

    expect(times.fajr.getHours()).toBe(6);
    expect(times.fajr.getMinutes()).toBe(30);
    expect(times.sunrise.getHours()).toBe(8);
    expect(times.sunrise.getMinutes()).toBe(0);
    expect(times.dhuhr.getHours()).toBe(12);
    expect(times.dhuhr.getMinutes()).toBe(45);
    expect(times.asr.getHours()).toBe(16);
    expect(times.asr.getMinutes()).toBe(15);
    expect(times.maghrib.getHours()).toBe(18);
    expect(times.maghrib.getMinutes()).toBe(30);
    expect(times.isha.getHours()).toBe(21);
    expect(times.isha.getMinutes()).toBe(0);
  });

  it("builds the fixed table from the given date's local calendar day", () => {
    const times = resolvePrayerTimes(null, fixedDate);
    expect(times.fajr.getFullYear()).toBe(2026);
    expect(times.fajr.getMonth()).toBe(0);
    expect(times.fajr.getDate()).toBe(15);
  });
});
