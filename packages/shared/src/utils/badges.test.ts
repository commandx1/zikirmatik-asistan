import { describe, expect, it } from "vitest";
import { BADGE_DEFINITIONS, badgeOrder, computeBadges } from "./badges";
// The API keeps its own copy of the list (it cannot import this package at
// runtime); the "API parity" block pins the two together.
import * as api from "../../../../apps/api/src/modules/stats/utils/stats-aggregator";

describe("computeBadges", () => {
  it("returns every definition once, in order", () => {
    const badges = computeBadges({ lifetimeCount: 0, longestStreak: 0, virdLongestStreak: 0 });
    expect(badges.map((b) => b.key)).toEqual([
      "count-100",
      "count-1k",
      "count-10k",
      "count-100k",
      "streak-7",
      "streak-30",
      "streak-100",
      "vird-7",
      "vird-30",
      "vird-100"
    ]);
    expect(new Set(BADGE_DEFINITIONS.map((d) => d.order)).size).toBe(BADGE_DEFINITIONS.length);
  });

  it("achieves exactly at the threshold, per metric", () => {
    const byKey = Object.fromEntries(
      computeBadges({ lifetimeCount: 1000, longestStreak: 29, virdLongestStreak: 7 }).map((b) => [b.key, b])
    );
    expect(byKey["count-100"]!.achieved).toBe(true);
    expect(byKey["count-1k"]!.achieved).toBe(true);
    expect(byKey["count-10k"]!.achieved).toBe(false);
    expect(byKey["count-10k"]!.progress).toBeCloseTo(0.1);
    expect(byKey["streak-7"]!.achieved).toBe(true);
    expect(byKey["streak-30"]!.achieved).toBe(false);
    expect(byKey["vird-7"]!.achieved).toBe(true);
    expect(byKey["vird-30"]!.achieved).toBe(false);
  });

  it("clamps progress to 0..1", () => {
    const badges = computeBadges({ lifetimeCount: -5, longestStreak: 999, virdLongestStreak: Number.NaN });
    for (const badge of badges) {
      expect(badge.progress).toBeGreaterThanOrEqual(0);
      expect(badge.progress).toBeLessThanOrEqual(1);
    }
    expect(badges.find((b) => b.key === "count-100")!.progress).toBe(0);
    expect(badges.find((b) => b.key === "streak-100")!.progress).toBe(1);
  });

  it("orders unknown keys last", () => {
    expect(badgeOrder("count-100")).toBeLessThan(badgeOrder("vird-100"));
    expect(badgeOrder("first-steps")).toBeGreaterThan(badgeOrder("vird-100"));
  });
});

describe("API parity", () => {
  it("mirrors the definitions exactly", () => {
    expect(api.BADGE_DEFINITIONS).toEqual(BADGE_DEFINITIONS);
  });

  it("computes the same badges", () => {
    for (const [count, streak, vird] of [
      [0, 0, 0],
      [99, 6, 6],
      [100, 7, 7],
      [12000, 31, 100],
      [250000, 500, 3]
    ] as const) {
      expect(api.computeBadges(count, streak, vird)).toEqual(
        computeBadges({ lifetimeCount: count, longestStreak: streak, virdLongestStreak: vird })
      );
    }
  });
});
