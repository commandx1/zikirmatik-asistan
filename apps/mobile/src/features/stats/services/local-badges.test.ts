import { describe, expect, it, vi } from "vitest";
import { computeLocalBadges, deriveLocalActivityStats } from "./local-badges";

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string) => key
  }
}));

describe("deriveLocalActivityStats", () => {
  it("counts free-mode taps toward all-time count and today's active day", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats([], 12, today);

    expect(stats.allTimeCount).toBe(12);
    expect(stats.totalDaysActive).toBe(1);
  });

  it("sums per-item counts and derives active days from activity labels", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats(
      [
        { current: 33, lastActivityLabel: "Bugün 14:30" },
        { current: 10, lastActivityLabel: "Dün 09:00" }
      ],
      0,
      today
    );

    expect(stats.allTimeCount).toBe(43);
    expect(stats.totalDaysActive).toBe(2);
    expect(stats.longestStreak).toBe(2);
  });

  it("ignores items with zero progress and no activity label", () => {
    const today = new Date(2026, 6, 11);
    const stats = deriveLocalActivityStats([{ current: 0 }], 0, today);

    expect(stats.allTimeCount).toBe(0);
    expect(stats.totalDaysActive).toBe(0);
  });
});

describe("computeLocalBadges", () => {
  it("marks a badge achieved once its threshold is reached", () => {
    const badges = computeLocalBadges({ allTimeCount: 33, longestStreak: 0, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");

    expect(firstSteps?.achieved).toBe(true);
    expect(firstSteps?.progress).toBe(1);
  });

  it("reports fractional progress below threshold, clamped to [0,1]", () => {
    const badges = computeLocalBadges({ allTimeCount: 10, longestStreak: 3, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");
    const streak = badges.find((b) => b.key === "steady-streak");

    expect(firstSteps?.achieved).toBe(false);
    expect(firstSteps?.progress).toBeCloseTo(10 / 33);
    expect(streak?.progress).toBeCloseTo(3 / 7);
  });

  it("never returns a negative or above-1 progress", () => {
    const badges = computeLocalBadges({ allTimeCount: -5, longestStreak: 999, totalDaysActive: 0 });
    const firstSteps = badges.find((b) => b.key === "first-steps");
    const streak = badges.find((b) => b.key === "steady-streak");

    expect(firstSteps?.progress).toBe(0);
    expect(streak?.progress).toBe(1);
  });
});
