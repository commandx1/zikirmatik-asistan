// NOTE: shapes mirror `StatsSummary` in packages/shared/src/types/stats.ts.
// The API does not depend on the shared workspace package; the shared type is
// the client-side contract and this response is structurally compatible.

export type StatsSourceKey = 'manual' | 'ai' | 'special-day' | 'notification';

export type StatsDailyPoint = { date: string; count: number; completed: number };
export type StatsHeatmapPoint = { date: string; count: number };
export type StatsDistributionPoint = { key: number; count: number };
export type StatsSourceBreakdown = Record<StatsSourceKey, number>;
export type StatsTopDhikr = {
  key: string;
  label: string;
  totalCount: number;
  sessions: number;
};
export type StatsPeriodComparison = {
  current: number;
  previous: number;
  changePercent: number;
};
export type StatsBadge = {
  key: string;
  label: string;
  achieved: boolean;
  progress: number;
};

export type StatsSummary = {
  totals: {
    allTimeCount: number;
    totalSessions: number;
    totalDurationSeconds: number;
    completedCount: number;
    completionRate: number;
    favoriteCount: number;
    averagePerActiveDay: number;
  };
  periods: { today: number; thisWeek: number; thisMonth: number };
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
  };
  dailySeries: StatsDailyPoint[];
  heatmap: StatsHeatmapPoint[];
  weekdayDistribution: StatsDistributionPoint[];
  hourDistribution: StatsDistributionPoint[];
  sourceBreakdown: StatsSourceBreakdown;
  topDhikrs: StatsTopDhikr[];
  comparison: { week: StatsPeriodComparison; month: StatsPeriodComparison };
  badges: StatsBadge[];
};

import {
  STATS_TIMEZONE,
  istanbulDateKey,
  shiftDateKey,
} from '../../../common/utils/date-keys';

// Re-exported so existing imports from this module keep working.
export { STATS_TIMEZONE, istanbulDateKey, shiftDateKey };

const DAILY_SERIES_DAYS = 30;
const HEATMAP_DAYS = 365;
const SOURCE_KEYS: StatsSourceKey[] = [
  'manual',
  'ai',
  'special-day',
  'notification',
];

export type StatsDateWindows = {
  todayKey: string;
  weekStartKey: string;
  monthStartKey: string;
  prevWeekStartKey: string;
  prevWeekEndKey: string;
  prevMonthStartKey: string;
  prevMonthEndKey: string;
  dailyStartKey: string;
  heatmapStartKey: string;
};

export function buildDateWindows(now: Date): StatsDateWindows {
  const todayKey = istanbulDateKey(now);
  return {
    todayKey,
    weekStartKey: shiftDateKey(todayKey, -6),
    monthStartKey: shiftDateKey(todayKey, -29),
    prevWeekStartKey: shiftDateKey(todayKey, -13),
    prevWeekEndKey: shiftDateKey(todayKey, -7),
    prevMonthStartKey: shiftDateKey(todayKey, -59),
    prevMonthEndKey: shiftDateKey(todayKey, -30),
    dailyStartKey: shiftDateKey(todayKey, -(DAILY_SERIES_DAYS - 1)),
    heatmapStartKey: shiftDateKey(todayKey, -(HEATMAP_DAYS - 1)),
  };
}

// --- Raw facet shapes (what stats.service passes from Mongo aggregation) ---

export type RawTotals = {
  allTimeCount?: number;
  totalSessions?: number;
  totalDuration?: number;
  completedCount?: number;
  favoriteCount?: number;
};

export type RawDailyDoc = { _id: string; count: number; completed: number };
export type RawKeyedDoc = { _id: number | null; count: number };
export type RawSourceDoc = { _id: StatsSourceKey | null; count: number };
export type RawTopDhikrDoc = {
  dhikrId?: unknown;
  customDhikrId?: string | null;
  customName?: string | null;
  dhikrName?: string | null;
  totalCount: number;
  sessions: number;
};

export type StatsFacetResult = {
  totals: RawTotals[];
  daily: RawDailyDoc[];
  weekday: RawKeyedDoc[];
  hourly: RawKeyedDoc[];
  source: RawSourceDoc[];
  topDhikrs: RawTopDhikrDoc[];
};

export type StreakSnapshot = {
  currentStreak: number;
  longestStreak: number;
  totalDaysActive: number;
};

function round(value: number): number {
  return Math.round(value);
}

function sumInRange(
  byDate: Map<string, number>,
  startKey: string,
  endKey: string,
): number {
  let total = 0;
  for (const [date, count] of byDate) {
    if (date >= startKey && date <= endKey) {
      total += count;
    }
  }
  return total;
}

function computeComparison(
  current: number,
  previous: number,
): StatsPeriodComparison {
  const changePercent =
    previous === 0 ? 0 : round(((current - previous) / previous) * 100);
  return { current, previous, changePercent };
}

function fillSeries(
  byDate: Map<string, RawDailyDoc>,
  startKey: string,
  days: number,
): StatsDailyPoint[] {
  const series: StatsDailyPoint[] = [];
  for (let i = 0; i < days; i += 1) {
    const date = shiftDateKey(startKey, i);
    const doc = byDate.get(date);
    series.push({
      date,
      count: doc?.count ?? 0,
      completed: doc?.completed ?? 0,
    });
  }
  return series;
}

function normalizeDistribution(
  docs: RawKeyedDoc[],
  keys: number[],
): StatsDistributionPoint[] {
  const byKey = new Map<number, number>();
  for (const doc of docs) {
    if (doc._id != null) {
      byKey.set(doc._id, doc.count);
    }
  }
  return keys.map((key) => ({ key, count: byKey.get(key) ?? 0 }));
}

function normalizeSource(docs: RawSourceDoc[]): StatsSourceBreakdown {
  const breakdown: StatsSourceBreakdown = {
    manual: 0,
    ai: 0,
    'special-day': 0,
    notification: 0,
  };
  for (const doc of docs) {
    if (doc._id && SOURCE_KEYS.includes(doc._id)) {
      breakdown[doc._id] = doc.count;
    }
  }
  return breakdown;
}

function mapTopDhikrs(docs: RawTopDhikrDoc[]): StatsTopDhikr[] {
  return docs.map((doc) => {
    const key =
      (doc.dhikrId != null ? String(doc.dhikrId) : undefined) ??
      (doc.customDhikrId ? String(doc.customDhikrId) : undefined) ??
      'unknown';
    const label =
      doc.dhikrName?.trim() || doc.customName?.trim() || 'Zikir';
    return {
      key,
      label,
      totalCount: doc.totalCount ?? 0,
      sessions: doc.sessions ?? 0,
    };
  });
}

const COUNT_BADGES: { key: string; label: string; threshold: number }[] = [
  { key: 'count-1k', label: 'İlk 1.000 zikir', threshold: 1000 },
  { key: 'count-10k', label: '10.000 zikir', threshold: 10000 },
  { key: 'count-100k', label: '100.000 zikir', threshold: 100000 },
];

const STREAK_BADGES: { key: string; label: string; threshold: number }[] = [
  { key: 'streak-7', label: '7 günlük seri', threshold: 7 },
  { key: 'streak-30', label: '30 günlük seri', threshold: 30 },
  { key: 'streak-100', label: '100 günlük seri', threshold: 100 },
];

export function computeBadges(
  allTimeCount: number,
  longestStreak: number,
): StatsBadge[] {
  const countBadges = COUNT_BADGES.map((badge) => ({
    key: badge.key,
    label: badge.label,
    achieved: allTimeCount >= badge.threshold,
    progress: Math.min(1, allTimeCount / badge.threshold),
  }));
  const streakBadges = STREAK_BADGES.map((badge) => ({
    key: badge.key,
    label: badge.label,
    achieved: longestStreak >= badge.threshold,
    progress: Math.min(1, longestStreak / badge.threshold),
  }));
  return [...countBadges, ...streakBadges];
}

export function buildStatsSummary(
  facet: StatsFacetResult,
  streak: StreakSnapshot,
  windows: StatsDateWindows,
): StatsSummary {
  const rawTotals = facet.totals[0] ?? {};
  const allTimeCount = rawTotals.allTimeCount ?? 0;
  const totalSessions = rawTotals.totalSessions ?? 0;
  const completedCount = rawTotals.completedCount ?? 0;
  const completionRate =
    totalSessions === 0 ? 0 : round((completedCount / totalSessions) * 100);
  const averagePerActiveDay =
    streak.totalDaysActive === 0
      ? 0
      : round(allTimeCount / streak.totalDaysActive);

  const dailyDocByDate = new Map<string, RawDailyDoc>();
  const countByDate = new Map<string, number>();
  for (const doc of facet.daily) {
    dailyDocByDate.set(doc._id, doc);
    countByDate.set(doc._id, doc.count);
  }

  const today = countByDate.get(windows.todayKey) ?? 0;
  const thisWeek = sumInRange(
    countByDate,
    windows.weekStartKey,
    windows.todayKey,
  );
  const thisMonth = sumInRange(
    countByDate,
    windows.monthStartKey,
    windows.todayKey,
  );
  const prevWeek = sumInRange(
    countByDate,
    windows.prevWeekStartKey,
    windows.prevWeekEndKey,
  );
  const prevMonth = sumInRange(
    countByDate,
    windows.prevMonthStartKey,
    windows.prevMonthEndKey,
  );

  const dailySeries = fillSeries(
    dailyDocByDate,
    windows.dailyStartKey,
    DAILY_SERIES_DAYS,
  );
  const heatmap: StatsHeatmapPoint[] = fillSeries(
    dailyDocByDate,
    windows.heatmapStartKey,
    HEATMAP_DAYS,
  ).map((point) => ({ date: point.date, count: point.count }));

  return {
    totals: {
      allTimeCount,
      totalSessions,
      totalDurationSeconds: rawTotals.totalDuration ?? 0,
      completedCount,
      completionRate,
      favoriteCount: rawTotals.favoriteCount ?? 0,
      averagePerActiveDay,
    },
    periods: { today, thisWeek, thisMonth },
    streak: {
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalDaysActive: streak.totalDaysActive,
    },
    dailySeries,
    heatmap,
    weekdayDistribution: normalizeDistribution(
      facet.weekday,
      [1, 2, 3, 4, 5, 6, 7],
    ),
    hourDistribution: normalizeDistribution(
      facet.hourly,
      Array.from({ length: 24 }, (_, hour) => hour),
    ),
    sourceBreakdown: normalizeSource(facet.source),
    topDhikrs: mapTopDhikrs(facet.topDhikrs),
    comparison: {
      week: computeComparison(thisWeek, prevWeek),
      month: computeComparison(thisMonth, prevMonth),
    },
    badges: computeBadges(allTimeCount, streak.longestStreak),
  };
}
