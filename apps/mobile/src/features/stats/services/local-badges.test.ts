import { describe, expect, it } from "vitest";
import { computeLocalBadges, deriveLocalActivityStats, withServerStreak } from "./local-badges";

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
    expect(computeLocalBadges(stats).find((b) => b.key === "steady-streak")?.achieved).toBe(true);
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

describe("computeLocalBadges", () => {
  it("marks a badge achieved once its threshold is reached", () => {
    const badges = computeLocalBadges({ currentStreak: 0, allTimeCount: 33, longestStreak: 0, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");

    expect(firstSteps?.achieved).toBe(true);
    expect(firstSteps?.progress).toBe(1);
  });

  it("reports fractional progress below threshold, clamped to [0,1]", () => {
    const badges = computeLocalBadges({ currentStreak: 0, allTimeCount: 10, longestStreak: 3, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");
    const streak = badges.find((b) => b.key === "steady-streak");

    expect(firstSteps?.achieved).toBe(false);
    expect(firstSteps?.progress).toBeCloseTo(10 / 33);
    expect(streak?.progress).toBeCloseTo(3 / 7);
  });

  it("never returns a negative or above-1 progress", () => {
    const badges = computeLocalBadges({ currentStreak: 0, allTimeCount: -5, longestStreak: 999, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");
    const streak = badges.find((b) => b.key === "steady-streak");

    expect(firstSteps?.progress).toBe(0);
    expect(streak?.progress).toBe(1);
  });
});
