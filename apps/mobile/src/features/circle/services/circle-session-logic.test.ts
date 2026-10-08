import fc from "fast-check";
import { describe, expect, it } from "vitest";
import { canTapCircle, FLUSH_INTERVAL_MS, POLL_INTERVAL_MS, isGoalReached, pendingFlushes, seedTodayCount, tapDay } from "./circle-session-logic";

describe("tapDay (M-24: dokunuş anının gününe yazar)", () => {
  it("gece yarısını geçen dokunuşlar yeni güne yazılır, eski gün korunur", () => {
    let counts = {};
    counts = tapDay(counts, "2026-10-06");
    counts = tapDay(counts, "2026-10-06");
    counts = tapDay(counts, "2026-10-07");
    expect(counts).toEqual({ "2026-10-06": 2, "2026-10-07": 1 });
  });

  it("özellik: her dokunuş tam olarak bir günü +1 artırır, toplam = dokunuş sayısı", () => {
    fc.assert(
      fc.property(fc.array(fc.constantFrom("2026-10-06", "2026-10-07", "2026-10-08")), (days) => {
        const counts = days.reduce((acc, day) => tapDay(acc, day), {} as Record<string, number>);
        expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(days.length);
      })
    );
  });
});

describe("pendingFlushes (B-33: gönderilmemiş günler)", () => {
  it("yalnız sunucuya gönderilenden büyük günler, tarih sıralı", () => {
    expect(pendingFlushes({ "2026-10-07": 3, "2026-10-06": 5, "2026-10-05": 1 }, { "2026-10-06": 5, "2026-10-05": 0 })).toEqual([
      { date: "2026-10-05", count: 1 },
      { date: "2026-10-07", count: 3 }
    ]);
  });
  it("hiçbir şey gönderilmediyse hepsi, hepsi gönderildiyse boş", () => {
    expect(pendingFlushes({ a: 2 }, {})).toEqual([{ date: "a", count: 2 }]);
    expect(pendingFlushes({ a: 2 }, { a: 2 })).toEqual([]);
  });
});

describe("seedTodayCount (B-32)", () => {
  it("yerel bugünkü sayım ile sunucu payının büyüğü", () => {
    expect(seedTodayCount({ dateKey: "d1", count: 3 }, "d1", 50)).toBe(50);
    expect(seedTodayCount({ dateKey: "d1", count: 60 }, "d1", 50)).toBe(60);
  });
  it("başka güne ait yerel sayım yok sayılır", () => {
    expect(seedTodayCount({ dateKey: "d0", count: 99 }, "d1", 4)).toBe(4);
    expect(seedTodayCount(undefined, "d1", 0)).toBe(0);
  });
});

describe("canTapCircle (M-12) ve isGoalReached (M-11)", () => {
  it("ilk detay gelene kadar ve kilitliyken dokunuş yok", () => {
    expect(canTapCircle({ loaded: false, locked: false })).toBe(false);
    expect(canTapCircle({ loaded: true, locked: true })).toBe(false);
    expect(canTapCircle({ loaded: true, locked: false })).toBe(true);
  });
  it("hedefe ulaşınca (veya aşınca) kilit", () => {
    expect(isGoalReached(99, 100)).toBe(false);
    expect(isGoalReached(100, 100)).toBe(true);
    expect(isGoalReached(150, 100)).toBe(true);
    expect(isGoalReached(5, 0)).toBe(false);
  });
});

describe("session intervals (yük testi kararı)", () => {
  it("flush 5 sn, poll 10 sn", () => {
    expect(FLUSH_INTERVAL_MS).toBe(5_000);
    expect(POLL_INTERVAL_MS).toBe(10_000);
  });
});
