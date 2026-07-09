import { toDateKey } from "@zikirmatik/shared";

export type LocalCompletionStreak = {
  currentStreak: number;
  longestStreak: number;
};

export function calculateLocalCompletionStreak(
  completedDates: string[],
  today: Date = new Date()
): LocalCompletionStreak {
  const todayKey = toDateKey(today);
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

function shiftDateKey(key: string, days: number) {
  const parsed = parseDateKey(key);
  if (!parsed) {
    return key;
  }

  const shifted = new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate() + days);
  return toDateKey(shifted);
}

function parseDateKey(key: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  return new Date(year, month - 1, day);
}
