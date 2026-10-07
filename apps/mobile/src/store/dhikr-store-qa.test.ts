import { beforeEach, describe, expect, it } from "vitest";
import { toDateKey } from "@zikirmatik/shared";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { ZikirItem } from "../features/focus/types";
import { useDhikrStore } from "./dhikr-store";
import { registerDhikrStoreText } from "./dhikr-store-text";

registerDhikrStoreText({
  saved: () => "Kayıtlı",
  notStarted: () => "Henüz başlanmadı",
  todayAt: () => "Bugün",
  lowercase: (value) => value.toLocaleLowerCase("tr-TR")
});

function makeItem(overrides: Partial<ZikirItem> = {}): ZikirItem {
  return {
    id: "personal-a",
    source: "personal",
    name: "Test",
    transliteration: "Test",
    current: 3,
    target: 33,
    lastActivityLabel: "Kayıtlı",
    streakDays: 0,
    isFavorite: false,
    ...overrides
  };
}

function makeLog(overrides: Partial<BackendDhikrLog> = {}): BackendDhikrLog {
  return {
    userId: "u1",
    customDhikrId: "personal-a",
    count: 10,
    targetCount: 33,
    date: toDateKey(new Date()),
    isFavorite: false,
    ...overrides
  } as BackendDhikrLog;
}

beforeEach(() => {
  useDhikrStore.getState().resetSessionScoped();
  useDhikrStore.setState({ items: [makeItem()], selectedDhikrId: "personal-a" });
});

const item = () => useDhikrStore.getState().items.find((i) => i.id === "personal-a");

describe("M-05 reset clears the undo point", () => {
  it("MOB-SAY-16: discarding after a reset does not bring the pre-reset count back", () => {
    const s = useDhikrStore.getState();
    for (let i = 0; i < 7; i += 1) s.incrementSelected();
    expect(item()?.current).toBe(10);

    useDhikrStore.getState().resetSelected();
    useDhikrStore.getState().discardUnsavedProgress("personal-a");

    expect(item()?.current).toBe(0);
  });
});

describe("M-06 / B-25 / B-26 selectDhikr", () => {
  it("applies the recommended target when asked and clamps the count", () => {
    useDhikrStore.getState().selectDhikr("personal-a", undefined, { target: 100 });
    expect(item()?.target).toBe(100);
  });

  it("keeps the current target when no target option is passed", () => {
    useDhikrStore.getState().selectDhikr("personal-a");
    expect(item()?.target).toBe(33);
  });

  it("B-26: an id missing from the local catalog is added from the fallback instead of silently ignored", () => {
    const fallback = makeItem({ id: "srv-1", source: "ready", current: 0, target: 11 });
    useDhikrStore.getState().selectDhikr("srv-1", undefined, { fallback, target: 21 });

    const state = useDhikrStore.getState();
    expect(state.selectedDhikrId).toBe("srv-1");
    expect(state.items.find((i) => i.id === "srv-1")?.target).toBe(21);
  });

  it("B-26: without a fallback an unknown id is still a no-op (nothing half-selected)", () => {
    useDhikrStore.getState().selectDhikr("nope");
    expect(useDhikrStore.getState().selectedDhikrId).toBe("personal-a");
  });

  it("clearDhikrProgress (fresh start) also drops the stale unsaved snapshot", () => {
    useDhikrStore.getState().incrementSelected();
    useDhikrStore.getState().clearDhikrProgress("personal-a");
    expect(useDhikrStore.getState().unsavedProgressDhikrIds).toEqual([]);
    expect(useDhikrStore.getState().unsavedProgressSnapshots).toEqual({});
  });
});

describe("M-01 startNewDay", () => {
  it("zeroes the counter, clears activity stamp and unsaved state", () => {
    useDhikrStore.getState().incrementSelected();
    useDhikrStore.getState().startNewDay("personal-a");

    expect(item()?.current).toBe(0);
    expect(item()?.lastActivityAt).toBeUndefined();
    expect(useDhikrStore.getState().unsavedProgressDhikrIds).toEqual([]);
    expect(useDhikrStore.getState().selectedDhikrId).toBe("personal-a");
  });
});

describe("B-8 taps that land while a save is in flight", () => {
  it("keeps the dhikr unsaved (restore point = saved count) when the count moved past the saved log", () => {
    const s = useDhikrStore.getState();
    for (let i = 0; i < 7; i += 1) s.incrementSelected(); // 10, save starts with 10
    for (let i = 0; i < 3; i += 1) useDhikrStore.getState().incrementSelected(); // 13 while in flight

    useDhikrStore.getState().applySavedBackendLog(makeLog({ count: 10 }));

    const state = useDhikrStore.getState();
    expect(state.unsavedProgressDhikrIds).toEqual(["personal-a"]);
    expect(state.unsavedProgressSnapshots["personal-a"]?.current).toBe(10);
    expect(item()?.current).toBe(13);
  });

  it("clears the unsaved mark when the saved count is the current count", () => {
    useDhikrStore.getState().incrementSelected();
    useDhikrStore.getState().applySavedBackendLog(makeLog({ count: 4 }));
    expect(useDhikrStore.getState().unsavedProgressDhikrIds).toEqual([]);
  });

  it("a vird/circle log never clears the main counter's unsaved mark", () => {
    useDhikrStore.getState().incrementSelected();
    useDhikrStore.getState().applySavedBackendLog(makeLog({ count: 4, virdProgramId: "v1" }));
    expect(useDhikrStore.getState().unsavedProgressDhikrIds).toEqual(["personal-a"]);
  });
});

describe("M-21 active day keys", () => {
  it("a reset or a zero count never records an active day", () => {
    useDhikrStore.getState().resetSelected();
    useDhikrStore.getState().setSelectedCount(0);
    expect(useDhikrStore.getState().activeDayKeys).toEqual([]);
  });

  it("a saved log with count 0 is not an active day; a saved yesterday log records yesterday", () => {
    useDhikrStore.getState().applySavedBackendLog(makeLog({ count: 0 }));
    expect(useDhikrStore.getState().activeDayKeys).toEqual([]);

    useDhikrStore.getState().applySavedBackendLog(makeLog({ count: 5, date: "2026-03-01" }));
    expect(useDhikrStore.getState().activeDayKeys).toEqual(["2026-03-01"]);
  });
});

describe("B-7 local personal dhikr whose server save failed", () => {
  it("survives a server hydration that does not know it, once marked unsaved", () => {
    useDhikrStore.getState().addCustomDhikr({ id: "personal-new", name: "Yeni", initialCount: 5 });
    useDhikrStore.getState().markPersonalUnsaved("personal-new");

    useDhikrStore.getState().hydratePersonalItems([]);

    expect(useDhikrStore.getState().items.some((i) => i.id === "personal-new")).toBe(true);
  });

  it("an unmarked local personal dhikr is still replaced by the server list (existing behaviour)", () => {
    useDhikrStore.getState().addCustomDhikr({ id: "personal-new", name: "Yeni", initialCount: 5 });
    useDhikrStore.getState().hydratePersonalItems([]);
    expect(useDhikrStore.getState().items.some((i) => i.id === "personal-new")).toBe(false);
  });
});
