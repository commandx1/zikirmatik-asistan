import { calculateStreakMetrics } from './streak-calculator';

describe('calculateStreakMetrics', () => {
  it('returns zeros for empty list', () => {
    expect(calculateStreakMetrics([])).toEqual({
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
    });
  });

  it('calculates current and longest streaks correctly', () => {
    const result = calculateStreakMetrics([
      '2026-05-01',
      '2026-05-02',
      '2026-05-05',
      '2026-05-06',
      '2026-05-07',
    ]);

    expect(result).toEqual({
      currentStreak: 3,
      longestStreak: 3,
      totalDaysActive: 5,
      lastActiveDate: '2026-05-07',
    });
  });
});
