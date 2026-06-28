import {
  buildDateWindows,
  buildStatsSummary,
  computeBadges,
  istanbulDateKey,
  shiftDateKey,
  type StatsFacetResult,
  type StreakSnapshot,
} from './stats-aggregator';

describe('shiftDateKey', () => {
  it('shifts pure date keys across month boundaries', () => {
    expect(shiftDateKey('2026-03-01', -1)).toBe('2026-02-28');
    expect(shiftDateKey('2026-02-28', 1)).toBe('2026-03-01');
    expect(shiftDateKey('2026-06-26', 0)).toBe('2026-06-26');
  });
});

describe('istanbulDateKey', () => {
  it('formats an instant as the Istanbul calendar day', () => {
    // 2026-06-26T22:30:00Z is already 2026-06-27 01:30 in Istanbul (UTC+3)
    expect(istanbulDateKey(new Date('2026-06-26T22:30:00Z'))).toBe(
      '2026-06-27',
    );
  });
});

describe('buildDateWindows', () => {
  it('derives the rolling windows from today', () => {
    const windows = buildDateWindows(new Date('2026-06-26T09:00:00Z'));
    expect(windows.todayKey).toBe('2026-06-26');
    expect(windows.weekStartKey).toBe('2026-06-20');
    expect(windows.monthStartKey).toBe('2026-05-28');
    expect(windows.prevWeekStartKey).toBe('2026-06-13');
    expect(windows.prevWeekEndKey).toBe('2026-06-19');
    expect(windows.heatmapStartKey).toBe('2025-06-27');
  });
});

describe('computeBadges', () => {
  it('marks achieved badges and clamps progress', () => {
    const badges = computeBadges(12000, 8);
    const byKey = Object.fromEntries(badges.map((b) => [b.key, b]));
    expect(byKey['count-1k'].achieved).toBe(true);
    expect(byKey['count-1k'].progress).toBe(1);
    expect(byKey['count-10k'].achieved).toBe(true);
    expect(byKey['count-100k'].achieved).toBe(false);
    expect(byKey['count-100k'].progress).toBeCloseTo(0.12);
    expect(byKey['streak-7'].achieved).toBe(true);
    expect(byKey['streak-30'].achieved).toBe(false);
  });
});

describe('buildStatsSummary', () => {
  const windows = buildDateWindows(new Date('2026-06-26T09:00:00Z'));
  const streak: StreakSnapshot = {
    currentStreak: 4,
    longestStreak: 9,
    totalDaysActive: 20,
  };

  const facet: StatsFacetResult = {
    totals: [
      {
        allTimeCount: 1000,
        totalSessions: 50,
        totalDuration: 3600,
        completedCount: 30,
        favoriteCount: 5,
      },
    ],
    daily: [
      { _id: '2026-06-26', count: 100, completed: 2 }, // today
      { _id: '2026-06-22', count: 50, completed: 1 }, // this week
      { _id: '2026-06-15', count: 40, completed: 1 }, // prev week
      { _id: '2026-05-10', count: 10, completed: 0 }, // prev month window
    ],
    weekday: [{ _id: 6, count: 150 }],
    hourly: [{ _id: 9, count: 100 }],
    source: [
      { _id: 'manual', count: 40 },
      { _id: 'ai', count: 10 },
    ],
    topDhikrs: [
      {
        dhikrId: 'abc123',
        totalCount: 500,
        sessions: 20,
        dhikrName: 'Estağfirullah',
      },
      {
        customDhikrId: 'custom-1',
        customName: 'Salavat',
        totalCount: 200,
        sessions: 10,
      },
    ],
  };

  const summary = buildStatsSummary(facet, streak, windows);

  it('computes totals and derived rates', () => {
    expect(summary.totals.allTimeCount).toBe(1000);
    expect(summary.totals.completionRate).toBe(60); // 30/50
    expect(summary.totals.averagePerActiveDay).toBe(50); // 1000/20
    expect(summary.totals.totalDurationSeconds).toBe(3600);
    expect(summary.totals.favoriteCount).toBe(5);
  });

  it('computes period sums from the daily map', () => {
    expect(summary.periods.today).toBe(100);
    expect(summary.periods.thisWeek).toBe(150); // 100 + 50
    expect(summary.periods.thisMonth).toBe(190); // 100 + 50 + 40
  });

  it('computes period comparisons', () => {
    expect(summary.comparison.week.current).toBe(150);
    expect(summary.comparison.week.previous).toBe(40);
    expect(summary.comparison.week.changePercent).toBe(275); // (150-40)/40
  });

  it('normalizes distributions to fixed length', () => {
    expect(summary.weekdayDistribution).toHaveLength(7);
    expect(summary.hourDistribution).toHaveLength(24);
    expect(summary.weekdayDistribution.find((p) => p.key === 6)?.count).toBe(
      150,
    );
    expect(summary.hourDistribution.find((p) => p.key === 9)?.count).toBe(100);
  });

  it('fills daily series and heatmap to fixed windows', () => {
    expect(summary.dailySeries).toHaveLength(30);
    expect(summary.heatmap).toHaveLength(365);
    expect(summary.dailySeries[summary.dailySeries.length - 1]).toEqual({
      date: '2026-06-26',
      count: 100,
      completed: 2,
    });
  });

  it('normalizes source breakdown and maps top dhikrs', () => {
    expect(summary.sourceBreakdown).toEqual({
      manual: 40,
      ai: 10,
      'special-day': 0,
      notification: 0,
    });
    expect(summary.topDhikrs[0]).toEqual({
      key: 'abc123',
      label: 'Estağfirullah',
      totalCount: 500,
      sessions: 20,
    });
    expect(summary.topDhikrs[1].label).toBe('Salavat');
    expect(summary.topDhikrs[1].key).toBe('custom-1');
  });
});
