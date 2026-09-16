import { beforeEach, describe, expect, it, vi } from "vitest";
import { toDateKey } from "@zikirmatik/shared";
import { pruneDayProgress, useVirdStore, type VirdStore } from "./vird-store";
import type { VirdProgramLocal } from "../features/vird/types";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

function makeProgram(overrides: Partial<VirdProgramLocal> = {}): VirdProgramLocal {
  return {
    id: "local-1",
    clientId: "client-1",
    origin: "local",
    kind: "routine",
    status: "draft",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
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

// Takvim-günü aritmetiği (store'un içindeki shiftDateKey ile aynı yaklaşım)
// — "120 günden eski" testinin gerçek çalışma tarihinden BAĞIMSIZ olması için.
function shiftKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

const DEFAULTS = {
  hasHydrated: false,
  programs: [],
  activeProgramId: null,
  dayProgress: {},
  reminderPrefs: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false }, coords: null },
  lastServerSyncAt: null,
  virdStreak: null,
  syncError: undefined,
  notice: null
};

describe("vird-store", () => {
  beforeEach(() => {
    useVirdStore.setState({ ...DEFAULTS });
  });

  it("starts with empty defaults", () => {
    const state = useVirdStore.getState();
    expect(state.programs).toEqual([]);
    expect(state.activeProgramId).toBeNull();
    expect(state.dayProgress).toEqual({});
    expect(state.reminderPrefs).toEqual({
      enabled: false,
      slots: { morning: false, prayer: false, evening: false, night: false },
      coords: null
    });
    expect(state.lastServerSyncAt).toBeNull();
    expect(state.virdStreak).toBeNull();
    expect(state.notice).toBeNull();
  });

  describe("setVirdStreak", () => {
    it("stores the server-reported streak snapshot", () => {
      useVirdStore.getState().setVirdStreak({ currentStreak: 4, longestStreak: 9 });
      expect(useVirdStore.getState().virdStreak).toEqual({ currentStreak: 4, longestStreak: 9 });
    });

    it("is not part of the persisted (partialized) state", () => {
      useVirdStore.getState().setVirdStreak({ currentStreak: 4, longestStreak: 9 });
      const options = useVirdStore.persist.getOptions();
      const persisted = options.partialize?.(useVirdStore.getState()) as Record<string, unknown>;
      expect(persisted).not.toHaveProperty("virdStreak");
    });

    it("resetVird also clears virdStreak", () => {
      useVirdStore.getState().setVirdStreak({ currentStreak: 4, longestStreak: 9 });
      useVirdStore.getState().resetVird();
      expect(useVirdStore.getState().virdStreak).toBeNull();
    });
  });

  describe("setSyncError", () => {
    it("sets and clears the sync error", () => {
      useVirdStore.getState().setSyncError("network down");
      expect(useVirdStore.getState().syncError).toBe("network down");

      useVirdStore.getState().setSyncError(undefined);
      expect(useVirdStore.getState().syncError).toBeUndefined();
    });

    it("resetVird also clears syncError", () => {
      useVirdStore.getState().setSyncError("network down");
      useVirdStore.getState().resetVird();
      expect(useVirdStore.getState().syncError).toBeUndefined();
    });
  });

  describe("pruneDayProgress", () => {
    it("defaults to the store's 120-day retention window", () => {
      const todayKey = toDateKey(new Date());
      const oldKey = shiftKey(todayKey, -130);
      const recentKey = shiftKey(todayKey, -50);

      const result = pruneDayProgress(
        {
          [oldKey]: { x: { count: 1, target: 1, completed: true } },
          [recentKey]: { y: { count: 1, target: 1, completed: true } }
        },
        todayKey
      );

      expect(result[oldKey]).toBeUndefined();
      expect(result[recentKey]).toBeDefined();
    });

    it("accepts a narrower retention window (e.g. guest-migration's 30 days)", () => {
      const todayKey = toDateKey(new Date());
      const withinWindowKey = shiftKey(todayKey, -20);
      const outsideWindowKey = shiftKey(todayKey, -40);

      const result = pruneDayProgress(
        {
          [withinWindowKey]: { x: { count: 1, target: 1, completed: true } },
          [outsideWindowKey]: { y: { count: 1, target: 1, completed: true } }
        },
        todayKey,
        30
      );

      expect(result[withinWindowKey]).toBeDefined();
      expect(result[outsideWindowKey]).toBeUndefined();
    });
  });

  it("persists under the expected storage key and version", () => {
    const options = useVirdStore.persist.getOptions();
    expect(options.name).toBe("vird-store-v1");
    expect(options.version).toBe(2);
  });

  describe("upsertProgram", () => {
    it("adds a new program", () => {
      useVirdStore.getState().upsertProgram(makeProgram());
      expect(useVirdStore.getState().programs).toHaveLength(1);
    });

    it("replaces an existing program matched by id", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "a", clientId: "c-a", status: "draft" }));
      useVirdStore.getState().upsertProgram(makeProgram({ id: "a", clientId: "c-a", status: "active" }));

      const programs = useVirdStore.getState().programs;
      expect(programs).toHaveLength(1);
      expect(programs[0].status).toBe("active");
    });

    it("replaces an existing local program matched by clientId even when the id changes (local -> server sync)", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "client-1", clientId: "client-1", origin: "local" }));
      useVirdStore.getState().upsertProgram(makeProgram({ id: "server-99", clientId: "client-1", origin: "server" }));

      const programs = useVirdStore.getState().programs;
      expect(programs).toHaveLength(1);
      expect(programs[0].id).toBe("server-99");
      expect(programs[0].origin).toBe("server");
    });
  });

  describe("removeProgram", () => {
    it("removes the program and clears activeProgramId if it was active", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "a" }));
      useVirdStore.getState().setActiveProgram("a");

      useVirdStore.getState().removeProgram("a");

      expect(useVirdStore.getState().programs).toEqual([]);
      expect(useVirdStore.getState().activeProgramId).toBeNull();
    });

    it("leaves activeProgramId untouched when a different program is removed", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "a" }));
      useVirdStore.getState().upsertProgram(makeProgram({ id: "b", clientId: "client-b" }));
      useVirdStore.getState().setActiveProgram("a");

      useVirdStore.getState().removeProgram("b");

      expect(useVirdStore.getState().activeProgramId).toBe("a");
    });
  });

  describe("recordProgress", () => {
    // "Bugün"e göre üretilir (sabit bir geçmiş tarih değil): 120 günlük
    // budama penceresinin dışına düşmemeli, yoksa recordProgress'in kendisi
    // bu anahtarı hemen budar (bkz. aşağıdaki ayrı "prunes..." testi).
    const dateKey = toDateKey(new Date());

    it("creates a new date/item bucket on first write", () => {
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 5, 33);
      expect(useVirdStore.getState().dayProgress[dateKey]["morning:0:x"]).toEqual({
        count: 5,
        target: 33,
        completed: false
      });
    });

    it("merges by max(count) instead of overwriting with a lower value", () => {
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 20, 33);
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 10, 33);

      expect(useVirdStore.getState().dayProgress[dateKey]["morning:0:x"].count).toBe(20);
    });

    it("takes the higher count when a later write increases it", () => {
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 10, 33);
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 33, 33);

      const entry = useVirdStore.getState().dayProgress[dateKey]["morning:0:x"];
      expect(entry.count).toBe(33);
      expect(entry.completed).toBe(true);
    });

    it("keeps completed true forever once reached, even if a later write reports a lower count", () => {
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 33, 33);
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 0, 33);

      const entry = useVirdStore.getState().dayProgress[dateKey]["morning:0:x"];
      expect(entry.completed).toBe(true);
      expect(entry.count).toBe(33); // max(33, 0)
    });

    it("prunes date keys older than 120 days while keeping recent ones", () => {
      const todayKey = toDateKey(new Date());
      const oldKey = shiftKey(todayKey, -130);
      const recentKey = shiftKey(todayKey, -50);

      useVirdStore.setState({
        dayProgress: {
          [oldKey]: { x: { count: 1, target: 1, completed: true } },
          [recentKey]: { y: { count: 1, target: 1, completed: true } }
        }
      });

      useVirdStore.getState().recordProgress(todayKey, "z", 1, 1);

      const dayProgress = useVirdStore.getState().dayProgress;
      expect(dayProgress[oldKey]).toBeUndefined();
      expect(dayProgress[recentKey]).toBeDefined();
      expect(dayProgress[todayKey]).toBeDefined();
    });
  });

  describe("setProgress", () => {
    const dateKey = toDateKey(new Date());

    it("overwrites absolutely, allowing a lower count than a previous write (unlike recordProgress's mergeMax)", () => {
      useVirdStore.getState().recordProgress(dateKey, "morning:0:x", 20, 33);
      useVirdStore.getState().setProgress(dateKey, "morning:0:x", 5, 33);

      expect(useVirdStore.getState().dayProgress[dateKey]["morning:0:x"]).toEqual({
        count: 5,
        target: 33,
        completed: false
      });
    });

    it("resetting to 0 sets completed back to false, even after it was previously true", () => {
      useVirdStore.getState().setProgress(dateKey, "morning:0:x", 33, 33);
      expect(useVirdStore.getState().dayProgress[dateKey]["morning:0:x"].completed).toBe(true);

      useVirdStore.getState().setProgress(dateKey, "morning:0:x", 0, 33);
      expect(useVirdStore.getState().dayProgress[dateKey]["morning:0:x"]).toEqual({
        count: 0,
        target: 33,
        completed: false
      });
    });
  });

  describe("replaceFromServer", () => {
    it("replaces a matching (by clientId) local program and keeps unrelated local-only programs", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "local-only", clientId: "c1", origin: "local" }));
      useVirdStore.getState().upsertProgram(makeProgram({ id: "pending-sync", clientId: "c2", origin: "local" }));

      useVirdStore.getState().replaceFromServer([makeProgram({ id: "srv-2", clientId: "c2", origin: "server", status: "active" })]);

      const programs = useVirdStore.getState().programs;
      expect(programs).toHaveLength(2);

      const synced = programs.find((program) => program.clientId === "c2");
      expect(synced).toMatchObject({ id: "srv-2", origin: "server", status: "active" });

      const untouched = programs.find((program) => program.clientId === "c1");
      expect(untouched).toMatchObject({ id: "local-only", origin: "local" });
    });

    it("merges todayProgress into dayProgress by max(count), same rule as recordProgress", () => {
      const todayKey = toDateKey(new Date());
      useVirdStore.getState().recordProgress(todayKey, "a", 2, 5);

      useVirdStore.getState().replaceFromServer([], {
        dateKey: todayKey,
        progress: { a: { count: 5, target: 5 }, b: { count: 1, target: 1 } }
      });

      const day = useVirdStore.getState().dayProgress[todayKey];
      expect(day.a).toEqual({ count: 5, target: 5, completed: true });
      expect(day.b).toEqual({ count: 1, target: 1, completed: true });
    });

    it("keeps the existing activeProgramId when it still exists in the merged list (server copy)", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "srv-1", clientId: "c1", origin: "server", status: "active" }));
      useVirdStore.getState().setActiveProgram("srv-1");

      useVirdStore.getState().replaceFromServer([makeProgram({ id: "srv-1", clientId: "c1", origin: "server", status: "active" })]);

      expect(useVirdStore.getState().activeProgramId).toBe("srv-1");
    });

    it("keeps the existing activeProgramId when it still exists as a surviving local-only program", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "local-1", clientId: "c-local", origin: "local" }));
      useVirdStore.getState().setActiveProgram("local-1");

      useVirdStore.getState().replaceFromServer([makeProgram({ id: "srv-2", clientId: "c2", origin: "server", status: "active" })]);

      expect(useVirdStore.getState().activeProgramId).toBe("local-1");
    });

    it("picks the first server program with status 'active' when the previous active program disappears", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "gone", clientId: "c-gone", origin: "server" }));
      useVirdStore.getState().setActiveProgram("gone");

      useVirdStore.getState().replaceFromServer([
        makeProgram({ id: "srv-draft", clientId: "c1", origin: "server", status: "draft" }),
        makeProgram({ id: "srv-active", clientId: "c2", origin: "server", status: "active" })
      ]);

      expect(useVirdStore.getState().activeProgramId).toBe("srv-active");
    });

    it("sets activeProgramId to null when the previous active program disappears and no server program is active", () => {
      useVirdStore.getState().upsertProgram(makeProgram({ id: "gone", clientId: "c-gone", origin: "server" }));
      useVirdStore.getState().setActiveProgram("gone");

      useVirdStore.getState().replaceFromServer([makeProgram({ id: "srv-draft", clientId: "c1", origin: "server", status: "draft" })]);

      expect(useVirdStore.getState().activeProgramId).toBeNull();
    });

    it("records lastServerSyncAt as a valid ISO timestamp", () => {
      useVirdStore.getState().replaceFromServer([]);
      const value = useVirdStore.getState().lastServerSyncAt;
      expect(value).not.toBeNull();
      expect(Number.isNaN(new Date(value as string).getTime())).toBe(false);
    });
  });

  describe("setReminderPrefs", () => {
    it("merges a partial patch without clobbering untouched top-level fields", () => {
      useVirdStore.getState().setReminderPrefs({ coords: { lat: 41.008, lng: 28.978 } });
      expect(useVirdStore.getState().reminderPrefs.coords).toEqual({ lat: 41.008, lng: 28.978 });
      expect(useVirdStore.getState().reminderPrefs.enabled).toBe(false);
    });

    it("merges nested slots without resetting sibling slot keys", () => {
      useVirdStore.getState().setReminderPrefs({ enabled: true, slots: { morning: true } });
      useVirdStore.getState().setReminderPrefs({ slots: { evening: true } });

      expect(useVirdStore.getState().reminderPrefs.slots).toEqual({
        morning: true,
        prayer: false,
        evening: true,
        night: false
      });
      expect(useVirdStore.getState().reminderPrefs.enabled).toBe(true);
    });
  });

  it("setNotice updates its field", () => {
    useVirdStore.getState().setNotice("started");
    expect(useVirdStore.getState().notice).toBe("started");
  });

  it("notice is not part of the persisted (partialized) state", () => {
    useVirdStore.getState().setNotice("draft");
    const options = useVirdStore.persist.getOptions();
    const persisted = options.partialize?.(useVirdStore.getState()) as Record<string, unknown>;
    expect(persisted).not.toHaveProperty("notice");
  });

  it("resetVird restores every data field to its default", () => {
    useVirdStore.getState().upsertProgram(makeProgram());
    useVirdStore.getState().setActiveProgram("local-1");
    useVirdStore.getState().recordProgress("2026-02-01", "x", 1, 1);
    useVirdStore.getState().setReminderPrefs({ enabled: true, coords: { lat: 38.42, lng: 27.14 } });
    useVirdStore.getState().setNotice("started");

    useVirdStore.getState().resetVird();

    const state = useVirdStore.getState();
    expect(state.programs).toEqual([]);
    expect(state.activeProgramId).toBeNull();
    expect(state.dayProgress).toEqual({});
    expect(state.reminderPrefs).toEqual({
      enabled: false,
      slots: { morning: false, prayer: false, evening: false, night: false },
      coords: null
    });
    expect(state.notice).toBeNull();
  });

  describe("persisted state migration", () => {
    function migrate(persistedState: unknown, version: number) {
      const options = useVirdStore.persist.getOptions() as {
        migrate?: (state: unknown, version: number) => unknown;
      };
      if (!options.migrate) {
        throw new Error("migrate fonksiyonu tanımlı değil");
      }
      return options.migrate(persistedState, version);
    }

    it("passes the persisted state through untouched once already at the current version", () => {
      const persisted = { programs: [makeProgram()], activeProgramId: "local-1" };
      expect(migrate(persisted, 2)).toBe(persisted);
    });

    it("does not crash on undefined/null/corrupted persisted state and returns safe defaults", () => {
      for (const bogus of [undefined, null, "a string", 42, []]) {
        expect(() => migrate(bogus, 0)).not.toThrow();
        const result = migrate(bogus, 0) as VirdStore;
        expect(result.programs).toEqual([]);
        expect(result.dayProgress).toEqual({});
        expect(result.reminderPrefs).toEqual({
          enabled: false,
          slots: { morning: false, prayer: false, evening: false, night: false },
          coords: null
        });
      }
    });

    it("keeps valid fields and only defaults the corrupted ones", () => {
      const result = migrate(
        {
          programs: "not-an-array",
          activeProgramId: "kept-id",
          dayProgress: { "2026-01-01": { x: { count: 1, target: 1, completed: true } } },
          reminderPrefs: { enabled: true, slots: { morning: true, prayer: "nope" }, provinceKey: "bursa" },
          lastServerSyncAt: "2026-01-01T00:00:00.000Z"
        },
        0
      ) as VirdStore;

      expect(result.programs).toEqual([]); // corrupted -> default
      expect(result.activeProgramId).toBe("kept-id"); // valid -> kept
      expect(result.dayProgress).toEqual({ "2026-01-01": { x: { count: 1, target: 1, completed: true } } });
      expect(result.reminderPrefs).toEqual({
        enabled: true,
        slots: { morning: true, prayer: false, evening: false, night: false }, // "nope" -> default false
        coords: null
      });
      expect(result.lastServerSyncAt).toBe("2026-01-01T00:00:00.000Z");
    });

    it("v1 -> v2: drops provinceKey and starts coords at null", () => {
      const result = migrate(
        {
          programs: [],
          activeProgramId: null,
          dayProgress: {},
          reminderPrefs: {
            enabled: true,
            slots: { morning: true, prayer: false, evening: false, night: false },
            provinceKey: "istanbul"
          },
          lastServerSyncAt: null
        },
        1
      ) as VirdStore;

      expect(result.reminderPrefs).not.toHaveProperty("provinceKey");
      expect(result.reminderPrefs.coords).toBeNull();
      expect(result.reminderPrefs.enabled).toBe(true);
      expect(result.reminderPrefs.slots).toEqual({ morning: true, prayer: false, evening: false, night: false });
    });
  });
});
