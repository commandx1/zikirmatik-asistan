import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDhikrStore } from "./dhikr-store";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe("dhikr-store", () => {
  beforeEach(() => {
    useDhikrStore.setState({
      items: [],
      selectedDhikrId: "",
      freeModeCount: 0,
      freeModeTarget: 0,
      unsavedProgressDhikrIds: [],
      unsavedProgressSnapshots: {},
      isHydratedFromBackend: false,
      lastSavedBackendLog: undefined,
      syncError: undefined
    });
  });

  it("keeps unsaved selected progress when backend hydration is older", () => {
    useDhikrStore.setState({
      items: [
        {
          id: "personal-a",
          source: "personal",
          nameTurkish: "Test zikri",
          transliteration: "Test zikri",
          current: 3,
          target: 33,
          lastActivityLabel: "Kayıtlı",
          streakDays: 0,
          isFavorite: false
        }
      ],
      selectedDhikrId: "personal-a"
    });

    for (let index = 0; index < 7; index += 1) {
      useDhikrStore.getState().incrementSelected();
    }

    useDhikrStore.getState().hydratePersonalItems([
      {
        id: "personal-a",
        nameTurkish: "Test zikri",
        transliteration: "Test zikri",
        current: 3,
        target: 33
      }
    ]);

    expect(useDhikrStore.getState().items.find((item) => item.id === "personal-a")?.current).toBe(10);
  });

  it("uses backend progress again after the local progress is saved", () => {
    useDhikrStore.setState({
      items: [
        {
          id: "personal-a",
          source: "personal",
          nameTurkish: "Test zikri",
          transliteration: "Test zikri",
          current: 3,
          target: 33,
          lastActivityLabel: "Kayıtlı",
          streakDays: 0,
          isFavorite: false
        }
      ],
      selectedDhikrId: "personal-a"
    });

    useDhikrStore.getState().setSelectedCount(10);
    useDhikrStore.getState().applySavedBackendLog({
      _id: "log-a",
      userId: "user-a",
      customDhikrId: "personal-a",
      count: 10,
      targetCount: 33,
      date: "2026-06-03",
      isCompleted: false
    });

    useDhikrStore.getState().hydratePersonalItems([
      {
        id: "personal-a",
        nameTurkish: "Test zikri",
        transliteration: "Test zikri",
        current: 12,
        target: 33
      }
    ]);

    expect(useDhikrStore.getState().items.find((item) => item.id === "personal-a")?.current).toBe(12);
  });

  it("restores the saved snapshot when unsaved progress is discarded", () => {
    useDhikrStore.setState({
      items: [
        {
          id: "personal-a",
          source: "personal",
          nameTurkish: "Test zikri",
          transliteration: "Test zikri",
          current: 3,
          target: 33,
          lastActivityLabel: "Kayıtlı",
          streakDays: 0,
          isFavorite: false
        }
      ],
      selectedDhikrId: "personal-a"
    });

    for (let index = 0; index < 7; index += 1) {
      useDhikrStore.getState().incrementSelected();
    }

    expect(useDhikrStore.getState().items.find((item) => item.id === "personal-a")?.current).toBe(10);

    (useDhikrStore.getState() as unknown as { discardUnsavedProgress: (id: string) => void }).discardUnsavedProgress(
      "personal-a"
    );

    const item = useDhikrStore.getState().items.find((value) => value.id === "personal-a");
    expect(item?.current).toBe(3);
    expect(item?.target).toBe(33);
    expect(useDhikrStore.getState().unsavedProgressDhikrIds).toEqual([]);
  });
});
