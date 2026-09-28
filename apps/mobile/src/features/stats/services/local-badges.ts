import { computeBadges, toDateKey } from "@zikirmatik/shared";
import type { StatsBadge } from "@zikirmatik/shared";
import { calculateLocalCompletionStreak, resolveActivityDateKey } from "../../home/services/local-streak";

// Same shape as the dhikr-store items consumed by streak-reminder-notifications.ts
// (see deriveStreakReminderStatus) — kept minimal so this module has no
// dependency on the full ZikirItem type.
export type ActivityItem = {
  current: number;
  lastActivityLabel?: string;
  lastActivityAt?: string;
};

export type LocalActivityStats = {
  allTimeCount: number;
  longestStreak: number;
  currentStreak: number;
  totalDaysActive: number;
};

export type LocalActivitySource = {
  items: ActivityItem[];
  freeModeCount: number;
  freeModeActivityAt?: string;
  /** dhikr-store.activeDayKeys — the persisted per-day history. */
  activeDayKeys?: readonly string[];
};

// Active days are the persisted day history (activeDayKeys) plus each
// item's / free mode's last activity day — the latter keeps legacy
// label-only items and pre-history data counted. Shared by
// deriveLocalActivityStats and deriveStreakReminderStatus
// (streak-reminder-notifications.ts) so both agree on "active day".
export function resolveActiveDays(
  { items, freeModeCount, freeModeActivityAt, activeDayKeys = [] }: LocalActivitySource,
  today: Date = new Date()
): Set<string> {
  const todayKey = toDateKey(today);
  const activeDays = new Set<string>(activeDayKeys);

  for (const item of items) {
    const safeCount = Math.max(0, Math.floor(item.current));
    const dayKey = resolveActivityDateKey(item, today) ?? (safeCount > 0 ? todayKey : null);
    if (dayKey) {
      activeDays.add(dayKey);
    }
  }

  if (freeModeCount > 0) {
    // No stamp (old persist) → today, same fallback as stats-aggregation.
    activeDays.add(
      (freeModeActivityAt && resolveActivityDateKey({ lastActivityAt: freeModeActivityAt }, today)) || todayKey
    );
  }

  return activeDays;
}

// Derives the same allTimeCount/longestStreak/totalDaysActive triad the
// stats screen shows, straight from dhikr-store state. Mirrors
// buildLocalStatsSummary (stats-aggregation.ts).
export function deriveLocalActivityStats(
  source: LocalActivitySource,
  today: Date = new Date()
): LocalActivityStats {
  const activeDays = resolveActiveDays(source, today);
  let allTimeCount = Math.max(0, Math.floor(source.freeModeCount));

  for (const item of source.items) {
    allTimeCount += Math.max(0, Math.floor(item.current));
  }

  const { currentStreak, longestStreak } = calculateLocalCompletionStreak(Array.from(activeDays), today);

  return { allTimeCount, currentStreak, longestStreak, totalDaysActive: activeDays.size };
}

export type ServerStreak = Pick<LocalActivityStats, "currentStreak" | "longestStreak" | "totalDaysActive">;

// Signed-in users: the server streak (GET /v1/streaks) is the record — it
// sees every device and every saved log — so it replaces the device-local
// day math whenever it has been fetched. allTimeCount stays local.
export function withServerStreak(local: LocalActivityStats, server: ServerStreak | null | undefined): LocalActivityStats {
  if (!server) {
    return local;
  }
  return {
    ...local,
    currentStreak: server.currentStreak,
    longestStreak: server.longestStreak,
    totalDaysActive: server.totalDaysActive
  };
}

// Guests' badges: the shared list (packages/shared BADGE_DEFINITIONS), fed
// with the device's lifetime tap count and local longest streak. Vird streaks
// only exist server-side, so a guest's vird badges stay at 0. Members use the
// server's badges instead (see use-badge-celebration / use-stats).
export function computeLocalBadges(input: { lifetimeCount: number; longestStreak: number }): StatsBadge[] {
  return computeBadges({ lifetimeCount: input.lifetimeCount, longestStreak: input.longestStreak, virdLongestStreak: 0 });
}
