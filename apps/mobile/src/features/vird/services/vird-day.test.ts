import { describe, expect, it } from "vitest";
import {
  buildVirdItemKey,
  daysBetween,
  dayIndexFor,
  expectedItemsForDay,
  isDayComplete,
  phaseForDay,
  resolveDhikrRef,
  slotProgress,
  type VirdDayProgramLike
} from "./vird-day";
import type { VirdPhase } from "../types";

// Bu testler apps/api/src/modules/vird/utils/vird-day.spec.ts'teki senaryoların
// KASITLI aynısıdır (itemKey biçimi ve tamamlanma kuralı sunucu ile birebir
// aynı olmalı) + mobile'a özgü slotProgress testleri.
const dhikrId = "507f1f77bcf86cd799439011";

describe("daysBetween", () => {
  it("computes the day difference across a month boundary", () => {
    expect(daysBetween("2026-06-30", "2026-07-02")).toBe(2);
    expect(daysBetween("2026-07-02", "2026-06-30")).toBe(-2);
    expect(daysBetween("2026-06-30", "2026-06-30")).toBe(0);
  });
});

describe("dayIndexFor", () => {
  it("returns 1 for the start date and increments per day after it", () => {
    const program: VirdDayProgramLike = { startDate: "2026-06-01", phases: [] };
    expect(dayIndexFor(program, "2026-06-01")).toBe(1);
    expect(dayIndexFor(program, "2026-06-05")).toBe(5);
  });

  it("returns a value below 1 for dates before startDate", () => {
    const program: VirdDayProgramLike = { startDate: "2026-06-10", phases: [] };
    expect(dayIndexFor(program, "2026-06-08")).toBe(-1);
  });
});

describe("phaseForDay", () => {
  const routinePhase: VirdPhase = { fromDay: 1, toDay: null, slots: {} };
  const journeyPhases: VirdPhase[] = [
    { fromDay: 1, toDay: 3, slots: {} },
    { fromDay: 4, toDay: 7, slots: {} }
  ];

  it("matches a single open-ended routine phase for any day", () => {
    const program: VirdDayProgramLike = { startDate: "2026-01-01", phases: [routinePhase] };
    expect(phaseForDay(program, 1)).toBe(routinePhase);
    expect(phaseForDay(program, 500)).toBe(routinePhase);
  });

  it("matches the correct day-ranged phase for a journey program", () => {
    const program: VirdDayProgramLike = { startDate: "2026-01-01", phases: journeyPhases };
    expect(phaseForDay(program, 2)).toBe(journeyPhases[0]);
    expect(phaseForDay(program, 4)).toBe(journeyPhases[1]);
    expect(phaseForDay(program, 7)).toBe(journeyPhases[1]);
  });

  it("returns undefined when no phase covers the day", () => {
    const program: VirdDayProgramLike = { startDate: "2026-01-01", phases: journeyPhases };
    expect(phaseForDay(program, 8)).toBeUndefined();
    expect(phaseForDay(program, 0)).toBeUndefined();
  });
});

describe("resolveDhikrRef", () => {
  it("prefers dhikrId over customDhikrId", () => {
    expect(resolveDhikrRef({ dhikrId, customDhikrId: "custom" })).toBe(dhikrId);
  });

  it("falls back to customDhikrId", () => {
    expect(resolveDhikrRef({ customDhikrId: "custom" })).toBe("custom");
  });

  it("returns undefined when neither is set", () => {
    expect(resolveDhikrRef({})).toBeUndefined();
  });
});

describe("expectedItemsForDay", () => {
  it("returns one item for a non-prayer slot with prayerIndex null", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId, target: 33 }] } }]
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(1);
    expect(expected[0]).toEqual({
      slot: "morning",
      prayerIndex: null,
      ref: dhikrId,
      target: 33,
      itemKey: `morning:0:${dhikrId}`
    });
  });

  it("expands a prayer-slot item across the default prayerSelection (1..5)", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: null, slots: { prayer: [{ dhikrId, target: 10 }] } }]
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(5);
    expect(expected.map((item) => item.prayerIndex)).toEqual([1, 2, 3, 4, 5]);
    expect(expected[0].itemKey).toBe(`prayer:1:${dhikrId}`);
  });

  it("expands a prayer-slot item only across the configured prayerSelection", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: null, slots: { prayer: [{ dhikrId, target: 10 }] } }],
      prayerSelection: [1, 4]
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toHaveLength(2);
    expect(expected.map((item) => item.prayerIndex)).toEqual([1, 4]);
  });

  it("supports customDhikrId items alongside catalog dhikrId items", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: null, slots: { free: [{ customDhikrId: "my-custom", target: 5 }] } }]
    };
    const expected = expectedItemsForDay(program, 1);
    expect(expected).toEqual([
      { itemKey: "free:0:my-custom", slot: "free", prayerIndex: null, ref: "my-custom", target: 5 }
    ]);
  });

  it("returns an empty list when no phase covers the requested day", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: 3, slots: { morning: [{ dhikrId, target: 1 }] } }]
    };
    expect(expectedItemsForDay(program, 10)).toEqual([]);
  });
});

describe("isDayComplete", () => {
  it("is false when there are no expected items", () => {
    expect(isDayComplete([], {})).toBe(false);
  });

  it("is true only when every expected item reached its target", () => {
    const expected = [
      { itemKey: "a", slot: "morning" as const, prayerIndex: null, ref: "a-ref", target: 10 },
      { itemKey: "b", slot: "evening" as const, prayerIndex: null, ref: "b-ref", target: 5 }
    ];

    expect(
      isDayComplete(expected, {
        a: { count: 10, target: 10, completed: true },
        b: { count: 5, target: 5, completed: true }
      })
    ).toBe(true);

    expect(
      isDayComplete(expected, {
        a: { count: 10, target: 10, completed: true },
        b: { count: 4, target: 5, completed: false }
      })
    ).toBe(false);

    expect(isDayComplete(expected, { a: { count: 10, target: 10, completed: true } })).toBe(false);
    expect(isDayComplete(expected, undefined)).toBe(false);
  });
});

describe("slotProgress", () => {
  it("groups expected items per slot, omitting slots with no expected items", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: {
            morning: [{ dhikrId, target: 33 }],
            prayer: [{ customDhikrId: "istighfar", target: 10 }]
          }
        }
      ],
      prayerSelection: [1, 4]
    };
    const expected = expectedItemsForDay(program, 1);

    const result = slotProgress(expected, {
      [`morning:0:${dhikrId}`]: { count: 33, target: 33, completed: true },
      "prayer:1:istighfar": { count: 3, target: 10, completed: false }
    });

    expect(Object.keys(result).sort()).toEqual(["morning", "prayer"]);
    expect(result.morning).toEqual({
      done: 1,
      total: 1,
      items: [{ itemKey: `morning:0:${dhikrId}`, slot: "morning", prayerIndex: null, ref: dhikrId, target: 33, count: 33, completed: true }]
    });
    expect(result.prayer?.done).toBe(0);
    expect(result.prayer?.total).toBe(2);
    // prayerIndex 1 has a (partial) log entry, prayerIndex 4 has none -> count 0.
    expect(result.prayer?.items.map((item) => item.count)).toEqual([3, 0]);
  });

  it("returns an empty object when there is no active phase for the day", () => {
    const program: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [{ fromDay: 1, toDay: 3, slots: { morning: [{ dhikrId, target: 1 }] } }]
    };
    const expected = expectedItemsForDay(program, 10);
    expect(slotProgress(expected, {})).toEqual({});
  });
});

describe("buildVirdItemKey", () => {
  it("matches the server's format: `${slot}:${prayerIndex ?? 0}:${ref}`", () => {
    expect(buildVirdItemKey("morning", null, "abc")).toBe("morning:0:abc");
    expect(buildVirdItemKey("morning", undefined, "abc")).toBe("morning:0:abc");
    expect(buildVirdItemKey("prayer", 3, "abc")).toBe("prayer:3:abc");
  });
});
