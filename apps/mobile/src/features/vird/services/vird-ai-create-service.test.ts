import { describe, expect, it } from "vitest";

// vird-ai-create-service.ts -> ai-api-client.ts (AiApiError sınıfı için) ->
// react-native (Platform) + ../../../i18n zincirini gerçek modüllerle
// yüklemeye çalışmak vitest'in Vite/Rollup tabanlı SSR dönüşümünde
// react-native/index.js'in Flow söz dizimini (`import typeof * as ...`)
// çözemeyip patlamasına yol açar. Desen vird-sync.test.ts ile AYNI: yalnızca
// bu dosyanın kullandığı yüzeyi (Platform.OS, i18n.t/i18n.language) taklit
// eden minimal mock'lar.
import { AiApiError } from "../../ai-guide/services/ai-api-client";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import {
  buildAiVirdDhikrSnapshots,
  buildCreateAiVirdProgramPayload,
  mapAiVirdCreateError,
  toActivatedAiVirdProgramLocal
} from "./vird-ai-create-service";
import type { VirdPhase, VirdProgramLocal } from "../types";
import type { VirdProgram } from "@zikirmatik/shared";

describe("buildCreateAiVirdProgramPayload", () => {
  const baseState = {
    freeText: "",
    durationDays: 7 as const,
    slots: ["morning" as const],
    prayerSelection: []
  };

  it("omits freeText when blank/whitespace-only", () => {
    const payload = buildCreateAiVirdProgramPayload({ ...baseState, freeText: "   " }, "flow-1");
    expect(payload).not.toHaveProperty("freeText");
    expect(payload).toMatchObject({ flowId: "flow-1", durationDays: 7, slots: ["morning"] });
  });

  it("trims and includes freeText when present", () => {
    const payload = buildCreateAiVirdProgramPayload({ ...baseState, freeText: "  sabır  " }, "flow-1");
    expect(payload.freeText).toBe("sabır");
  });

  it("omits prayerSelection when 'prayer' slot is not selected", () => {
    const payload = buildCreateAiVirdProgramPayload(
      { ...baseState, slots: ["morning"], prayerSelection: [1, 2, 3, 4, 5] },
      "flow-1"
    );
    expect(payload).not.toHaveProperty("prayerSelection");
  });

  it("sorts prayerSelection when 'prayer' slot is selected", () => {
    const payload = buildCreateAiVirdProgramPayload(
      { ...baseState, slots: ["morning", "prayer"], prayerSelection: [5, 1, 3] },
      "flow-1"
    );
    expect(payload.prayerSelection).toEqual([1, 3, 5]);
  });

  it("omits prayerSelection when 'prayer' slot is selected but no prayer index is chosen", () => {
    const payload = buildCreateAiVirdProgramPayload(
      { ...baseState, slots: ["prayer"], prayerSelection: [] },
      "flow-1"
    );
    expect(payload).not.toHaveProperty("prayerSelection");
  });

  it("includes locale only when provided", () => {
    const withLocale = buildCreateAiVirdProgramPayload({ ...baseState, locale: "en" }, "flow-1");
    expect(withLocale.locale).toBe("en");

    const withoutLocale = buildCreateAiVirdProgramPayload(baseState, "flow-1");
    expect(withoutLocale).not.toHaveProperty("locale");
  });
});

describe("mapAiVirdCreateError", () => {
  const fallback = "fallback message";

  it("classifies AI_CREDIT_INSUFFICIENT as creditInsufficient", () => {
    const error = new AiApiError("terminal", "kredi yok", 403, "AI_CREDIT_INSUFFICIENT");
    expect(mapAiVirdCreateError(error, fallback)).toEqual({ kind: "creditInsufficient" });
  });

  it("classifies AI_UNAVAILABLE as unavailable and keeps server message", () => {
    const error = new AiApiError("transient", "şu an meşgul", 503, "AI_UNAVAILABLE");
    expect(mapAiVirdCreateError(error, fallback)).toEqual({ kind: "unavailable", message: "şu an meşgul" });
  });

  it("falls back to the fallback message when AI_UNAVAILABLE has no message", () => {
    const error = new AiApiError("transient", "", 503, "AI_UNAVAILABLE");
    expect(mapAiVirdCreateError(error, fallback)).toEqual({ kind: "unavailable", message: fallback });
  });

  it("classifies any other AiApiError (e.g. flowId reuse, validation) as terminal", () => {
    const error = new AiApiError("terminal", "flowId zaten kullanılmış", 403);
    expect(mapAiVirdCreateError(error, fallback)).toEqual({ kind: "terminal", message: "flowId zaten kullanılmış" });
  });

  it("classifies a non-AiApiError as terminal with the fallback message", () => {
    expect(mapAiVirdCreateError(new Error("network down"), fallback)).toEqual({
      kind: "terminal",
      message: fallback
    });
  });
});

function makeDhikr(overrides: Partial<BackendDhikr> & { _id: string }): BackendDhikr {
  return {
    nameArabic: "الذكر",
    name: { tr: "Zikir", en: "Dhikr" },
    transliteration: { tr: "zikir", en: "dhikr" },
    meaning: { tr: "Anlam", en: "Meaning" },
    recommendedCount: 33,
    ...overrides
  };
}

describe("buildAiVirdDhikrSnapshots", () => {
  const catalog = [
    makeDhikr({ _id: "dhikr-a", name: { tr: "Zikir A", en: "Dhikr A" } }),
    makeDhikr({ _id: "dhikr-b", name: { tr: "Zikir B", en: "Dhikr B" } })
  ];

  it("resolves a DhikrSnapshot for every referenced dhikrId across phases/slots", () => {
    const phases: VirdPhase[] = [
      {
        fromDay: 1,
        toDay: 7,
        slots: {
          morning: [{ dhikrId: "dhikr-a", target: 33 }],
          evening: [{ dhikrId: "dhikr-b", target: 100 }]
        }
      }
    ];

    const snapshots = buildAiVirdDhikrSnapshots(phases, catalog);
    expect(Object.keys(snapshots)).toEqual(["dhikr-a", "dhikr-b"]);
    expect(snapshots["dhikr-a"]).toEqual({
      ref: "dhikr-a",
      isCustom: false,
      name: { tr: "Zikir A", en: "Dhikr A" },
      nameArabic: "الذكر",
      transliteration: { tr: "zikir", en: "dhikr" },
      meaning: { tr: "Anlam", en: "Meaning" }
    });
  });

  it("skips items whose dhikrId is not present in the catalog", () => {
    const phases: VirdPhase[] = [
      { fromDay: 1, toDay: null, slots: { morning: [{ dhikrId: "missing", target: 33 }] } }
    ];

    expect(buildAiVirdDhikrSnapshots(phases, catalog)).toEqual({});
  });

  it("dedupes the same dhikrId referenced in multiple phases", () => {
    const phases: VirdPhase[] = [
      { fromDay: 1, toDay: 7, slots: { morning: [{ dhikrId: "dhikr-a", target: 33 }] } },
      { fromDay: 8, toDay: null, slots: { morning: [{ dhikrId: "dhikr-a", target: 33 }] } }
    ];

    expect(Object.keys(buildAiVirdDhikrSnapshots(phases, catalog))).toEqual(["dhikr-a"]);
  });
});

describe("toActivatedAiVirdProgramLocal", () => {
  it("maps the server program to VirdProgramLocal and fills dhikrs from the catalog", () => {
    const server: VirdProgram = {
      id: "program-1",
      userId: "user-1",
      kind: "journey",
      status: "active",
      source: "ai",
      title: { tr: "Sabır Programı", en: "Patience Program" },
      startDate: "2026-09-13",
      endDate: "2026-09-19",
      dayCount: 7,
      phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId: "dhikr-a", target: 33 }] } }],
      prayerSelection: [1, 2, 3, 4, 5],
      reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
      createdAt: "2026-09-13T08:00:00.000Z",
      updatedAt: "2026-09-13T08:00:00.000Z"
    };
    const catalog = [makeDhikr({ _id: "dhikr-a" })];

    const local: VirdProgramLocal = toActivatedAiVirdProgramLocal(server, catalog);

    expect(local.id).toBe("program-1");
    expect(local.origin).toBe("server");
    expect(local.clientId).toBe("program-1");
    expect(Object.keys(local.dhikrs)).toEqual(["dhikr-a"]);
  });
});
