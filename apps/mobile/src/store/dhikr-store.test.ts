import { beforeEach, describe, expect, it, vi } from "vitest";
import { useDhikrStore } from "./dhikr-store";

vi.mock("../i18n", () => ({
  i18n: {
    t: (key: string, opts?: Record<string, unknown>) => {
      if (key === "focus:relativeDate.saved") return "Kayıtlı";
      if (key === "focus:relativeDate.notStarted") return "Henüz başlanmadı";
      if (key === "focus:relativeDate.todayAt") return `Bugün ${opts?.time ?? ""}`;
      return key;
    },
    changeLanguage: vi.fn()
  },
  detectDeviceLocale: () => "tr"
}));

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
      activeAiContext: undefined,
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
          name: "Test zikri",
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
        name: "Test zikri",
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
          name: "Test zikri",
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
        name: "Test zikri",
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
          name: "Test zikri",
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

  it("keeps AI recommendation context with the selected dhikr until selection is cleared", () => {
    useDhikrStore.setState({
      items: [
        {
          id: "ready-a",
          source: "ready",
          name: { tr: "Dua A", en: "Dua A" },
          transliteration: { tr: "Dua A", en: "Dua A" },
          current: 0,
          target: 33,
          lastActivityLabel: "Henüz başlanmadı",
          streakDays: 0,
          isFavorite: false
        }
      ]
    });

    useDhikrStore.getState().selectDhikr("ready-a", {
      recommendationId: "rec-a",
      prompt: "borç sıkıntısı",
      assistantNote: "Bu öneri borç sıkıntısı bağlamında seçildi."
    });

    expect(useDhikrStore.getState().activeAiContext).toEqual({
      dhikrId: "ready-a",
      recommendationId: "rec-a",
      prompt: "borç sıkıntısı",
      assistantNote: "Bu öneri borç sıkıntısı bağlamında seçildi."
    });

    useDhikrStore.getState().clearSelectedDhikr();

    expect(useDhikrStore.getState().activeAiContext).toBeUndefined();
  });

  describe("persisted state migration (v0 -> v1, nameTurkish -> LocalizedText)", () => {
    function migrate(persistedState: unknown, version: number) {
      const options = useDhikrStore.persist.getOptions() as {
        migrate?: (state: unknown, version: number) => unknown;
      };
      if (!options.migrate) {
        throw new Error("migrate fonksiyonu tanımlı değil");
      }
      return options.migrate(persistedState, version);
    }

    it("converts a legacy ready-item's plain-string fields into LocalizedText", () => {
      const result = migrate(
        {
          items: [
            {
              id: "ready-a",
              source: "ready",
              nameTurkish: "Estağfirullah",
              transliteration: "Estağfirullah",
              meaning: "Allah'tan bağışlanma dilerim",
              virtue: "Çokça tekrar edilmesi tavsiye edilir",
              contentSource: "Hısnu'l-Muslim",
              current: 0,
              target: 33
            }
          ]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      const item = result.items[0];
      expect(item.nameTurkish).toBeUndefined();
      expect(item.name).toEqual({ tr: "Estağfirullah", en: "Estağfirullah" });
      expect(item.transliteration).toEqual({ tr: "Estağfirullah", en: "Estağfirullah" });
      expect(item.meaning).toEqual({ tr: "Allah'tan bağışlanma dilerim", en: "Allah'tan bağışlanma dilerim" });
      expect(item.virtue).toEqual({
        tr: "Çokça tekrar edilmesi tavsiye edilir",
        en: "Çokça tekrar edilmesi tavsiye edilir"
      });
      expect(item.contentSource).toEqual({ tr: "Hısnu'l-Muslim", en: "Hısnu'l-Muslim" });
    });

    it("keeps a legacy personal item's name as a plain string", () => {
      const result = migrate(
        {
          items: [
            {
              id: "personal-a",
              source: "personal",
              nameTurkish: "Kendi zikrim",
              current: 0,
              target: 33
            }
          ]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      const item = result.items[0];
      expect(item.nameTurkish).toBeUndefined();
      expect(item.name).toBe("Kendi zikrim");
    });

    it("is a no-op once the persisted version is already current", () => {
      const persisted = { items: [{ id: "a", name: { tr: "X", en: "X" } }] };
      const result = migrate(persisted, 1);
      expect(result).toBe(persisted);
    });

    it("does not crash on undefined persisted state", () => {
      const result = migrate(undefined, 0) as { items: unknown };
      expect(result.items).toEqual([]);
    });

    it("does not crash on null persisted state", () => {
      const result = migrate(null, 0) as { items: unknown };
      expect(result.items).toEqual([]);
    });

    it("does not crash when items is missing or not an array", () => {
      expect((migrate({}, 0) as { items: unknown }).items).toEqual([]);
      expect((migrate({ items: "not-an-array" }, 0) as { items: unknown }).items).toEqual([]);
      expect((migrate({ items: null }, 0) as { items: unknown }).items).toEqual([]);
    });

    it("drops non-object entries from a corrupted items array instead of crashing", () => {
      const result = migrate(
        {
          items: [null, "corrupted", 42, { id: "ready-a", source: "ready", nameTurkish: "Sağlam kayıt" }]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items).toHaveLength(1);
      expect(result.items[0].id).toBe("ready-a");
    });

    it("falls back to a safe empty name when a ready item has neither nameTurkish nor name", () => {
      const result = migrate(
        {
          items: [{ id: "ready-a", source: "ready", current: 0, target: 33 }]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0].name).toEqual({ tr: "", en: "" });
    });

    it("falls back to an empty string name for a personal item missing both nameTurkish and name", () => {
      const result = migrate(
        {
          items: [{ id: "personal-a", source: "personal", current: 0, target: 33 }]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0].name).toBe("");
    });

    it("leaves an already-migrated LocalizedText name untouched", () => {
      const result = migrate(
        {
          items: [
            {
              id: "ready-a",
              source: "ready",
              name: { tr: "Zaten migrate edilmiş", en: "Already migrated" },
              current: 0,
              target: 33
            }
          ]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0].name).toEqual({ tr: "Zaten migrate edilmiş", en: "Already migrated" });
    });
  });
});
