import { describe, expect, it, vi } from "vitest";
import { toDateKey } from "@zikirmatik/shared";
import type { ZikirItem } from "../../focus/types";
import { deriveLocalActivityStats, resolveHeaderStreak } from "./local-badges";

vi.mock("../../../i18n", () => ({
  i18n: { t: (key: string) => key },
  getAppLocale: () => "tr" as const
}));

const { buildLocalStatsSummary } = await import("./stats-aggregation");

// M-21: a day counts for the streak when at least one dhikr was counted that
// day (count > 0) — for guests (local) exactly like members (server).
const today = new Date(2026, 9, 7, 12);
const dayAt = (daysAgo: number) => new Date(2026, 9, 7 - daysAgo, 20).toISOString();
const resetOnly: Pick<ZikirItem, "current" | "lastActivityAt" | "lastActivityLabel"> = {
  current: 0,
  lastActivityAt: dayAt(0),
  lastActivityLabel: "Bugün"
};

describe("guest local streak (M-21)", () => {
  it("MOB-SER-08: tapped days (activeDayKeys) count without any target completion", () => {
    const keys = [toDateKey(new Date(2026, 9, 5)), toDateKey(new Date(2026, 9, 6)), toDateKey(today)];
    const stats = deriveLocalActivityStats({ items: [], freeModeCount: 0, activeDayKeys: keys }, today);
    expect(stats.currentStreak).toBe(3);
  });

  it("a day whose only trace is a reset (count 0, fresh stamp) does not count", () => {
    const stats = deriveLocalActivityStats({ items: [resetOnly], freeModeCount: 0 }, today);
    expect(stats.currentStreak).toBe(0);
    expect(stats.totalDaysActive).toBe(0);
  });

  it("the same holds for the stats screen summary", () => {
    const item = { id: "a", source: "personal", name: "A", transliteration: "A", target: 33, streakDays: 0, isFavorite: false, ...resetOnly, lastActivityAt: new Date().toISOString() } as ZikirItem;
    const summary = buildLocalStatsSummary([item], 0, true);
    expect(summary.streak.currentStreak).toBe(0);
  });

  it("MOB-SER-05: a two-day gap resets the guest streak to 0", () => {
    const keys = [toDateKey(new Date(2026, 9, 3)), toDateKey(new Date(2026, 9, 4))];
    const stats = deriveLocalActivityStats({ items: [], freeModeCount: 0, activeDayKeys: keys }, today);
    expect(resolveHeaderStreak(false, null, stats)).toBe(0);
  });

  it("MOB-SER-04: counted yesterday but not today keeps the streak (counted from yesterday)", () => {
    const keys = [toDateKey(new Date(2026, 9, 5)), toDateKey(new Date(2026, 9, 6))];
    const stats = deriveLocalActivityStats({ items: [], freeModeCount: 0, activeDayKeys: keys }, today);
    expect(resolveHeaderStreak(false, null, stats)).toBe(2);
  });

  it("members see the server streak, never the local guess (MOB-SER-02)", () => {
    const stats = deriveLocalActivityStats({ items: [], freeModeCount: 0, activeDayKeys: [toDateKey(today)] }, today);
    expect(resolveHeaderStreak(true, null, stats)).toBe(0);
    expect(resolveHeaderStreak(true, { currentStreak: 4, longestStreak: 4, totalDaysActive: 4 }, stats)).toBe(4);
  });
});
