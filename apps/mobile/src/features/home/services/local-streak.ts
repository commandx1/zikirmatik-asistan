import { toDateKey } from "@zikirmatik/shared";

// Resolves a dhikr item's "active day" to a YYYY-MM-DD date key. Shared by
// the local stats summary, local badges, and the streak reminder scheduler
// so all three agree on "active day" semantics.
//
// Primary source of truth is the locale-independent `lastActivityAt` ISO
// timestamp. Falls back to string-matching the (legacy, Turkish-only)
// `lastActivityLabel` prefixes ("Bugün"/"Dün"/"d.m.yyyy") only for items
// persisted before `lastActivityAt` existed — the zustand persist store has
// no migration step, so old items simply lack the field and must degrade
// gracefully here rather than break.
export function resolveActivityDateKey(
  item: { lastActivityLabel?: string; lastActivityAt?: string },
  today: Date
): string | null {
  if (item.lastActivityAt) {
    const parsed = new Date(item.lastActivityAt);
    if (!Number.isNaN(parsed.getTime())) {
      return toDateKey(new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate()));
    }
  }

  const label = item.lastActivityLabel?.trim();
  if (!label) {
    return null;
  }
  if (label.startsWith("Bugun") || label.startsWith("Bugün")) {
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
