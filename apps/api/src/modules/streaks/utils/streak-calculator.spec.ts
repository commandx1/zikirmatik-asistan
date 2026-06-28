import { calculateCompletionStreak } from './streak-calculator';

const TODAY = '2026-06-26';

describe('calculateCompletionStreak', () => {
  it('returns zeros for empty list', () => {
    expect(calculateCompletionStreak([], TODAY)).toEqual({
      currentStreak: 0,
      longestStreak: 0,
    });
  });

  it('counts the current streak when today is completed', () => {
    const result = calculateCompletionStreak(
      ['2026-06-24', '2026-06-25', '2026-06-26'],
      TODAY,
    );
    expect(result.currentStreak).toBe(3);
    expect(result.longestStreak).toBe(3);
  });

  it('keeps the streak when today is not yet done but yesterday is (grace)', () => {
    const result = calculateCompletionStreak(
      ['2026-06-24', '2026-06-25'],
      TODAY,
    );
    expect(result.currentStreak).toBe(2);
  });

  it('resets current streak to 0 when last completed day is older than yesterday', () => {
    const result = calculateCompletionStreak(
      ['2026-06-20', '2026-06-21', '2026-06-22'],
      TODAY,
    );
    expect(result.currentStreak).toBe(0);
    expect(result.longestStreak).toBe(3);
  });

  it('computes the longest run across gaps independent of current', () => {
    const result = calculateCompletionStreak(
      [
        '2026-05-01',
        '2026-05-02',
        '2026-05-03',
        '2026-05-04', // longest run of 4
        '2026-06-25',
        '2026-06-26', // current run of 2 (ends today)
      ],
      TODAY,
    );
    expect(result.longestStreak).toBe(4);
    expect(result.currentStreak).toBe(2);
  });

  it('ignores duplicate dates', () => {
    const result = calculateCompletionStreak(
      ['2026-06-26', '2026-06-26', '2026-06-25'],
      TODAY,
    );
    expect(result.currentStreak).toBe(2);
    expect(result.longestStreak).toBe(2);
  });
});
