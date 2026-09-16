import { describe, expect, it } from "vitest";
import {
  buildSessionItems,
  buildSessionLogPayload,
  buildVirdLogFields,
  nextIncompleteSession,
  pickNextIndex,
  remainingReps,
  type VirdSessionItem
} from "./vird-session";
import type { VirdDayProgramLike } from "./vird-day";
import type { VirdDayProgressMap, VirdProgramLocal } from "../types";

const dhikrId = "507f1f77bcf86cd799439011";

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
  prayerSelection: [1, 2]
};

describe("buildSessionItems", () => {
  it("returns the items for a non-prayer slot", () => {
    const items = buildSessionItems(program, "2026-01-01", { slot: "morning", prayerIndex: null }, {});
    expect(items).toEqual([
      { itemKey: `morning:0:${dhikrId}`, slot: "morning", prayerIndex: null, ref: dhikrId, target: 33, count: 0, completed: false }
    ]);
  });

  it("filters a prayer slot down to the requested prayerIndex", () => {
    const items = buildSessionItems(program, "2026-01-01", { slot: "prayer", prayerIndex: 2 }, {});
    expect(items).toHaveLength(1);
    expect(items[0].prayerIndex).toBe(2);
  });

  it("returns [] when today is before the program's startDate", () => {
    const items = buildSessionItems(program, "2025-12-01", { slot: "morning", prayerIndex: null }, {});
    expect(items).toEqual([]);
  });
});

describe("pickNextIndex", () => {
  const items = (completedFlags: boolean[]): VirdSessionItem[] =>
    completedFlags.map((completed, i) => ({
      itemKey: `k${i}`,
      slot: "morning",
      prayerIndex: null,
      ref: `r${i}`,
      target: 1,
      count: completed ? 1 : 0,
      completed
    }));

  it("skips completed items and returns the next incomplete one", () => {
    expect(pickNextIndex(items([false, true, false, true]), 0)).toBe(2);
  });

  it("wraps around to the start", () => {
    expect(pickNextIndex(items([false, true, true, true]), 2)).toBe(0);
  });

  it("returns null when only the current item is incomplete", () => {
    expect(pickNextIndex(items([true, true, false, true]), 2)).toBeNull();
  });

  it("returns null when all items are complete", () => {
    expect(pickNextIndex(items([true, true, true]), 0)).toBeNull();
  });
});

describe("remainingReps", () => {
  it("sums the remaining count per item", () => {
    const items: VirdSessionItem[] = [
      { itemKey: "a", slot: "morning", prayerIndex: null, ref: "a", target: 10, count: 4, completed: false },
      { itemKey: "b", slot: "morning", prayerIndex: null, ref: "b", target: 5, count: 5, completed: true }
    ];
    expect(remainingReps(items)).toBe(6);
  });

  it("clamps an over-target item's contribution to 0", () => {
    const items: VirdSessionItem[] = [
      { itemKey: "a", slot: "morning", prayerIndex: null, ref: "a", target: 5, count: 8, completed: true }
    ];
    expect(remainingReps(items)).toBe(0);
  });
});

describe("nextIncompleteSession", () => {
  it("moves from morning to prayer:2 (first incomplete prayer index) when morning is complete", () => {
    const progress: VirdDayProgressMap = {
      [`morning:0:${dhikrId}`]: { count: 33, target: 33, completed: true },
      "prayer:1:istighfar": { count: 10, target: 10, completed: true }
    };
    const next = nextIncompleteSession(program, "2026-01-01", progress, { slot: "morning", prayerIndex: null });
    expect(next).toEqual({ slot: "prayer", prayerIndex: 2 });
  });

  it("wraps from night back to morning", () => {
    const nightProgram: VirdDayProgramLike = {
      startDate: "2026-01-01",
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: {
            morning: [{ dhikrId, target: 33 }],
            night: [{ customDhikrId: "tesbih", target: 33 }]
          }
        }
      ]
    };
    const next = nextIncompleteSession(nightProgram, "2026-01-01", {}, { slot: "night", prayerIndex: null });
    expect(next).toEqual({ slot: "morning", prayerIndex: null });
  });

  it("returns null once every session is complete", () => {
    const progress: VirdDayProgressMap = {
      [`morning:0:${dhikrId}`]: { count: 33, target: 33, completed: true },
      "prayer:1:istighfar": { count: 10, target: 10, completed: true },
      "prayer:2:istighfar": { count: 10, target: 10, completed: true }
    };
    const next = nextIncompleteSession(program, "2026-01-01", progress, { slot: "morning", prayerIndex: null });
    expect(next).toBeNull();
  });

  it("never returns the current session, even if it is still incomplete", () => {
    const progress: VirdDayProgressMap = {
      "prayer:1:istighfar": { count: 10, target: 10, completed: true },
      "prayer:2:istighfar": { count: 10, target: 10, completed: true }
    };
    // morning is the only incomplete one, but it IS current -> null, not itself.
    const next = nextIncompleteSession(program, "2026-01-01", progress, { slot: "morning", prayerIndex: null });
    expect(next).toBeNull();
  });
});

describe("buildVirdLogFields", () => {
  const item = { slot: "morning" as const, prayerIndex: null };

  it("returns {} for a local-origin program", () => {
    expect(buildVirdLogFields({ id: "uuid-1", origin: "local" }, item, 3)).toEqual({});
  });

  it("returns {} for dayIndex 0 (before startDate) even for a server program", () => {
    expect(buildVirdLogFields({ id: dhikrId, origin: "server" }, item, 0)).toEqual({});
  });

  it("includes virdPrayerIndex for a prayer-slot item", () => {
    const fields = buildVirdLogFields({ id: dhikrId, origin: "server" }, { slot: "prayer", prayerIndex: 3 }, 2);
    expect(fields).toEqual({ virdProgramId: dhikrId, virdSlot: "prayer", virdDayIndex: 2, virdPrayerIndex: 3 });
  });

  it("omits virdPrayerIndex for a non-prayer item", () => {
    const fields = buildVirdLogFields({ id: dhikrId, origin: "server" }, item, 2);
    expect(fields).toEqual({ virdProgramId: dhikrId, virdSlot: "morning", virdDayIndex: 2 });
  });
});

describe("buildSessionLogPayload", () => {
  function makeProgram(overrides: Partial<VirdProgramLocal> = {}): VirdProgramLocal {
    return {
      id: "local-1",
      clientId: "client-1",
      origin: "local",
      kind: "routine",
      status: "active",
      source: "manual",
      title: { tr: "Test", en: "Test" },
      startDate: "2026-01-01",
      phases: [],
      prayerSelection: [1, 2, 3, 4, 5],
      reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
      dhikrs: {},
      createdAt: "2026-01-01T00:00:00.000Z",
      updatedAt: "2026-01-01T00:00:00.000Z",
      ...overrides
    };
  }

  const baseItem: VirdSessionItem = {
    itemKey: `morning:0:${dhikrId}`,
    slot: "morning",
    prayerIndex: null,
    ref: dhikrId,
    target: 33,
    count: 10,
    completed: false
  };

  it("uses dhikrId for an ObjectId ref", () => {
    const payload = buildSessionLogPayload({
      userId: "user-1",
      program: makeProgram(),
      item: baseItem,
      dayIndex: 1,
      date: "2026-01-01",
      locale: "tr",
      fallbackName: "Zikir"
    });
    expect(payload.dhikrId).toBe(dhikrId);
    expect(payload.customDhikrId).toBeUndefined();
  });

  it("uses customDhikrId + localized name + arabic for a custom ref", () => {
    const customItem: VirdSessionItem = { ...baseItem, itemKey: "morning:0:my-custom", ref: "my-custom" };
    const payload = buildSessionLogPayload({
      userId: "user-1",
      program: makeProgram({
        dhikrs: { "my-custom": { ref: "my-custom", isCustom: true, name: { tr: "İstiğfar", en: "Istighfar" }, nameArabic: "أستغفر الله" } }
      }),
      item: customItem,
      dayIndex: 1,
      date: "2026-01-01",
      locale: "tr",
      fallbackName: "Zikir"
    });
    expect(payload.customDhikrId).toBe("my-custom");
    expect(payload.customDhikrName).toBe("İstiğfar");
    expect(payload.customDhikrArabic).toBe("أستغفر الله");
    expect(payload.dhikrId).toBeUndefined();
  });

  it("clamps count to [0, target]", () => {
    const overTarget: VirdSessionItem = { ...baseItem, count: 999 };
    const payload = buildSessionLogPayload({
      userId: "user-1",
      program: makeProgram(),
      item: overTarget,
      dayIndex: 1,
      date: "2026-01-01",
      locale: "tr",
      fallbackName: "Zikir"
    });
    expect(payload.count).toBe(33);
  });

  it("marks isCompleted true once count reaches target", () => {
    const atTarget: VirdSessionItem = { ...baseItem, count: 33, completed: true };
    const payload = buildSessionLogPayload({
      userId: "user-1",
      program: makeProgram(),
      item: atTarget,
      dayIndex: 1,
      date: "2026-01-01",
      locale: "tr",
      fallbackName: "Zikir"
    });
    expect(payload.isCompleted).toBe(true);
  });

  it("marks isCompleted false when count is 0", () => {
    const zero: VirdSessionItem = { ...baseItem, count: 0 };
    const payload = buildSessionLogPayload({
      userId: "user-1",
      program: makeProgram(),
      item: zero,
      dayIndex: 1,
      date: "2026-01-01",
      locale: "tr",
      fallbackName: "Zikir"
    });
    expect(payload.isCompleted).toBe(false);
    expect(payload.count).toBe(0);
  });
});
