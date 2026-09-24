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

describe("dhikr-store", () => {
  beforeEach(() => {
    useDhikrStore.setState({
      items: [],
      selectedDhikrId: "",
      activeAiContext: undefined,
      freeModeCount: 0,
      freeModeTarget: 0,
      freeModeLapSize: 33,
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

      const item = result.items[0]!;
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

      const item = result.items[0]!;
      expect(item.nameTurkish).toBeUndefined();
      expect(item.name).toBe("Kendi zikrim");
    });

    it("is a no-op once the persisted version is already current", () => {
      const persisted = { items: [{ id: "a", name: { tr: "X", en: "X" } }] };
      const result = migrate(persisted, 2);
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
      expect(result.items[0]!.id).toBe("ready-a");
    });

    it("falls back to a safe empty name when a ready item has neither nameTurkish nor name", () => {
      const result = migrate(
        {
          items: [{ id: "ready-a", source: "ready", current: 0, target: 33 }]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0]!.name).toEqual({ tr: "", en: "" });
    });

    it("falls back to an empty string name for a personal item missing both nameTurkish and name", () => {
      const result = migrate(
        {
          items: [{ id: "personal-a", source: "personal", current: 0, target: 33 }]
        },
        0
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0]!.name).toBe("");
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

      expect(result.items[0]!.name).toEqual({ tr: "Zaten migrate edilmiş", en: "Already migrated" });
    });
  });

  describe("persisted state migration (v1 -> v2, optional lapSize)", () => {
    function migrate(persistedState: unknown, version: number) {
      const options = useDhikrStore.persist.getOptions() as {
        migrate?: (state: unknown, version: number) => unknown;
      };
      if (!options.migrate) {
        throw new Error("migrate fonksiyonu tanımlı değil");
      }
      return options.migrate(persistedState, version);
    }

    it("passes v1 (LocalizedText, no lapSize) items through without crashing or inventing a lapSize", () => {
      const result = migrate(
        {
          items: [
            {
              id: "ready-a",
              source: "ready",
              name: { tr: "Estağfirullah", en: "Estağfirullah" },
              transliteration: { tr: "Estağfirullah", en: "Estağfirullah" },
              current: 5,
              target: 33
            }
          ],
          freeModeCount: 0,
          freeModeTarget: 0
        },
        1
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.lapSize).toBeUndefined();
      expect(result.items[0]!.name).toEqual({ tr: "Estağfirullah", en: "Estağfirullah" });
      expect(result.items[0]!.current).toBe(5);
    });

    it("keeps an already-set lapSize on a v1 item untouched", () => {
      const result = migrate(
        {
          items: [
            {
              id: "personal-a",
              source: "personal",
              name: "Kendi zikrim",
              current: 0,
              target: 99,
              lapSize: 99
            }
          ]
        },
        1
      ) as { items: Array<Record<string, unknown>> };

      expect(result.items[0]!.lapSize).toBe(99);
    });

    it("does not crash migrating v1 -> v2 on corrupted/missing state", () => {
      expect(() => migrate(undefined, 1)).not.toThrow();
      expect(() => migrate(null, 1)).not.toThrow();
      expect(() => migrate({ items: "not-an-array" }, 1)).not.toThrow();
      expect((migrate({ items: "not-an-array" }, 1) as { items: unknown }).items).toEqual([]);
    });
  });

  describe("lap size", () => {
    it("clamps setSelectedLapSize to 1..9999 (normalizeTarget pattern) and defaults non-numeric input to 33", () => {
      useDhikrStore.setState({
        items: [
          {
            id: "personal-a",
            source: "personal",
            name: "Test zikri",
            transliteration: "Test zikri",
            current: 0,
            target: 0,
            lastActivityLabel: "Henüz başlanmadı",
            streakDays: 0,
            isFavorite: false
          }
        ],
        selectedDhikrId: "personal-a"
      });

      useDhikrStore.getState().setSelectedLapSize(99);
      expect(useDhikrStore.getState().items[0]!.lapSize).toBe(99);

      useDhikrStore.getState().setSelectedLapSize(50000);
      expect(useDhikrStore.getState().items[0]!.lapSize).toBe(9999);

      useDhikrStore.getState().setSelectedLapSize(-5);
      expect(useDhikrStore.getState().items[0]!.lapSize).toBe(1);

      useDhikrStore.getState().setSelectedLapSize(0);
      expect(useDhikrStore.getState().items[0]!.lapSize).toBe(1);

      useDhikrStore.getState().setSelectedLapSize(Number.NaN);
      expect(useDhikrStore.getState().items[0]!.lapSize).toBe(33);
    });

    it("leaves other items' lapSize untouched", () => {
      useDhikrStore.setState({
        items: [
          {
            id: "personal-a",
            source: "personal",
            name: "A",
            transliteration: "A",
            current: 0,
            target: 0,
            lastActivityLabel: "Henüz başlanmadı",
            streakDays: 0,
            isFavorite: false
          },
          {
            id: "personal-b",
            source: "personal",
            name: "B",
            transliteration: "B",
            current: 0,
            target: 0,
            lastActivityLabel: "Henüz başlanmadı",
            streakDays: 0,
            isFavorite: false,
            lapSize: 99
          }
        ],
        selectedDhikrId: "personal-a"
      });

      useDhikrStore.getState().setSelectedLapSize(11);

      const items = useDhikrStore.getState().items;
      expect(items.find((item) => item.id === "personal-a")?.lapSize).toBe(11);
      expect(items.find((item) => item.id === "personal-b")?.lapSize).toBe(99);
    });

    it("clamps setFreeModeLapSize the same way", () => {
      useDhikrStore.getState().setFreeModeLapSize(99);
      expect(useDhikrStore.getState().freeModeLapSize).toBe(99);

      useDhikrStore.getState().setFreeModeLapSize(-1);
      expect(useDhikrStore.getState().freeModeLapSize).toBe(1);

      useDhikrStore.getState().setFreeModeLapSize(20000);
      expect(useDhikrStore.getState().freeModeLapSize).toBe(9999);
    });
  });

  describe("freeModeActivityAt", () => {
    it("incrementFreeMode writes a fresh timestamp", () => {
      useDhikrStore.getState().incrementFreeMode();
      const activityAt = useDhikrStore.getState().freeModeActivityAt;
      expect(activityAt).toBeDefined();
      expect(Number.isNaN(new Date(activityAt!).getTime())).toBe(false);
    });

    it("resetFreeMode clears the timestamp", () => {
      useDhikrStore.getState().incrementFreeMode();
      useDhikrStore.getState().resetFreeMode();
      expect(useDhikrStore.getState().freeModeActivityAt).toBeUndefined();
    });

    it("clearFreeModeSession clears the timestamp", () => {
      useDhikrStore.getState().incrementFreeMode();
      useDhikrStore.getState().clearFreeModeSession();
      expect(useDhikrStore.getState().freeModeActivityAt).toBeUndefined();
    });
  });

  describe("hydration lastActivityAt", () => {
    it("keeps local current and lastActivityAt when the item has unsaved progress", () => {
      const existingActivityAt = "2026-09-15T08:00:00.000Z";
      useDhikrStore.setState({
        items: [
          {
            id: "personal-a",
            source: "personal",
            name: "Test zikri",
            transliteration: "Test zikri",
            current: 5,
            target: 33,
            lastActivityLabel: "Kayıtlı",
            lastActivityAt: existingActivityAt,
            streakDays: 0,
            isFavorite: false
          }
        ],
        selectedDhikrId: "personal-a",
        unsavedProgressDhikrIds: ["personal-a"]
      });

      useDhikrStore.getState().hydratePersonalItems([
        {
          id: "personal-a",
          name: "Test zikri",
          transliteration: "Test zikri",
          current: 40,
          target: 33,
          lastActivityAt: "2026-09-21T09:00:00.000Z"
        }
      ]);

      const item = useDhikrStore.getState().items.find((value) => value.id === "personal-a");
      expect(item?.current).toBe(5);
      expect(item?.lastActivityAt).toBe(existingActivityAt);
    });

    it("adopts the server lastActivityAt when there is no unsaved progress", () => {
      useDhikrStore.setState({
        items: [],
        unsavedProgressDhikrIds: []
      });

      useDhikrStore.getState().hydratePersonalItems([
        {
          id: "personal-a",
          name: "Test zikri",
          transliteration: "Test zikri",
          current: 10,
          target: 33,
          lastActivityAt: "2026-09-21T09:00:00.000Z"
        }
      ]);

      const item = useDhikrStore.getState().items.find((value) => value.id === "personal-a");
      expect(item?.lastActivityAt).toBe("2026-09-21T09:00:00.000Z");
    });
  });
});
