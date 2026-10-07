// NOTE: shapes mirror `StatsSummary` in packages/shared/src/types/stats.ts.
// The API does not depend on the shared workspace package; the shared type is
// the client-side contract and this response is structurally compatible.

export type StatsSourceKey =
  | 'manual'
  | 'ai'
  | 'special-day'
  | 'notification'
  | 'circle';

export type StatsDailyPoint = {
  date: string;
  count: number;
  completed: number;
};
export type StatsHeatmapPoint = { date: string; count: number };
export type StatsDistributionPoint = { key: number; count: number };
export type StatsSourceBreakdown = Record<StatsSourceKey, number>;
export type StatsTopDhikr = {
  key: string;
  label: string;
  /** A-21: katalog zikri için iki dilli ad (en yoksa tr); özel zikirde yok. */
  nameI18n?: { tr: string; en: string };
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
    virdCurrentStreak: number;
    virdLongestStreak: number;
  };
  dailySeries: StatsDailyPoint[];
  // true when the requesting user is not premium — the premium-only fields
  // below are then emptied/zeroed server-side (never sent to free users).
  locked: boolean;
  // --- premium ---
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
  todayKey as requestTodayKey,
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
  'circle',
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
  const todayKey = requestTodayKey(now);
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
  dhikrId?: { toString(): string } | null;
  customDhikrId?: string | null;
  customName?: string | null;
  dhikrName?: string | null;
  dhikrNameEn?: string | null;
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
  // Vird Programı serisi — opsiyonel: çağıran taraf (StatsService) her zaman
  // geçirir, ancak eski çağrı yerleri/testler için geriye uyumluluk amacıyla
  // opsiyonel bırakılmıştır (yoksa 0 kabul edilir).
  virdCurrentStreak?: number;
  virdLongestStreak?: number;
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
    circle: 0,
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
    const label = doc.dhikrName?.trim() || doc.customName?.trim() || 'Zikir';
    const tr = doc.dhikrName?.trim();
    return {
      key,
      label,
      ...(tr ? { nameI18n: { tr, en: doc.dhikrNameEn?.trim() || tr } } : {}),
      totalCount: doc.totalCount ?? 0,
      sessions: doc.sessions ?? 0,
    };
  });
}

// Mirror of BADGE_DEFINITIONS in packages/shared/src/utils/badges.ts — the
// API cannot import the shared workspace package at runtime (see NOTE at the
// top). stats-aggregator.spec.ts asserts both lists stay identical; change
// them together.
export const BADGE_DEFINITIONS: {
  key: string;
  metric: 'count' | 'streak' | 'virdStreak';
  threshold: number;
  order: number;
  label: string;
}[] = [
  {
    key: 'count-100',
    metric: 'count',
    threshold: 100,
    order: 1,
    label: 'İlk 100 zikir',
  },
  {
    key: 'count-1k',
    metric: 'count',
    threshold: 1000,
    order: 2,
    label: 'İlk 1.000 zikir',
  },
  {
    key: 'count-10k',
    metric: 'count',
    threshold: 10000,
    order: 3,
    label: '10.000 zikir',
  },
  {
    key: 'count-100k',
    metric: 'count',
    threshold: 100000,
    order: 4,
    label: '100.000 zikir',
  },
  {
    key: 'streak-7',
    metric: 'streak',
    threshold: 7,
    order: 5,
    label: '7 günlük seri',
  },
  {
    key: 'streak-30',
    metric: 'streak',
    threshold: 30,
    order: 6,
    label: '30 günlük seri',
  },
  {
    key: 'streak-100',
    metric: 'streak',
    threshold: 100,
    order: 7,
    label: '100 günlük seri',
  },
  {
    key: 'vird-7',
    metric: 'virdStreak',
    threshold: 7,
    order: 8,
    label: '7 günlük vird serisi',
  },
  {
    key: 'vird-30',
    metric: 'virdStreak',
    threshold: 30,
    order: 9,
    label: '30 günlük vird serisi',
  },
  {
    key: 'vird-100',
    metric: 'virdStreak',
    threshold: 100,
    order: 10,
    label: '100 günlük vird serisi',
  },
];

export function computeBadges(
  allTimeCount: number,
  longestStreak: number,
  virdLongestStreak = 0,
): StatsBadge[] {
  const values = {
    count: allTimeCount,
    streak: longestStreak,
    virdStreak: virdLongestStreak,
  };
  return [...BADGE_DEFINITIONS]
    .sort((a, b) => a.order - b.order)
    .map((badge) => {
      const value = Math.max(0, values[badge.metric] || 0);
      return {
        key: badge.key,
        label: badge.label,
        achieved: value >= badge.threshold,
        progress: Math.min(1, value / badge.threshold),
      };
    });
}

const EMPTY_SOURCE_BREAKDOWN: StatsSourceBreakdown = {
  manual: 0,
  ai: 0,
  'special-day': 0,
  notification: 0,
  circle: 0,
};

const EMPTY_COMPARISON: StatsPeriodComparison = {
  current: 0,
  previous: 0,
  changePercent: 0,
};

/**
 * Ücretsiz kullanıcılar için premium'a özel detay bölümlerini boşaltır.
 * Özet kartları, periyotlar, seri (streak), günlük 30 günlük seri ve
 * rozetler serbest kaldığı için değişmeden kalır.
 */
function lockPremiumSections(summary: StatsSummary): StatsSummary {
  return {
    ...summary,
    locked: true,
    heatmap: [],
    weekdayDistribution: [],
    hourDistribution: [],
    sourceBreakdown: { ...EMPTY_SOURCE_BREAKDOWN },
    topDhikrs: [],
    comparison: {
      week: { ...EMPTY_COMPARISON },
      month: { ...EMPTY_COMPARISON },
    },
  };
}

export function buildStatsSummary(
  facet: StatsFacetResult,
  streak: StreakSnapshot,
  windows: StatsDateWindows,
  isPremium: boolean,
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

  const summary: StatsSummary = {
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
      virdCurrentStreak: streak.virdCurrentStreak ?? 0,
      virdLongestStreak: streak.virdLongestStreak ?? 0,
    },
    dailySeries,
    locked: !isPremium,
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
    badges: computeBadges(
      allTimeCount,
      streak.longestStreak,
      streak.virdLongestStreak ?? 0,
    ),
  };

  return isPremium ? summary : lockPremiumSections(summary);
}
