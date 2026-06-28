export type StatsSourceKey = "manual" | "ai" | "special-day" | "notification";

export type StatsDailyPoint = {
  /** YYYY-MM-DD */
  date: string;
  count: number;
  /** number of completed logs on that day */
  completed: number;
};

export type StatsHeatmapPoint = {
  /** YYYY-MM-DD */
  date: string;
  count: number;
};

export type StatsDistributionPoint = {
  /** weekday (1=Sunday..7=Saturday, Mongo $dayOfWeek) or hour (0-23) */
  key: number;
  count: number;
};

export type StatsSourceBreakdown = Record<StatsSourceKey, number>;

export type StatsTopDhikr = {
  /** stable identity: dhikr object id hex or custom dhikr id */
  key: string;
  label: string;
  totalCount: number;
  sessions: number;
};

export type StatsPeriodComparison = {
  current: number;
  previous: number;
  /** rounded percent change vs previous; 0 when previous is 0 */
  changePercent: number;
};

export type StatsBadge = {
  key: string;
  label: string;
  achieved: boolean;
  /** progress toward the badge, 0..1 */
  progress: number;
};

export type StatsTotals = {
  allTimeCount: number;
  totalSessions: number;
  totalDurationSeconds: number;
  completedCount: number;
  /** 0..100 */
  completionRate: number;
  favoriteCount: number;
  averagePerActiveDay: number;
};

export type StatsSummary = {
  totals: StatsTotals;
  periods: {
    today: number;
    thisWeek: number;
    thisMonth: number;
  };
  streak: {
    currentStreak: number;
    longestStreak: number;
    totalDaysActive: number;
  };
  /** ascending, last 30 days (free) */
  dailySeries: StatsDailyPoint[];
  // --- premium ---
  /** ascending, last 365 days */
  heatmap: StatsHeatmapPoint[];
  /** 7 entries, weekday 1..7 */
  weekdayDistribution: StatsDistributionPoint[];
  /** 24 entries, hour 0..23 */
  hourDistribution: StatsDistributionPoint[];
  sourceBreakdown: StatsSourceBreakdown;
  /** top 10 by total count */
  topDhikrs: StatsTopDhikr[];
  comparison: {
    week: StatsPeriodComparison;
    month: StatsPeriodComparison;
  };
  badges: StatsBadge[];
};
