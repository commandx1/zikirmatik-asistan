import { describe, expect, it } from "vitest";
import type { VirdPhase, VirdPhaseSlots, VirdTemplateDetail } from "@zikirmatik/shared";
import {
  buildAutoVirdTitle,
  buildEditorSlotsFromPhase,
  buildLocalProgramFromTemplate,
  countDistinctDhikrRefs,
  toLocalizedText,
  wouldExceedFreeDhikrLimit
} from "./vird-editor-helpers";

describe("toLocalizedText", () => {
  it("mirrors the trimmed value into both tr and en", () => {
    expect(toLocalizedText("  Sabah Virdim  ")).toEqual({ tr: "Sabah Virdim", en: "Sabah Virdim" });
  });
});

describe("countDistinctDhikrRefs", () => {
  it("counts unique refs across slots, deduping repeats of the same ref", () => {
    const slots: VirdPhaseSlots = {
      morning: [{ dhikrId: "d1", target: 33 }],
      evening: [{ dhikrId: "d1", target: 33 }, { customDhikrId: "c1", target: 10 }]
    };
    expect(countDistinctDhikrRefs(slots)).toBe(2);
  });

  it("returns 0 for empty slots", () => {
    expect(countDistinctDhikrRefs({})).toBe(0);
  });
});

describe("wouldExceedFreeDhikrLimit", () => {
  it("never blocks premium users", () => {
    expect(wouldExceedFreeDhikrLimit(["d1", "d2", "d3"], "d4", true)).toBe(false);
  });

  it("does not block re-adding a ref that is already counted", () => {
    expect(wouldExceedFreeDhikrLimit(["d1", "d2", "d3"], "d1", false)).toBe(false);
  });

  it("allows growing up to the free limit (3 distinct dhikrs)", () => {
    expect(wouldExceedFreeDhikrLimit([], "d1", false)).toBe(false);
    expect(wouldExceedFreeDhikrLimit(["d1"], "d2", false)).toBe(false);
    expect(wouldExceedFreeDhikrLimit(["d1", "d2"], "d3", false)).toBe(false);
  });

  it("blocks a 4th distinct dhikr for free users", () => {
    expect(wouldExceedFreeDhikrLimit(["d1", "d2", "d3"], "d4", false)).toBe(true);
  });

  it("accepts a Set as well as an array", () => {
    expect(wouldExceedFreeDhikrLimit(new Set(["d1", "d2", "d3"]), "d4", false)).toBe(true);
  });
});

describe("buildAutoVirdTitle", () => {
  it("joins selected slots in VIRD_SLOT_KEYS order with a 'virdi'/'vird' suffix", () => {
    expect(buildAutoVirdTitle(["evening", "morning"])).toEqual({ tr: "Sabah-Akşam virdi", en: "Morning-Evening vird" });
  });

  it("handles a single selected slot", () => {
    expect(buildAutoVirdTitle(["night"])).toEqual({ tr: "Gece virdi", en: "Night vird" });
  });

  it("falls back to a generic placeholder when no slots are selected", () => {
    expect(buildAutoVirdTitle([])).toEqual({ tr: "Vird Programım", en: "My Vird Program" });
  });

  it("orders all five slots by VIRD_SLOT_KEYS regardless of input order", () => {
    expect(buildAutoVirdTitle(["free", "night", "evening", "prayer", "morning"])).toEqual({
      tr: "Sabah-Namaz sonrası-Akşam-Gece-Serbest virdi",
      en: "Morning-After prayer-Evening-Night-Free vird"
    });
  });
});

describe("buildEditorSlotsFromPhase", () => {
  it("maps a phase's slots to the flat editor {ref,isCustom,target} shape", () => {
    const phase: VirdPhase = {
      fromDay: 1,
      toDay: null,
      slots: {
        morning: [{ dhikrId: "d1", target: 33 }],
        free: [{ customDhikrId: "c1", target: 10 }]
      }
    };
    expect(buildEditorSlotsFromPhase(phase)).toEqual({
      morning: [{ ref: "d1", isCustom: false, target: 33 }],
      free: [{ ref: "c1", isCustom: true, target: 10 }]
    });
  });

  it("returns an empty object for an undefined phase", () => {
    expect(buildEditorSlotsFromPhase(undefined)).toEqual({});
  });
});

describe("buildLocalProgramFromTemplate", () => {
  function makeTemplate(overrides: Partial<VirdTemplateDetail> = {}): VirdTemplateDetail {
    return {
      key: "gunluk-esma",
      kind: "routine",
      isPremium: false,
      title: { tr: "Günlük Esma", en: "Daily Esma" },
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: {
            morning: [
              {
                dhikrId: "dhikr-1",
                key: "estagfirullah",
                name: { tr: "İstiğfar", en: "Istighfar" },
                nameArabic: "أستغفر الله",
                transliteration: { tr: "Estağfirullah", en: "Estağfirullah" },
                meaning: { tr: "Allah'tan bağışlanma dilerim", en: "I seek forgiveness from Allah" },
                target: 100
              }
            ]
          }
        }
      ],
      ...overrides
    };
  }

  it("builds a local, active, template-sourced program with denormalized dhikrs from the template detail", () => {
    const template = makeTemplate();
    const program = buildLocalProgramFromTemplate(template, {
      id: "local-1",
      clientId: "local-1",
      startDateKey: "2026-03-01",
      nowIso: "2026-03-01T00:00:00.000Z",
      fallbackTitle: { tr: "Vird Programı", en: "Vird Program" }
    });

    expect(program.origin).toBe("local");
    expect(program.status).toBe("draft");
    expect(program.source).toBe("template");
    expect(program.templateKey).toBe("gunluk-esma");
    expect(program.title).toEqual({ tr: "Günlük Esma", en: "Daily Esma" });
    expect(program.startDate).toBe("2026-03-01");
    expect(program.phases).toEqual([
      { fromDay: 1, toDay: null, note: undefined, slots: { morning: [{ dhikrId: "dhikr-1", target: 100 }] } }
    ]);
    expect(program.dhikrs["dhikr-1"]).toEqual({
      ref: "dhikr-1",
      isCustom: false,
      name: { tr: "İstiğfar", en: "Istighfar" },
      nameArabic: "أستغفر الله",
      transliteration: { tr: "Estağfirullah", en: "Estağfirullah" },
      meaning: { tr: "Allah'tan bağışlanma dilerim", en: "I seek forgiveness from Allah" }
    });
  });

  it("prefers the template's own anchorDate over the provided start date (special-day templates)", () => {
    const template = makeTemplate({ anchorDate: "2026-04-15" });
    const program = buildLocalProgramFromTemplate(template, {
      id: "local-2",
      clientId: "local-2",
      startDateKey: "2026-03-01",
      nowIso: "2026-03-01T00:00:00.000Z",
      fallbackTitle: { tr: "Vird Programı", en: "Vird Program" }
    });

    expect(program.startDate).toBe("2026-04-15");
  });

  it("falls back to the provided title when the template has no title (islami content may be optional)", () => {
    const template = makeTemplate({ title: undefined });
    const program = buildLocalProgramFromTemplate(template, {
      id: "local-3",
      clientId: "local-3",
      startDateKey: "2026-03-01",
      nowIso: "2026-03-01T00:00:00.000Z",
      fallbackTitle: { tr: "Vird Programı", en: "Vird Program" }
    });

    expect(program.title).toEqual({ tr: "Vird Programı", en: "Vird Program" });
  });
});
