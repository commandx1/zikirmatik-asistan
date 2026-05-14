export type StreakMetrics = {
  currentStreak: number;
  longestStreak: number;
  lastActiveDate?: string;
  totalDaysActive: number;
};

export function calculateStreakMetrics(rawDates: string[]): StreakMetrics {
  const uniqueSorted = Array.from(new Set(rawDates)).sort();

  if (uniqueSorted.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      totalDaysActive: 0,
    };
  }

  let longest = 1;
  let rolling = 1;

  for (let i = 1; i < uniqueSorted.length; i += 1) {
    const prev = parseDate(uniqueSorted[i - 1]);
    const curr = parseDate(uniqueSorted[i]);

    if (!prev || !curr) {
      continue;
    }

    const diff = dayDiff(prev, curr);

    if (diff === 1) {
      rolling += 1;
    } else if (diff > 1) {
      rolling = 1;
    }

    if (rolling > longest) {
      longest = rolling;
    }
  }

  let current = 1;

  for (let i = uniqueSorted.length - 1; i > 0; i -= 1) {
    const prev = parseDate(uniqueSorted[i - 1]);
    const curr = parseDate(uniqueSorted[i]);

    if (!prev || !curr) {
      break;
    }

    const diff = dayDiff(prev, curr);

    if (diff === 1) {
      current += 1;
      continue;
    }

    break;
  }

  return {
    currentStreak: current,
    longestStreak: longest,
    totalDaysActive: uniqueSorted.length,
    lastActiveDate: uniqueSorted[uniqueSorted.length - 1],
  };
}

function parseDate(date: string) {
  const [year, month, day] = date
    .split('-')
    .map((value) => Number.parseInt(value, 10));
  if (!year || !month || !day) {
    return null;
  }

  return new Date(Date.UTC(year, month - 1, day));
}

function dayDiff(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / 86_400_000);
}
