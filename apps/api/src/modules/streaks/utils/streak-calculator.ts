import { shiftDateKey } from '../../../common/utils/date-keys';

export type CompletionStreak = {
  currentStreak: number;
  longestStreak: number;
};

/**
 * Completion-based streak.
 *
 * @param completedDates  YYYY-MM-DD keys of days that had at least one completed
 *                        dhikr log (order/duplicates irrelevant).
 * @param todayKey        today's YYYY-MM-DD key (in the app timezone).
 *
 * - `longestStreak`: the longest run of consecutive completed days.
 * - `currentStreak`: consecutive completed days anchored to today, or to
 *   yesterday if today is not yet completed (grace period); otherwise 0.
 */
export function calculateCompletionStreak(
  completedDates: string[],
  todayKey: string,
): CompletionStreak {
  const completed = new Set(completedDates);
  if (completed.size === 0) {
    return { currentStreak: 0, longestStreak: 0 };
  }

  const sorted = Array.from(completed).sort();

  let longest = 1;
  let rolling = 1;
  for (let i = 1; i < sorted.length; i += 1) {
    if (shiftDateKey(sorted[i - 1], 1) === sorted[i]) {
      rolling += 1;
    } else {
      rolling = 1;
    }
    if (rolling > longest) {
      longest = rolling;
    }
  }

  let anchor: string | null = null;
  if (completed.has(todayKey)) {
    anchor = todayKey;
  } else if (completed.has(shiftDateKey(todayKey, -1))) {
    anchor = shiftDateKey(todayKey, -1);
  }

  let current = 0;
  if (anchor) {
    let cursor = anchor;
    while (completed.has(cursor)) {
      current += 1;
      cursor = shiftDateKey(cursor, -1);
    }
  }

  return { currentStreak: current, longestStreak: longest };
}
