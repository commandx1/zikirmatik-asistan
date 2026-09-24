import { describe, expect, it, vi } from "vitest";
import type { VirdProgram } from "@zikirmatik/shared";
import type { GuestMigrationSnapshot, GuestVirdSnapshot } from "../../../store/guest-migration-store";
import type { VirdProgramLocal } from "../../vird/types";
import { planGuestMigration, planVirdMigration, type GuestMigrationBackendState } from "./guest-migration";

vi.mock("../../../i18n", () => ({
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

const DATE_KEY = "2026-02-14";
const VERIFIED_ID = "65f0c1a2b3d4e5f601234567";

function makeSnapshot(items: GuestMigrationSnapshot["items"]): GuestMigrationSnapshot {
  return {
    id: "guest-migration-test",
    capturedAt: `${DATE_KEY}T10:00:00.000Z`,
    dateKey: DATE_KEY,
    items
  };
}

function makeBackend(overrides: Partial<GuestMigrationBackendState> = {}): GuestMigrationBackendState {
  return {
    verifiedDhikrs: [
      {
        _id: VERIFIED_ID,
        nameArabic: "سُبْحَانَ اللَّهِ",
        name: { tr: "Sübhanallah", en: "Sübhanallah" },
        transliteration: { tr: "Subhanallah", en: "Subhanallah" },
        meaning: { tr: "Allah her türlü eksiklikten uzaktır", en: "Allah her türlü eksiklikten uzaktır" },
        recommendedCount: 33
      }
    ],
    userDhikrs: [],
    logs: [],
    existingVirdPrograms: [],
    ...overrides
  };
}

function makeLocalVirdProgram(overrides: Partial<VirdProgramLocal> = {}): VirdProgramLocal {
  return {
    id: "local-program-1",
    clientId: "client-program-1",
    origin: "local",
    kind: "routine",
    status: "active",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
    startDate: DATE_KEY,
    phases: [
      {
        fromDay: 1,
        toDay: null,
        slots: {
          morning: [{ customDhikrId: "custom-1", target: 33 }],
          prayer: [{ dhikrId: VERIFIED_ID, target: 10 }]
        }
      }
    ],
    prayerSelection: [1, 2, 3, 4, 5],
    reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
    dhikrs: {
      "custom-1": { ref: "custom-1", isCustom: true, name: "Kendi zikrim" },
      [VERIFIED_ID]: { ref: VERIFIED_ID, isCustom: false, name: { tr: "Sübhanallah", en: "Sübhanallah" } }
    },
    createdAt: `${DATE_KEY}T00:00:00.000Z`,
    updatedAt: `${DATE_KEY}T00:00:00.000Z`,
    ...overrides
  };
}

function makeServerVirdProgram(overrides: Partial<VirdProgram> = {}): VirdProgram {
  return {
    id: "server-program-1",
    userId: "user-1",
    clientId: "client-program-1",
    kind: "routine",
    status: "active",
    source: "manual",
    title: { tr: "Test Vird", en: "Test Vird" },
    startDate: DATE_KEY,
    phases: [],
    prayerSelection: [1, 2, 3, 4, 5],
    reminders: { enabled: false, slots: { morning: false, prayer: false, evening: false, night: false } },
    createdAt: `${DATE_KEY}T00:00:00.000Z`,
    updatedAt: `${DATE_KEY}T00:00:00.000Z`,
    ...overrides
  };
}

function makeVirdSnapshot(overrides: Partial<GuestVirdSnapshot> = {}): GuestVirdSnapshot {
  const program = makeLocalVirdProgram();
  return {
    programs: [program],
    activeProgramId: program.id,
    dayProgress: {},
    ...overrides
  };
}

describe("planGuestMigration", () => {
  it("matches static slug ids to verified dhikrs by normalized name", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: "subhanallah",
          source: "ready",
          name: "Sübhanallah",
          transliteration: "Subhanallah",
          current: 21,
          target: 33,
          isFavorite: false
        }
      ]),
      makeBackend()
    );

    expect(plan.createLogs).toHaveLength(1);
    expect(plan.createLogs[0]).toMatchObject({
      dhikrId: VERIFIED_ID,
      count: 21,
      targetCount: 33,
      date: DATE_KEY,
      source: "manual",
      isCompleted: false
    });
    expect(plan.createUserDhikrs).toHaveLength(0);
  });

  it("skips a log when the backend already has >= count on the same day (max wins, idempotent re-run)", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: "subhanallah",
          source: "ready",
          name: "Sübhanallah",
          transliteration: "Subhanallah",
          current: 21,
          target: 33,
          isFavorite: false
        }
      ]),
      makeBackend({
        logs: [
          {
            _id: "log-1",
            userId: "user-1",
            dhikrId: VERIFIED_ID,
            count: 33,
            targetCount: 33,
            date: DATE_KEY,
            isCompleted: true
          }
        ]
      })
    );

    expect(plan.createLogs).toHaveLength(0);
    expect(plan.skippedItemIds).toEqual(["subhanallah"]);
  });

  it("creates the log when local count beats the backend same-day max", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: "subhanallah",
          source: "ready",
          name: "Sübhanallah",
          transliteration: "Subhanallah",
          current: 40,
          target: 33,
          isFavorite: false
        }
      ]),
      makeBackend({
        logs: [
          {
            _id: "log-1",
            userId: "user-1",
            dhikrId: VERIFIED_ID,
            count: 10,
            targetCount: 33,
            date: DATE_KEY,
            isCompleted: false
          }
        ]
      })
    );

    expect(plan.createLogs).toHaveLength(1);
    expect(plan.createLogs[0]).toMatchObject({ count: 40, isCompleted: true });
  });

  it("unions personal dhikrs by clientId without duplicating existing ones", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: "personal-1",
          source: "personal",
          name: "Kendi zikrim",
          transliteration: "",
          current: 5,
          target: 100,
          isFavorite: true
        },
        {
          id: "personal-2",
          source: "personal",
          name: "Zaten var",
          transliteration: "",
          current: 0,
          target: 10,
          isFavorite: true
        }
      ]),
      makeBackend({
        userDhikrs: [
          {
            _id: "ud-1",
            userId: "user-1",
            clientId: "personal-2",
            name: "Zaten var",
            target: 10,
            isFavorite: false
          }
        ]
      })
    );

    expect(plan.createUserDhikrs).toHaveLength(1);
    expect(plan.createUserDhikrs[0]).toMatchObject({ clientId: "personal-1", name: "Kendi zikrim" });
    expect(plan.createLogs).toHaveLength(1);
    expect(plan.createLogs[0]).toMatchObject({ customDhikrId: "personal-1", count: 5, isFavorite: true });
  });

  it("uses the raw ObjectId directly and flags favorite-only items via favoriteUpdates", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: VERIFIED_ID,
          source: "ready",
          name: "Sübhanallah",
          transliteration: "Subhanallah",
          current: 0,
          target: 33,
          isFavorite: true
        }
      ]),
      makeBackend({
        logs: [
          {
            _id: "log-1",
            userId: "user-1",
            dhikrId: VERIFIED_ID,
            count: 33,
            targetCount: 33,
            date: "2026-02-10",
            isCompleted: true,
            isFavorite: false
          }
        ]
      })
    );

    expect(plan.createLogs).toHaveLength(0);
    expect(plan.favoriteUpdates).toEqual([{ dhikrId: VERIFIED_ID, isFavorite: true }]);
  });

  it("falls back to a custom key for ready items missing from the catalog", () => {
    const plan = planGuestMigration(
      makeSnapshot([
        {
          id: "eski-slug",
          source: "ready",
          name: "Katalogdan kalkan zikir",
          transliteration: "Yok",
          current: 7,
          target: 0,
          isFavorite: false
        }
      ]),
      makeBackend()
    );

    expect(plan.createLogs).toHaveLength(1);
    expect(plan.createLogs[0]).toMatchObject({
      customDhikrId: "eski-slug",
      customDhikrName: "Katalogdan kalkan zikir",
      count: 7,
      targetCount: 7,
      isCompleted: true
    });
  });

  it("plans nothing vird-related when the snapshot carries no local vird data", () => {
    const plan = planGuestMigration(makeSnapshot([]), makeBackend({ existingVirdPrograms: [] }));

    expect(plan.createVirdPrograms).toEqual([]);
    expect(plan.createVirdProgressLogs).toEqual([]);
  });

  it("incorporates planVirdMigration's output when the snapshot carries local vird data (integration)", () => {
    const snapshot = { ...makeSnapshot([]), vird: makeVirdSnapshot() };

    const plan = planGuestMigration(snapshot, makeBackend({ existingVirdPrograms: [] }));

    expect(plan.createVirdPrograms).toHaveLength(1);
    expect(plan.createVirdPrograms[0]).toMatchObject({ program: snapshot.vird.programs[0], shouldActivate: true });
  });
});

describe("planVirdMigration", () => {
  it("returns an empty plan when there is no local vird data", () => {
    expect(planVirdMigration(undefined, [])).toEqual({
      createVirdPrograms: [],
      createVirdProgressLogs: []
    });
  });

  it("plans creation for a local program absent from the server, marking it to activate when it is the active program", () => {
    const vird = makeVirdSnapshot();

    const plan = planVirdMigration(vird, []);

    expect(plan.createVirdPrograms).toHaveLength(1);
    expect(plan.createVirdPrograms[0]).toMatchObject({
      program: vird.programs[0],
      shouldActivate: true
    });
  });

  it("does not mark a program to activate when it is not the snapshot's active program", () => {
    const vird = makeVirdSnapshot({ activeProgramId: "some-other-program" });

    const plan = planVirdMigration(vird, []);

    expect(plan.createVirdPrograms[0]).toMatchObject({ shouldActivate: false });
  });

  it("activates none of two programs when neither matches activeProgramId", () => {
    const programA = makeLocalVirdProgram({ id: "prog-a", clientId: "client-a" });
    const programB = makeLocalVirdProgram({ id: "prog-b", clientId: "client-b" });
    const vird: GuestVirdSnapshot = { programs: [programA, programB], activeProgramId: null, dayProgress: {} };

    const plan = planVirdMigration(vird, []);

    expect(plan.createVirdPrograms).toHaveLength(2);
    expect(plan.createVirdPrograms.every((item) => item.shouldActivate === false)).toBe(true);
  });

  it("skips creating a program whose clientId already exists on the server (idempotent retry)", () => {
    const vird = makeVirdSnapshot();

    const plan = planVirdMigration(vird, [
      makeServerVirdProgram({ id: "server-1", clientId: vird.programs[0]!.clientId })
    ]);

    expect(plan.createVirdPrograms).toEqual([]);
  });

  it("plans a progress log for a dayProgress entry owned by the active program, tagged with vird fields", () => {
    const vird = makeVirdSnapshot({
      dayProgress: {
        [DATE_KEY]: {
          "morning:0:custom-1": { count: 20, target: 33, completed: false }
        }
      }
    });

    const plan = planVirdMigration(vird, []);

    expect(plan.createVirdProgressLogs).toHaveLength(1);
    expect(plan.createVirdProgressLogs[0]).toMatchObject({
      clientProgramId: vird.programs[0]!.clientId,
      payload: {
        customDhikrId: "custom-1",
        customDhikrName: "Kendi zikrim",
        count: 20,
        targetCount: 33,
        date: DATE_KEY,
        source: "manual",
        isCompleted: false,
        virdSlot: "morning",
        virdDayIndex: 1
      }
    });
    expect(plan.createVirdProgressLogs[0]!.payload).not.toHaveProperty("virdPrayerIndex");
  });

  it("resolves a dhikrId key (not customDhikrId) for a non-custom ref, and includes virdPrayerIndex for the prayer slot", () => {
    const vird = makeVirdSnapshot({
      dayProgress: {
        [DATE_KEY]: {
          [`prayer:2:${VERIFIED_ID}`]: { count: 10, target: 10, completed: true }
        }
      }
    });

    const plan = planVirdMigration(vird, []);

    expect(plan.createVirdProgressLogs).toHaveLength(1);
    expect(plan.createVirdProgressLogs[0]!.payload).toMatchObject({
      dhikrId: VERIFIED_ID,
      virdSlot: "prayer",
      virdPrayerIndex: 2,
      isCompleted: true
    });
    expect(plan.createVirdProgressLogs[0]!.payload).not.toHaveProperty("customDhikrId");
  });

  it("drops a dayProgress entry whose itemKey matches no program's expected items, without throwing", () => {
    const vird = makeVirdSnapshot({
      dayProgress: {
        [DATE_KEY]: {
          "night:0:unknown-ref": { count: 5, target: 33, completed: false }
        }
      }
    });

    expect(() => planVirdMigration(vird, [])).not.toThrow();
    expect(planVirdMigration(vird, []).createVirdProgressLogs).toEqual([]);
  });

  it("drops a dayProgress entry with a zero/negative count", () => {
    const vird = makeVirdSnapshot({
      dayProgress: {
        [DATE_KEY]: {
          "morning:0:custom-1": { count: 0, target: 33, completed: false }
        }
      }
    });

    expect(planVirdMigration(vird, []).createVirdProgressLogs).toEqual([]);
  });
});
