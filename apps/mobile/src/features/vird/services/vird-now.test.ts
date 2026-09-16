import { describe, expect, it } from "vitest";
import { resolveNowSlot } from "./vird-now";
import type { VirdSlotProgressView } from "./vird-day";

function view(done: number, total: number): VirdSlotProgressView {
  return { done, total, items: [] };
}

describe("resolveNowSlot", () => {
  it("picks the time-bucket slot when it still has incomplete items", () => {
    const progress = { morning: view(0, 1), evening: view(0, 1) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 8, 0))).toBe("morning");
  });

  it("rotates forward from the time bucket to the next incomplete slot when the bucket's own slot is already complete", () => {
    const progress = { morning: view(1, 1), prayer: view(0, 5) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 8, 0))).toBe("prayer");
  });

  it("uses the prayer/free bucket between 12:00 and 17:00", () => {
    const progress = { prayer: view(0, 5) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 14, 0))).toBe("prayer");
  });

  it("uses the evening bucket between 17:00 and 21:00", () => {
    const progress = { evening: view(0, 1) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 18, 0))).toBe("evening");
  });

  it("uses the night bucket at/after 21:00", () => {
    const progress = { night: view(0, 1) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 22, 0))).toBe("night");
  });

  it("falls back to the time-bucket slot when everything is complete but that slot has items", () => {
    const progress = { morning: view(1, 1) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 8, 0))).toBe("morning");
  });

  it("falls back to the first slot that has any items when the time-bucket slot has none", () => {
    const progress = { night: view(0, 1) };
    expect(resolveNowSlot(progress, new Date(2026, 0, 1, 8, 0))).toBe("night");
  });

  it("returns null when there are no expected items at all", () => {
    expect(resolveNowSlot({}, new Date(2026, 0, 1, 8, 0))).toBeNull();
  });

  describe("clock fallback boundaries (no prayerTimes)", () => {
    it("11:59 is still morning", () => {
      const progress = { morning: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 11, 59))).toBe("morning");
    });

    it("12:00 switches to prayer", () => {
      const progress = { prayer: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 12, 0))).toBe("prayer");
    });

    it("16:59 is still prayer", () => {
      const progress = { prayer: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 16, 59))).toBe("prayer");
    });

    it("17:00 switches to evening", () => {
      const progress = { evening: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 17, 0))).toBe("evening");
    });

    it("20:59 is still evening", () => {
      const progress = { evening: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 20, 59))).toBe("evening");
    });

    it("21:00 switches to night", () => {
      const progress = { night: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 21, 0))).toBe("night");
    });

    it("00:30 (past midnight) is night", () => {
      const progress = { night: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 0, 30))).toBe("night");
    });
  });

  describe("with prayerTimes", () => {
    const prayerTimes = {
      fajr: new Date(2026, 0, 1, 6, 50),
      sunrise: new Date(2026, 0, 1, 8, 20),
      dhuhr: new Date(2026, 0, 1, 12, 45),
      asr: new Date(2026, 0, 1, 15, 10),
      maghrib: new Date(2026, 0, 1, 17, 30),
      isha: new Date(2026, 0, 1, 19, 5)
    };

    it("uses night before fajr", () => {
      const progress = { night: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 5, 0), prayerTimes)).toBe("night");
    });

    it("uses morning between fajr and dhuhr", () => {
      const progress = { morning: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 9, 0), prayerTimes)).toBe("morning");
    });

    it("uses prayer between dhuhr and maghrib", () => {
      const progress = { prayer: view(0, 5) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 14, 0), prayerTimes)).toBe("prayer");
    });

    it("uses evening between maghrib and isha", () => {
      const progress = { evening: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 18, 0), prayerTimes)).toBe("evening");
    });

    it("uses night after isha", () => {
      const progress = { night: view(0, 1) };
      expect(resolveNowSlot(progress, new Date(2026, 0, 1, 20, 0), prayerTimes)).toBe("night");
    });
  });
});
