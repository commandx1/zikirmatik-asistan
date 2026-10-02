import { describe, expect, it } from "vitest";
import { BADGE_DEFINITIONS } from "@zikirmatik/shared";
import trStats from "../../../i18n/locales/tr/stats.json";
import enStats from "../../../i18n/locales/en/stats.json";
import { computeLocalBadges, deriveLocalActivityStats, resolveHeaderStreak, withServerStreak } from "./local-badges";

describe("deriveLocalActivityStats", () => {
  it("counts free-mode taps toward all-time count and today's active day", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats({ items: [], freeModeCount: 12 }, today);

    expect(stats.allTimeCount).toBe(12);
    expect(stats.totalDaysActive).toBe(1);
  });

  it("sums per-item counts and derives active days from activity labels", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats(
      {
        items: [
          { current: 33, lastActivityLabel: "Bugün 14:30" },
          { current: 10, lastActivityLabel: "Dün 09:00" }
        ],
        freeModeCount: 0
      },
      today
    );

    expect(stats.allTimeCount).toBe(43);
    expect(stats.totalDaysActive).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it("ignores items with zero progress and no activity label", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats({ items: [{ current: 0 }], freeModeCount: 0 }, today);

    expect(stats.allTimeCount).toBe(0);
    expect(stats.totalDaysActive).toBe(0);
  });
});

describe("deriveLocalActivityStats with the persisted day history", () => {
  it("forms a 7-day streak from counting the same dhikr daily", () => {
    const today = new Date(2026, 6, 11);
    const activeDayKeys = ["2026-07-05", "2026-07-06", "2026-07-07", "2026-07-08", "2026-07-09", "2026-07-10", "2026-07-11"];
    // The one item only remembers today, as it does in dhikr-store.
    const stats = deriveLocalActivityStats(
      { items: [{ current: 99, lastActivityAt: new Date(2026, 6, 11, 9).toISOString() }], freeModeCount: 0, activeDayKeys },
      today
    );

    expect(stats.longestStreak).toBe(7);
    expect(stats.currentStreak).toBe(7);
    expect(stats.totalDaysActive).toBe(7);
    expect(computeLocalBadges({ lifetimeCount: 99, longestStreak: stats.longestStreak }).find((b) => b.key === "streak-7")?.achieved).toBe(true);
  });

  it("dates free-mode activity by freeModeActivityAt, not today", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats(
      { items: [], freeModeCount: 5, freeModeActivityAt: new Date(2026, 6, 9, 20).toISOString() },
      today
    );

    expect(stats.totalDaysActive).toBe(1);
    expect(stats.currentStreak).toBe(0);
  });
});

describe("withServerStreak", () => {
  const local = { allTimeCount: 40, currentStreak: 1, longestStreak: 1, totalDaysActive: 1 };

  it("keeps local stats when no server streak is available", () => {
    expect(withServerStreak(local, null)).toBe(local);
  });

  it("prefers the server streak and keeps the local all-time count", () => {
    expect(withServerStreak(local, { currentStreak: 8, longestStreak: 12, totalDaysActive: 30 })).toEqual({
      allTimeCount: 40,
      currentStreak: 8,
      longestStreak: 12,
      totalDaysActive: 30
    });
  });
});

describe("resolveHeaderStreak", () => {
  const server = { currentStreak: 8, longestStreak: 12, totalDaysActive: 30 };

  it("guest: shows the local activeDayKeys streak", () => {
    const today = new Date(2026, 6, 11);
    const local = deriveLocalActivityStats(
      { items: [], freeModeCount: 0, activeDayKeys: ["2026-07-09", "2026-07-10", "2026-07-11"] },
      today
    );
    expect(resolveHeaderStreak(false, null, local)).toBe(3);
  });

  it("member: shows the server streak, 0 until fetched (never the local guess)", () => {
    const local = { allTimeCount: 0, currentStreak: 3, longestStreak: 3, totalDaysActive: 3 };
    expect(resolveHeaderStreak(true, server, local)).toBe(8);
    expect(resolveHeaderStreak(true, null, local)).toBe(0);
  });
});

describe("computeLocalBadges", () => {
  it("uses the shared list: lifetime count + local longest streak, vird always 0", () => {
    const badges = computeLocalBadges({ lifetimeCount: 1000, longestStreak: 7 });
    const achieved = badges.filter((b) => b.achieved).map((b) => b.key);

    expect(badges).toHaveLength(10);
    expect(achieved).toEqual(["count-100", "count-1k", "streak-7"]);
    expect(badges.find((b) => b.key === "vird-7")?.progress).toBe(0);
  });

  it("reports fractional progress below threshold, clamped to [0,1]", () => {
    const badges = computeLocalBadges({ lifetimeCount: 10, longestStreak: 3 });

    expect(badges.find((b) => b.key === "count-100")?.progress).toBeCloseTo(0.1);
    expect(badges.find((b) => b.key === "streak-7")?.progress).toBeCloseTo(3 / 7);
    expect(computeLocalBadges({ lifetimeCount: -5, longestStreak: 999 }).find((b) => b.key === "streak-100")?.progress).toBe(1);
  });
});

describe("badge i18n", () => {
  it("has a label and a celebration criterion for every shared badge, in tr and en", () => {
    for (const locale of [trStats, enStats]) {
      for (const { key } of BADGE_DEFINITIONS) {
        expect((locale.badges.labels as Record<string, string>)[key]).toBeTruthy();
        expect((locale.badgeCelebration.criteria as Record<string, string>)[key]).toBeTruthy();
      }
      expect(Object.keys(locale.badges.labels)).toHaveLength(BADGE_DEFINITIONS.length);
      expect(Object.keys(locale.badgeCelebration.criteria)).toHaveLength(BADGE_DEFINITIONS.length);
    }
  });
});
