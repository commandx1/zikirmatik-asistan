import { describe, expect, it } from "vitest";
import { calculateVirdStreak } from "./vird-streak";
import type { VirdDayProgramLike } from "./vird-day";
import type { VirdDayProgressByDate } from "../types";

const ITEM_KEY = "morning:0:x";
const DONE = { count: 1, target: 1, completed: true } as const;
const NOT_DONE = { count: 0, target: 1, completed: false } as const;

const program: VirdDayProgramLike = {
  startDate: "2026-01-01",
  phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ customDhikrId: "x", target: 1 }] } }]
};

describe("calculateVirdStreak", () => {
  it("returns zero streaks when dayProgress is empty", () => {
    expect(calculateVirdStreak(program, {}, new Date(2026, 0, 10))).toEqual({ currentStreak: 0, longestStreak: 0 });
  });

  it("ignores dates before the program's startDate even if marked complete in dayProgress", () => {
    const dayProgress: VirdDayProgressByDate = {
      "2025-12-31": { [ITEM_KEY]: DONE }
    };
    // dayIndex for 2025-12-31 is 0 (before startDate) -> no phase matches ->
    // expectedItemsForDay is [] -> isDayComplete is false regardless of the
    // (bogus) dayProgress entry. Must not count toward the streak.
    expect(calculateVirdStreak(program, dayProgress, new Date(2026, 0, 10))).toEqual({
      currentStreak: 0,
      longestStreak: 0
    });
  });

  it("excludes partially-completed days and anchors the current streak on yesterday when today is incomplete", () => {
    const dayProgress: VirdDayProgressByDate = {
      "2026-01-05": { [ITEM_KEY]: DONE },
      "2026-01-06": { [ITEM_KEY]: DONE },
      "2026-01-07": { [ITEM_KEY]: DONE },
      // 2026-01-08 missing entirely (gap)
      "2026-01-09": { [ITEM_KEY]: DONE },
      "2026-01-10": { [ITEM_KEY]: NOT_DONE } // today, not yet completed
    };

    const result = calculateVirdStreak(program, dayProgress, new Date(2026, 0, 10));
    expect(result.longestStreak).toBe(3); // 05-06-07 run
    expect(result.currentStreak).toBe(1); // just 01-09 (today doesn't count, it's incomplete)
  });

  it("anchors the current streak on today once today is completed", () => {
    const dayProgress: VirdDayProgressByDate = {
      "2026-01-05": { [ITEM_KEY]: DONE },
      "2026-01-06": { [ITEM_KEY]: DONE },
      "2026-01-07": { [ITEM_KEY]: DONE },
      "2026-01-09": { [ITEM_KEY]: DONE },
      "2026-01-10": { [ITEM_KEY]: DONE } // today, completed
    };

    const result = calculateVirdStreak(program, dayProgress, new Date(2026, 0, 10));
    expect(result.longestStreak).toBe(3); // 05-06-07 is still the longest run
    expect(result.currentStreak).toBe(2); // 01-09 + 01-10
  });
});
