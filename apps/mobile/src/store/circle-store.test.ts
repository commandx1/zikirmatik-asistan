import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCircleStore } from "./circle-store";
import type { CircleSummary } from "@zikirmatik/shared";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

function makeCircle(overrides: Partial<CircleSummary> = {}): CircleSummary {
  return {
    id: "c1",
    code: "ABCD2345",
    name: "Test Halka",
    dhikrId: "d1",
    dhikr: { name: { tr: "Sübhanallah", en: "Subhanallah" } },
    goalCount: 1000,
    totalCount: 0,
    memberCount: 1,
    status: "active",
    myTotal: 0,
    creatorId: "u1",
    isCreator: true,
    ...overrides
  };
}

describe("circle-store", () => {
  beforeEach(() => {
    useCircleStore.setState({ circles: [], todayCounts: {}, hasHydrated: false });
  });

  it("starts with empty defaults", () => {
    const state = useCircleStore.getState();
    expect(state.circles).toEqual([]);
    expect(state.todayCounts).toEqual({});
  });

  it("persists under the expected storage key and version", () => {
    const options = useCircleStore.persist.getOptions();
    expect(options.name).toBe("circle-store-v1");
    expect(options.version).toBe(1);
  });

  describe("upsertCircle", () => {
    it("adds a new circle", () => {
      useCircleStore.getState().upsertCircle(makeCircle());
      expect(useCircleStore.getState().circles).toHaveLength(1);
    });

    it("merges (replaces) an existing circle matched by id", () => {
      useCircleStore.getState().upsertCircle(makeCircle({ totalCount: 10 }));
      useCircleStore.getState().upsertCircle(makeCircle({ totalCount: 50 }));

      const circles = useCircleStore.getState().circles;
      expect(circles).toHaveLength(1);
      expect(circles[0].totalCount).toBe(50);
    });

    it("stores a CircleDetail (superset of CircleSummary) as-is", () => {
      useCircleStore.getState().upsertCircle({
        ...makeCircle(),
        members: [{ displayName: "Ahmet" }],
        myTodayCount: 5
      });

      const circle = useCircleStore.getState().circles[0] as CircleSummary & {
        members?: { displayName: string }[];
        myTodayCount?: number;
      };
      expect(circle.members).toEqual([{ displayName: "Ahmet" }]);
      expect(circle.myTodayCount).toBe(5);
    });

    it("keeps list order when updating an existing id, and appends new ids at the end", () => {
      useCircleStore.getState().upsertCircle(makeCircle({ id: "a" }));
      useCircleStore.getState().upsertCircle(makeCircle({ id: "b" }));
      useCircleStore.getState().upsertCircle(makeCircle({ id: "a", totalCount: 99 }));

      let ids = useCircleStore.getState().circles.map((c) => c.id);
      expect(ids).toEqual(["a", "b"]);

      useCircleStore.getState().upsertCircle(makeCircle({ id: "c" }));
      ids = useCircleStore.getState().circles.map((c) => c.id);
      expect(ids).toEqual(["a", "b", "c"]);
    });
  });

  describe("removeCircle", () => {
    it("removes the circle by id", () => {
      useCircleStore.getState().upsertCircle(makeCircle({ id: "a" }));
      useCircleStore.getState().upsertCircle(makeCircle({ id: "b" }));

      useCircleStore.getState().removeCircle("a");

      const circles = useCircleStore.getState().circles;
      expect(circles).toHaveLength(1);
      expect(circles[0].id).toBe("b");
    });

    it("is a no-op for an unknown id", () => {
      useCircleStore.getState().upsertCircle(makeCircle({ id: "a" }));
      useCircleStore.getState().removeCircle("does-not-exist");
      expect(useCircleStore.getState().circles.map((c) => c.id)).toEqual(["a"]);
    });
  });

  describe("setTodayCount", () => {
    it("stores today's live count for a circle", () => {
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 45);
      expect(useCircleStore.getState().todayCounts.c1).toEqual({ dateKey: "2026-09-17", count: 45 });
    });

    it("overwrites the previous value for the same circle", () => {
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 45);
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 78);
      expect(useCircleStore.getState().todayCounts.c1.count).toBe(78);
    });

    it("for a new day replaces dateKey and count instead of accumulating", () => {
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 45);
      useCircleStore.getState().setTodayCount("c1", "2026-09-18", 5);
      expect(useCircleStore.getState().todayCounts.c1).toEqual({ dateKey: "2026-09-18", count: 5 });
    });

    it("leaves another circle's todayCounts untouched", () => {
      useCircleStore.getState().setTodayCount("a", "2026-09-17", 10);
      useCircleStore.getState().setTodayCount("b", "2026-09-17", 20);
      expect(useCircleStore.getState().todayCounts.a).toEqual({ dateKey: "2026-09-17", count: 10 });
      expect(useCircleStore.getState().todayCounts.b).toEqual({ dateKey: "2026-09-17", count: 20 });
    });
  });

  describe("replaceFromServer", () => {
    it("replaces the whole circle list", () => {
      useCircleStore.getState().upsertCircle(makeCircle({ id: "stale" }));
      useCircleStore.getState().replaceFromServer([makeCircle({ id: "fresh" })]);

      const circles = useCircleStore.getState().circles;
      expect(circles).toHaveLength(1);
      expect(circles[0].id).toBe("fresh");
    });

    it("preserves todayCounts", () => {
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 45);
      useCircleStore.getState().replaceFromServer([makeCircle({ id: "fresh" })]);
      expect(useCircleStore.getState().todayCounts.c1).toEqual({ dateKey: "2026-09-17", count: 45 });
    });
  });

  describe("resetCircles", () => {
    it("restores every data field to its default", () => {
      useCircleStore.getState().upsertCircle(makeCircle());
      useCircleStore.getState().setTodayCount("c1", "2026-09-17", 10);

      useCircleStore.getState().resetCircles();

      const state = useCircleStore.getState();
      expect(state.circles).toEqual([]);
      expect(state.todayCounts).toEqual({});
    });
  });

  describe("persist options", () => {
    it("partialize excludes hasHydrated", () => {
      const options = useCircleStore.persist.getOptions();
      const persisted = options.partialize?.({
        circles: [],
        todayCounts: {},
        hasHydrated: true,
        replaceFromServer: vi.fn(),
        upsertCircle: vi.fn(),
        removeCircle: vi.fn(),
        setTodayCount: vi.fn(),
        resetCircles: vi.fn(),
        markHydrated: vi.fn()
      } as unknown as ReturnType<typeof useCircleStore.getState>);

      expect(persisted).not.toHaveProperty("hasHydrated");
      expect(persisted).toEqual({ circles: [], todayCounts: {} });
    });

    it("has no migrate function (no versioned migrations defined yet)", () => {
      const options = useCircleStore.persist.getOptions();
      expect(options.migrate).toBeUndefined();
    });
  });
});
