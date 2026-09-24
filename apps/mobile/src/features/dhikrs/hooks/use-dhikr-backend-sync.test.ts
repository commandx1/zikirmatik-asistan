import { describe, expect, it, vi } from "vitest";
import type { BackendDhikrLog } from "../services/dhikr-logs-api-client";
import { resolveActivityDateKey } from "../../home/services/local-streak";

// use-dhikr-backend-sync.ts, test edilen saf indexLatestDhikrLogs'un yanında
// react-native/expo'ya kadar uzanan ağır bir bağımlılık zinciri (auth-store,
// dhikr-store, ai-api-client...) import eder. Bu test yalnızca saf
// fonksiyonu hedeflediğinden, o zinciri gerçekten yüklemeden (ve
// react-native'in Flow sözdizimini vitest/rollup'a kırdırmadan) stub'larız.
vi.mock("react-native", () => ({ Platform: { OS: "android", select: (o: Record<string, unknown>) => o?.android ?? o?.default } }));
vi.mock("../../../i18n", () => ({ i18n: { t: (key: string) => key } }));
vi.mock("../../../store/auth-store", () => ({ useAuthStore: vi.fn() }));
vi.mock("../../../store/dhikr-store", () => ({ useDhikrStore: vi.fn() }));
vi.mock("../../../store/profile-store", () => ({ useProfileStore: { getState: () => ({ locale: "tr" }) } }));
vi.mock("../../../lib/locale-format", () => ({ toIntlLocale: (locale: string) => locale }));
vi.mock("../../../store/guest-migration-store", () => ({ useGuestMigrationStore: vi.fn() }));
vi.mock("../../ai-shared/services/ai-queries", () => ({ fetchAiRecommendations: vi.fn() }));
vi.mock("../services/dhikr-queries", () => ({
  fetchDhikrCatalog: vi.fn(),
  fetchDhikrLogs: vi.fn(),
  fetchUserDhikrs: vi.fn()
}));
vi.mock("../services/dhikrs-api-client", () => ({
  DhikrsApiError: class DhikrsApiError extends Error {}
}));

const { indexLatestDhikrLogs } = await import("./use-dhikr-backend-sync");

function log(overrides: Partial<BackendDhikrLog>): BackendDhikrLog {
  return {
    _id: "log-id",
    userId: "user-1",
    count: 0,
    targetCount: 33,
    date: "2026-09-21",
    isCompleted: false,
    ...overrides
  };
}

describe("indexLatestDhikrLogs", () => {
  it("aynı dhikrId için vird logu atlanır, sade log kazanır", () => {
    const logs = [
      log({ dhikrId: "d1", count: 20, createdAt: "2026-09-10T08:00:00.000Z" }),
      log({ dhikrId: "d1", count: 100, virdProgramId: "vird-1", createdAt: "2026-09-21T08:00:00.000Z" })
    ];

    const { latestByDhikr } = indexLatestDhikrLogs(logs);
    expect(latestByDhikr.get("d1")?.count).toBe(20);
  });

  it("yalnız circleId'li log hiçbir öğeye hidrate edilmez", () => {
    const logs = [log({ dhikrId: "d1", count: 50, circleId: "circle-1" })];

    const { latestByDhikr } = indexLatestDhikrLogs(logs);
    expect(latestByDhikr.has("d1")).toBe(false);
  });

  it("createdAt 10 gün önce ise lastActivityAt o tarihi taşır ve resolveActivityDateKey bugüne çözmez", () => {
    const tenDaysAgo = new Date(2026, 8, 11, 8, 0, 0);
    const today = new Date(2026, 8, 21, 10, 0, 0);
    const logs = [log({ dhikrId: "d1", count: 33, createdAt: tenDaysAgo.toISOString() })];

    const { latestByDhikr } = indexLatestDhikrLogs(logs);
    const createdAt = latestByDhikr.get("d1")?.createdAt;
    expect(createdAt).toBe(tenDaysAgo.toISOString());

    const dayKey = resolveActivityDateKey({ lastActivityAt: createdAt }, today);
    expect(dayKey).not.toBe("2026-09-21");
    expect(dayKey).toBe("2026-09-11");
  });

  it("customDhikrId ayrı haritada indekslenir", () => {
    const logs = [log({ customDhikrId: "c1", count: 5 })];
    const { latestByCustomDhikr } = indexLatestDhikrLogs(logs);
    expect(latestByCustomDhikr.get("c1")?.count).toBe(5);
  });
});
