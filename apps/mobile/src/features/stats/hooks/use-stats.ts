import { useCallback, useEffect, useState } from "react";
import type { StatsSummary, StatsTopDhikr } from "@zikirmatik/shared";
import { toDateKey } from "@zikirmatik/shared";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { calculateLocalCompletionStreak } from "../../home/services/local-streak";
import { getStatsSummary } from "../services/stats-api-client";
import type { ZikirItem } from "../../focus/types";

export type UseStatsResult = {
  data: StatsSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  isPremium: boolean;
  refresh: () => Promise<void>;
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "İstatistikler yüklenemedi.";
}

export function useStats(): UseStatsResult {
  const authStatus = useAuthStore((s) => s.status);
  const guestMode = useAuthStore((s) => s.guestMode);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const isPremium = useProfileStore((s) => s.isPremium);
  const dhikrItems = useDhikrStore((s) => s.items);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);

  const [data, setData] = useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const isGuest = guestMode && authStatus !== "authenticated";

  useEffect(() => {
    if (!isGuest) {
      return;
    }

    setData(buildLocalStatsSummary(dhikrItems, freeModeCount));
    setError(undefined);
    setIsLoading(false);
  }, [dhikrItems, freeModeCount, isGuest]);

  useEffect(() => {
    if (isGuest) {
      return;
    }

    if (authStatus !== "authenticated") {
      setData(null);
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(undefined);

    getStatsSummary(accessToken)
      .then((summary) => {
        if (!isCancelled) {
          setData(summary);
        }
      })
      .catch((cause) => {
        if (!isCancelled) {
          setError(toMessage(cause));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [accessToken, authStatus, isGuest]);

  const refresh = useCallback(async () => {
    if (isGuest) {
      setData(buildLocalStatsSummary(dhikrItems, freeModeCount));
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }
    setIsRefreshing(true);
    setError(undefined);
    try {
      const summary = await getStatsSummary(accessToken);
      setData(summary);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsRefreshing(false);
    }
  }, [accessToken, authStatus, dhikrItems, freeModeCount, isGuest]);

  return { data, isLoading, isRefreshing, error, isPremium, refresh };
}

function buildLocalStatsSummary(items: ZikirItem[], freeModeCount: number): StatsSummary {
  const today = new Date();
  const todayKey = toDateKey(today);
  const activityByDay = new Map<string, { count: number; completed: number }>();
  const topDhikrs = buildTopDhikrs(items);
  let allTimeCount = Math.max(0, Math.floor(freeModeCount));
  let completedCount = 0;
  let favoriteCount = 0;
  let totalSessions = freeModeCount > 0 ? 1 : 0;

  for (const item of items) {
    const safeCount = Math.max(0, Math.floor(item.current));
    allTimeCount += safeCount;
    if (safeCount > 0) {
      totalSessions += 1;
    }
    if (item.target > 0 && safeCount >= item.target) {
      completedCount += 1;
    }
    if (item.isFavorite) {
      favoriteCount += 1;
    }

    const dayKey = resolveActivityDateKey(item, today) ?? (safeCount > 0 ? todayKey : null);
    if (!dayKey) {
      continue;
    }

    const prev = activityByDay.get(dayKey) ?? { count: 0, completed: 0 };
    activityByDay.set(dayKey, {
      count: prev.count + safeCount,
      completed: prev.completed + (item.target > 0 && safeCount >= item.target ? 1 : 0)
    });
  }

  if (freeModeCount > 0) {
    const prev = activityByDay.get(todayKey) ?? { count: 0, completed: 0 };
    activityByDay.set(todayKey, { count: prev.count + freeModeCount, completed: prev.completed });
  }

  const activeDays = Array.from(activityByDay.keys()).sort();
  const streak = calculateLocalCompletionStreak(activeDays, today);
  const dailySeries = buildDailySeries(activityByDay, today, 30);
  const heatmap = buildHeatmap(activityByDay, today, 365);
  const weekdayDistribution = buildWeekdayDistribution(activityByDay);

  return {
    totals: {
      allTimeCount,
      totalSessions,
      totalDurationSeconds: 0,
      completedCount,
      completionRate: totalSessions > 0 ? Math.round((completedCount / totalSessions) * 100) : 0,
      favoriteCount,
      averagePerActiveDay:
        activeDays.length > 0 ? Math.round(allTimeCount / Math.max(1, activeDays.length)) : 0
    },
    periods: {
      today: activityByDay.get(todayKey)?.count ?? 0,
      thisWeek: sumCurrentPeriod(activityByDay, today, "week"),
      thisMonth: sumCurrentPeriod(activityByDay, today, "month")
    },
    streak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalDaysActive: activeDays.length
    },
    dailySeries,
    heatmap,
    weekdayDistribution,
    hourDistribution: Array.from({ length: 24 }, (_, key) => ({ key, count: 0 })),
    sourceBreakdown: {
      manual: allTimeCount,
      ai: 0,
      "special-day": 0,
      notification: 0
    },
    topDhikrs,
    comparison: {
      week: localPeriodComparison(activityByDay, today, "week"),
      month: localPeriodComparison(activityByDay, today, "month")
    },
    badges: buildLocalBadges(allTimeCount, streak.longestStreak, activeDays.length)
  };
}

function buildTopDhikrs(items: ZikirItem[]): StatsTopDhikr[] {
  return items
    .map((item) => ({
      key: item.id,
      label: item.nameTurkish || item.transliteration || "Zikir",
      totalCount: Math.max(0, Math.floor(item.current)),
      sessions: item.current > 0 ? 1 : 0
    }))
    .filter((item) => item.totalCount > 0)
    .sort((a, b) => b.totalCount - a.totalCount)
    .slice(0, 10);
}

function buildDailySeries(activityByDay: Map<string, { count: number; completed: number }>, today: Date, length: number) {
  const points: StatsSummary["dailySeries"] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = toDateKey(date);
    const day = activityByDay.get(key) ?? { count: 0, completed: 0 };
    points.push({ date: key, count: day.count, completed: day.completed });
  }
  return points;
}

function buildHeatmap(activityByDay: Map<string, { count: number; completed: number }>, today: Date, length: number) {
  const points: StatsSummary["heatmap"] = [];
  for (let offset = length - 1; offset >= 0; offset -= 1) {
    const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() - offset);
    const key = toDateKey(date);
    points.push({ date: key, count: activityByDay.get(key)?.count ?? 0 });
  }
  return points;
}

function buildWeekdayDistribution(activityByDay: Map<string, { count: number; completed: number }>) {
  const counts = new Map<number, number>();
  for (const [key, value] of activityByDay.entries()) {
    const parsed = parseDateKey(key);
    if (!parsed) {
      continue;
    }
    const weekday = parsed.getDay() + 1;
    counts.set(weekday, (counts.get(weekday) ?? 0) + value.count);
  }
  return Array.from({ length: 7 }, (_, index) => ({ key: index + 1, count: counts.get(index + 1) ?? 0 }));
}

function localPeriodComparison(activityByDay: Map<string, { count: number; completed: number }>, now: Date, period: "week" | "month") {
  const current = sumCurrentPeriod(activityByDay, now, period);
  const previous = sumPreviousPeriod(activityByDay, now, period);
  const changePercent = previous > 0 ? Math.round(((current - previous) / previous) * 100) : 0;
  return { current, previous, changePercent };
}

function sumCurrentPeriod(activityByDay: Map<string, { count: number; completed: number }>, now: Date, period: "week" | "month") {
  let total = 0;
  for (const [key, value] of activityByDay.entries()) {
    const parsed = parseDateKey(key);
    if (!parsed) {
      continue;
    }
    if (period === "week") {
      if (isSameWeek(now, parsed)) {
        total += value.count;
      }
      continue;
    }
    if (now.getFullYear() === parsed.getFullYear() && now.getMonth() === parsed.getMonth()) {
      total += value.count;
    }
  }
  return total;
}

function sumPreviousPeriod(activityByDay: Map<string, { count: number; completed: number }>, now: Date, period: "week" | "month") {
  let total = 0;
  for (const [key, value] of activityByDay.entries()) {
    const parsed = parseDateKey(key);
    if (!parsed) {
      continue;
    }
    if (period === "week") {
      if (isPreviousWeek(now, parsed)) {
        total += value.count;
      }
      continue;
    }
    if (isPreviousMonth(now, parsed)) {
      total += value.count;
    }
  }
  return total;
}

function buildLocalBadges(allTimeCount: number, longestStreak: number, totalDaysActive: number) {
  return [
    {
      key: "first-steps",
      label: "Ilk Adimlar",
      achieved: allTimeCount >= 33,
      progress: Math.max(0, Math.min(1, allTimeCount / 33))
    },
    {
      key: "steady-streak",
      label: "7 Gunluk Seri",
      achieved: longestStreak >= 7,
      progress: Math.max(0, Math.min(1, longestStreak / 7))
    },
    {
      key: "active-days",
      label: "30 Aktif Gun",
      achieved: totalDaysActive >= 30,
      progress: Math.max(0, Math.min(1, totalDaysActive / 30))
    }
  ];
}

function resolveActivityDateKey(item: ZikirItem, today: Date) {
  const label = item.lastActivityLabel?.trim();
  if (!label) {
    return null;
  }
  if (label.startsWith("Bugun")) {
    return toDateKey(today);
  }
  if (label.startsWith("Bugün")) {
    return toDateKey(today);
  }
  if (label.startsWith("Dun") || label.startsWith("Dün")) {
    const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
    return toDateKey(yesterday);
  }
  const match = /(\d{1,2})\.(\d{1,2})\.(\d{4})/.exec(label);
  if (!match) {
    return null;
  }
  const day = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const year = Number.parseInt(match[3], 10);
  return toDateKey(new Date(year, month - 1, day));
}

function parseDateKey(key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    return null;
  }
  return new Date(
    Number.parseInt(match[1], 10),
    Number.parseInt(match[2], 10) - 1,
    Number.parseInt(match[3], 10)
  );
}

function startOfWeek(date: Date) {
  const day = date.getDay();
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() - day);
}

function isSameWeek(reference: Date, target: Date) {
  const refStart = startOfWeek(reference);
  const targetStart = startOfWeek(target);
  return toDateKey(refStart) === toDateKey(targetStart);
}

function isPreviousWeek(reference: Date, target: Date) {
  const refStart = startOfWeek(reference);
  const prevStart = new Date(refStart.getFullYear(), refStart.getMonth(), refStart.getDate() - 7);
  const targetStart = startOfWeek(target);
  return toDateKey(prevStart) === toDateKey(targetStart);
}

function isPreviousMonth(reference: Date, target: Date) {
  const prevMonthDate = new Date(reference.getFullYear(), reference.getMonth() - 1, 1);
  return (
    target.getFullYear() === prevMonthDate.getFullYear() &&
    target.getMonth() === prevMonthDate.getMonth()
  );
}
