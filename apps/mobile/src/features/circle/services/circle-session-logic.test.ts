import fc from "fast-check";
import { describe, expect, it } from "vitest";
import {
  canManualRefresh,
  canManualSend,
  canTapCircle,
  isGoalReached,
  mergeResponseTotal,
  pendingFlushes,
  pendingTotal,
  seedTodayCount,
  shouldAutoSend,
  tapDay
} from "./circle-session-logic";

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

describe("halka oturumu modeli (2026-10-07): periyodik gönderim yok", () => {
  it("pendingTotal: günler arası gönderilmemiş dokunuşların toplamı", () => {
    expect(pendingTotal({ a: 5, b: 3 }, { a: 2, b: 3 })).toBe(3);
    expect(pendingTotal({ a: 5 }, {})).toBe(5);
    expect(pendingTotal({ a: 2 }, { a: 2 })).toBe(0);
    expect(pendingTotal({}, {})).toBe(0);
  });
  it("otomatik gönderim yalnız çıkış, arka plan, hedef; tap/zamanlayıcı asla", () => {
    expect(shouldAutoSend("leave", 3)).toBe(true);
    expect(shouldAutoSend("background", 1)).toBe(true);
    expect(shouldAutoSend("goal", 1)).toBe(true);
    expect(shouldAutoSend("tap", 9)).toBe(false);
    expect(shouldAutoSend("timer", 9)).toBe(false);
    expect(shouldAutoSend("leave", 0)).toBe(false);
  });
  it("Gönder: bekleyen varken ve gönderim sürmüyorken; Yenile: yenileme sürmüyorken", () => {
    expect(canManualSend({ pending: 2, sending: false })).toBe(true);
    expect(canManualSend({ pending: 0, sending: false })).toBe(false);
    expect(canManualSend({ pending: 2, sending: true })).toBe(false);
    expect(canManualRefresh({ refreshing: false })).toBe(true);
    expect(canManualRefresh({ refreshing: true })).toBe(false);
  });
  it("mergeResponseTotal: yanıt toplamı birleşir, geriye düşmez, toplam yoksa null", () => {
    expect(mergeResponseTotal(10, { circleTotalCount: 40, count: 5 }, 5, 5)).toEqual({ pair: { total: 40, mine: 5 }, display: 40 });
    expect(mergeResponseTotal(50, { circleTotalCount: 40, count: 5 }, 5, 5)?.display).toBe(50);
    // başka cihaz daha yüksek yazdıysa mine yanıttan gelir
    expect(mergeResponseTotal(0, { circleTotalCount: 40, count: 9 }, 5, 6)?.pair.mine).toBe(9);
    expect(mergeResponseTotal(10, {}, 5, 5)).toBeNull();
  });
});
