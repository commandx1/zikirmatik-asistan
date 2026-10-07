import { describe, expect, it, vi } from "vitest";
import { toDateKey } from "@zikirmatik/shared";
import type { ZikirItem } from "../../focus/types";

// Avoids pulling in the real i18n bootstrap (react-i18next/expo-localization
// init) for this pure-function test — only `i18n.t` and `getAppLocale` are
// used by stats-aggregation.ts, and neither needs the real i18next instance.
vi.mock("../../../i18n", () => ({
  i18n: { t: (key: string) => key },
  getAppLocale: () => "tr" as const
}));

const { buildLocalStatsSummary } = await import("./stats-aggregation");

function daysAgo(days: number): string {
  const now = new Date();
  const date = new Date(now.getFullYear(), now.getMonth(), now.getDate() - days, 12, 0, 0);
  return date.toISOString();
}

function makeItem(overrides: Partial<ZikirItem>): ZikirItem {
  return {
    id: "id",
    source: "personal",
    name: "name",
    transliteration: "transliteration",
    current: 0,
    target: 0,
    lastActivityLabel: "",
    streakDays: 0,
    isFavorite: false,
    ...overrides
  };
}

describe("buildLocalStatsSummary", () => {
  // 3 items across 2 active days (today + yesterday); item2 completed, item3 has no target.
  const items: ZikirItem[] = [
    makeItem({ id: "item1", name: "Item1", current: 5, target: 10, lastActivityAt: daysAgo(0) }),
    makeItem({ id: "item2", name: "Item2", current: 10, target: 10, isFavorite: true, lastActivityAt: daysAgo(0) }),
    makeItem({ id: "item3", name: "Item3", current: 3, target: 0, lastActivityAt: daysAgo(1) })
  ];

  const summary = buildLocalStatsSummary(items, 0, true);

  it("computes correct totals", () => {
    expect(summary.totals.allTimeCount).toBe(18); // 5 + 10 + 3
    expect(summary.totals.totalSessions).toBe(3); // all 3 items have current > 0
    expect(summary.totals.completedCount).toBe(1); // only item2 reaches its target
    expect(summary.totals.completionRate).toBe(33); // round(1/3 * 100)
    expect(summary.totals.favoriteCount).toBe(1); // only item2
    expect(summary.totals.averagePerActiveDay).toBe(9); // round(18 / 2 active days)
  });

  it("yerel özet kaynak dağılımı 'circle' anahtarını da taşır (A-14)", () => {
    expect(Object.keys(summary.sourceBreakdown).sort()).toEqual(["ai", "circle", "manual", "notification", "special-day"]);
    expect(summary.sourceBreakdown.circle).toBe(0);
  });

  it("groups activity by day and reports today's total", () => {
    expect(summary.periods.today).toBe(15); // item1 (5) + item2 (10), both dated today
    expect(summary.streak.totalDaysActive).toBe(2); // today + yesterday
  });

  it("builds a 30-point daily series and a 365-point heatmap ending today", () => {
    expect(summary.dailySeries).toHaveLength(30);
    expect(summary.dailySeries.at(-1)?.date).toBe(toDateKey(new Date()));
    expect(summary.dailySeries.at(-1)?.count).toBe(15);

    expect(summary.heatmap).toHaveLength(365);
    expect(summary.heatmap.at(-1)?.date).toBe(toDateKey(new Date()));
  });

  it("ranks topDhikrs by totalCount, descending", () => {
    expect(summary.topDhikrs.map((d) => d.key)).toEqual(["item2", "item1", "item3"]);
    expect(summary.topDhikrs.map((d) => d.totalCount)).toEqual([10, 5, 3]);
  });

  it("locks the summary when not premium, unlocked otherwise", () => {
    expect(summary.locked).toBe(false);
    expect(buildLocalStatsSummary(items, 0, false).locked).toBe(true);
  });

  it("folds freeModeCount into today's activity when there is no activity stamp", () => {
    const withFreeMode = buildLocalStatsSummary(items, 7, true);
    expect(withFreeMode.totals.allTimeCount).toBe(25); // 18 + 7
    expect(withFreeMode.periods.today).toBe(22); // 15 + 7
  });
});

describe("buildLocalStatsSummary with the persisted day history", () => {
  it("counts a daily streak of the same dhikr from activeDayKeys", () => {
    const history = Array.from({ length: 7 }, (_, i) => toDateKey(new Date(daysAgo(6 - i))));
    const summary = buildLocalStatsSummary(
      [makeItem({ id: "item1", current: 33, lastActivityAt: daysAgo(0) })],
      0,
      false,
      undefined,
      history
    );

    expect(summary.streak.currentStreak).toBe(7);
    expect(summary.streak.longestStreak).toBe(7);
    expect(summary.streak.totalDaysActive).toBe(7);
  });
});

describe("buildLocalStatsSummary allTimeCount after a counter reset", () => {
  it("falls back to lifetimeCount when the current counters were reset below it", () => {
    const items = [makeItem({ id: "item1", current: 50, lastActivityAt: daysAgo(0) })];
    const summary = buildLocalStatsSummary(items, 0, false, undefined, [], 120);

    expect(summary.totals.allTimeCount).toBe(120);
    expect(summary.badges.find((b) => b.key === "count-100")?.achieved).toBe(true);
  });
});

describe("buildLocalStatsSummary badges (guest)", () => {
  it("uses lifetimeCount (not current counters) and equals the celebration hook's local badges", async () => {
    const { computeLocalBadges, deriveLocalActivityStats } = await import("./local-badges");
    const history = Array.from({ length: 7 }, (_, i) => toDateKey(new Date(daysAgo(6 - i))));
    const items = [makeItem({ id: "item1", current: 3, lastActivityAt: daysAgo(0) })];
    const summary = buildLocalStatsSummary(items, 2, false, undefined, history, 150);

    expect(summary.badges.filter((b) => b.achieved).map((b) => b.key)).toEqual(["count-100", "streak-7"]);
    // Same inputs the root hook uses (use-badge-celebration.ts).
    const { longestStreak } = deriveLocalActivityStats({ items, freeModeCount: 2, activeDayKeys: history });
    expect(summary.badges).toEqual(computeLocalBadges({ lifetimeCount: 150, longestStreak }));
  });
});
