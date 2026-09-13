import { describe, expect, it, vi } from "vitest";
import { buildActiveVirdContext, buildVirdLogFields, resolveVirdStartSnapshot } from "./use-vird-counter-bridge";
import type { ActiveVirdContext } from "../../../store/dhikr-store";

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string) => key
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

describe("buildActiveVirdContext", () => {
  it("builds a non-prayer context without a prayerIndex field", () => {
    const context = buildActiveVirdContext(
      { id: "program-a" },
      { itemKey: "morning:0:dhikr-1", slot: "morning", prayerIndex: null, target: 33 },
      5
    );

    expect(context).toEqual({
      programId: "program-a",
      itemKey: "morning:0:dhikr-1",
      slot: "morning",
      dayIndex: 5,
      target: 33
    });
    expect(context).not.toHaveProperty("prayerIndex");
  });

  it("includes prayerIndex for a prayer-slot item", () => {
    const context = buildActiveVirdContext(
      { id: "program-a" },
      { itemKey: "prayer:3:dhikr-1", slot: "prayer", prayerIndex: 3, target: 10 },
      5
    );

    expect(context).toEqual({
      programId: "program-a",
      itemKey: "prayer:3:dhikr-1",
      slot: "prayer",
      prayerIndex: 3,
      dayIndex: 5,
      target: 10
    });
  });
});

describe("buildVirdLogFields", () => {
  it("returns an empty object when there is no active vird context", () => {
    expect(buildVirdLogFields(null)).toEqual({});
  });

  it("maps a non-prayer slot context without a virdPrayerIndex field", () => {
    const context: ActiveVirdContext = {
      programId: "program-a",
      itemKey: "morning:0:dhikr-1",
      slot: "morning",
      dayIndex: 3,
      target: 33
    };

    expect(buildVirdLogFields(context)).toEqual({
      virdProgramId: "program-a",
      virdSlot: "morning",
      virdDayIndex: 3
    });
  });

  it("includes virdPrayerIndex for a prayer-slot context", () => {
    const context: ActiveVirdContext = {
      programId: "program-a",
      itemKey: "prayer:2:dhikr-1",
      slot: "prayer",
      prayerIndex: 2,
      dayIndex: 3,
      target: 10
    };

    expect(buildVirdLogFields(context)).toEqual({
      virdProgramId: "program-a",
      virdSlot: "prayer",
      virdDayIndex: 3,
      virdPrayerIndex: 2
    });
  });
});

describe("resolveVirdStartSnapshot", () => {
  it("returns undefined (skip upsert) when the dhikr already exists in the store", () => {
    const result = resolveVirdStartSnapshot(
      { dhikrs: {} },
      { ref: "dhikr-1", target: 33 },
      ["dhikr-1", "dhikr-2"]
    );

    expect(result).toBeUndefined();
  });

  it("builds a 'ready' snapshot from a non-custom denormalized dhikrs entry", () => {
    const result = resolveVirdStartSnapshot(
      {
        dhikrs: {
          "dhikr-1": {
            ref: "dhikr-1",
            isCustom: false,
            name: { tr: "Sübhanallah", en: "Subhanallah" },
            nameArabic: "سُبْحَانَ اللَّهِ",
            transliteration: { tr: "Subhanallah", en: "Subhanallah" },
            meaning: { tr: "Anlam", en: "Meaning" }
          }
        }
      },
      { ref: "dhikr-1", target: 33 },
      []
    );

    expect(result).toMatchObject({
      id: "dhikr-1",
      source: "ready",
      name: { tr: "Sübhanallah", en: "Subhanallah" },
      arabic: "سُبْحَانَ اللَّهِ",
      target: 33,
      current: 0,
      isFavorite: false
    });
  });

  it("builds a 'personal' snapshot from a custom denormalized dhikrs entry", () => {
    const result = resolveVirdStartSnapshot(
      {
        dhikrs: {
          "custom-1": {
            ref: "custom-1",
            isCustom: true,
            name: "Kendi zikrim"
          }
        }
      },
      { ref: "custom-1", target: 100 },
      []
    );

    expect(result).toMatchObject({
      id: "custom-1",
      source: "personal",
      name: "Kendi zikrim",
      transliteration: "Kendi zikrim",
      target: 100
    });
  });

  it("falls back to a generic placeholder name when the program has no denormalized snapshot for the ref", () => {
    const result = resolveVirdStartSnapshot({ dhikrs: {} }, { ref: "unknown-ref", target: 33 }, []);

    expect(result).toMatchObject({
      id: "unknown-ref",
      source: "ready",
      name: "vird:home.itemFallbackName",
      transliteration: "vird:home.itemFallbackName"
    });
  });
});
