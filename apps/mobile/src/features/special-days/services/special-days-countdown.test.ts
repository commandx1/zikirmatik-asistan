import fc from "fast-check";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { daysUntil } from "./special-days-countdown";

describe("daysUntil (B-38, MOB-OZG-03): yerel güne göre", () => {
  const originalTz = process.env.TZ;
  beforeAll(() => {
    process.env.TZ = "Europe/Istanbul";
  });
  afterAll(() => {
    if (originalTz === undefined) delete process.env.TZ;
    else process.env.TZ = originalTz;
  });

  it("TR 00:30 (UTC önceki gün 21:30): yarınki özel gün 1 gün kalır, UTC kayması yok", () => {
    const now = new Date("2026-10-06T21:30:00Z"); // İstanbul: 2026-10-07 00:30
    expect(daysUntil("2026-10-08", now)).toBe(1);
    expect(daysUntil("2026-10-07", now)).toBe(0);
  });

  it("TR 02:59 ve 03:01 aynı yerel günde aynı sonucu verir", () => {
    expect(daysUntil("2026-10-10", new Date("2026-10-06T23:59:00Z"))).toBe(3); // 02:59 TR, 7 Ekim
    expect(daysUntil("2026-10-10", new Date("2026-10-07T00:01:00Z"))).toBe(3); // 03:01 TR, 7 Ekim
  });

  it("geçmiş tarih 0'a kıskaçlanır", () => {
    expect(daysUntil("2026-10-01", new Date("2026-10-07T12:00:00"))).toBe(0);
  });

  it("özellik: günün hangi saati olursa olsun sonuç aynı yerel gün için sabit", () => {
    fc.assert(
      fc.property(fc.integer({ min: 0, max: 23 }), fc.integer({ min: 0, max: 59 }), (hour, minute) => {
        expect(daysUntil("2026-10-12", new Date(2026, 9, 7, hour, minute))).toBe(5);
      })
    );
  });
});
