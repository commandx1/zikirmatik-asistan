import { describe, expect, it, vi } from "vitest";
import type { GuestMigrationSnapshot } from "../../../store/guest-migration-store";
import { planGuestMigration, type GuestMigrationBackendState } from "./guest-migration";

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

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

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
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
});
