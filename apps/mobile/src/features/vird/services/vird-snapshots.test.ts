import { describe, expect, it } from "vitest";
import type { VirdPhase } from "@zikirmatik/shared";
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import type { ZikirItem } from "../../focus/types";
import type { DhikrSnapshot, VirdProgramLocal } from "../types";
import {
  applyHydratedSnapshots,
  buildDhikrSnapshotFromCatalog,
  buildDhikrSnapshotFromPersonal,
  planVirdSnapshotHydration
} from "./vird-snapshots";

function makeProgram(overrides: Partial<VirdProgramLocal> = {}): VirdProgramLocal {
  return {
    id: "p1",
    clientId: "p1",
    origin: "server",
    kind: "routine",
    status: "active",
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

describe("planVirdSnapshotHydration", () => {
  it("returns empty lists when the program has no phases", () => {
    expect(planVirdSnapshotHydration(makeProgram())).toEqual({ missingCatalogRefs: [], missingCustomRefs: [] });
  });

  it("splits missing refs by dhikrId (catalog) vs customDhikrId (personal), skipping already-known refs", () => {
    const phases: VirdPhase[] = [
      {
        fromDay: 1,
        toDay: null,
        slots: {
          morning: [{ dhikrId: "cat-1", target: 33 }, { dhikrId: "cat-known", target: 10 }],
          evening: [{ customDhikrId: "custom-1", target: 5 }]
        }
      }
    ];
    const program = makeProgram({
      phases,
      dhikrs: { "cat-known": { ref: "cat-known", isCustom: false, name: "Bilinen" } }
    });

    const plan = planVirdSnapshotHydration(program);

    expect(plan.missingCatalogRefs).toEqual(["cat-1"]);
    expect(plan.missingCustomRefs).toEqual(["custom-1"]);
  });

  it("dedupes the same ref repeated across slots/phases", () => {
    const phases: VirdPhase[] = [
      {
        fromDay: 1,
        toDay: null,
        slots: {
          morning: [{ dhikrId: "cat-1", target: 33 }],
          evening: [{ dhikrId: "cat-1", target: 33 }]
        }
      }
    ];
    const plan = planVirdSnapshotHydration(makeProgram({ phases }));
    expect(plan.missingCatalogRefs).toEqual(["cat-1"]);
  });

  it("scans every phase, not just the first (a program spans multiple time-based phases)", () => {
    const phases: VirdPhase[] = [
      { fromDay: 1, toDay: 7, slots: { morning: [{ dhikrId: "week-1", target: 33 }] } },
      { fromDay: 8, toDay: null, slots: { morning: [{ dhikrId: "week-2", target: 33 }] } }
    ];
    const plan = planVirdSnapshotHydration(makeProgram({ phases }));
    expect(plan.missingCatalogRefs.sort()).toEqual(["week-1", "week-2"]);
  });
});

describe("buildDhikrSnapshotFromCatalog", () => {
  it("maps a BackendDhikr into a non-custom DhikrSnapshot", () => {
    const dhikr: BackendDhikr = {
      _id: "cat-1",
      nameArabic: "سبحان الله",
      name: { tr: "Sübhanallah", en: "Subhanallah" },
      transliteration: { tr: "Sübhanallah", en: "Subhanallah" },
      meaning: { tr: "Allah noksanlıklardan münezzehtir", en: "Glory be to Allah" },
      recommendedCount: 33
    };

    expect(buildDhikrSnapshotFromCatalog(dhikr)).toEqual({
      ref: "cat-1",
      isCustom: false,
      name: { tr: "Sübhanallah", en: "Subhanallah" },
      nameArabic: "سبحان الله",
      transliteration: { tr: "Sübhanallah", en: "Subhanallah" },
      meaning: { tr: "Allah noksanlıklardan münezzehtir", en: "Glory be to Allah" }
    });
  });
});

describe("buildDhikrSnapshotFromPersonal", () => {
  it("maps a personal ZikirItem into a custom DhikrSnapshot", () => {
    const item: Pick<ZikirItem, "id" | "name" | "arabic" | "transliteration" | "meaning"> = {
      id: "custom-1",
      name: "Benim Zikrim",
      arabic: undefined,
      transliteration: "Benim Zikrim",
      meaning: "Kişisel anlam"
    };

    expect(buildDhikrSnapshotFromPersonal(item)).toEqual({
      ref: "custom-1",
      isCustom: true,
      name: "Benim Zikrim",
      nameArabic: undefined,
      transliteration: "Benim Zikrim",
      meaning: "Kişisel anlam"
    });
  });
});

describe("applyHydratedSnapshots", () => {
  it("returns the same program reference when there is nothing new to merge", () => {
    const program = makeProgram();
    expect(applyHydratedSnapshots(program, {})).toBe(program);
  });

  it("merges new snapshots into dhikrs without dropping existing ones", () => {
    const existing: DhikrSnapshot = { ref: "cat-known", isCustom: false, name: "Bilinen" };
    const program = makeProgram({ dhikrs: { "cat-known": existing } });
    const added: DhikrSnapshot = { ref: "cat-1", isCustom: false, name: "Yeni" };

    const result = applyHydratedSnapshots(program, { "cat-1": added });

    expect(result).not.toBe(program);
    expect(result.dhikrs).toEqual({ "cat-known": existing, "cat-1": added });
  });
});
