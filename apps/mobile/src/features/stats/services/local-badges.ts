import { toDateKey } from "@zikirmatik/shared";
import type { StatsBadge } from "@zikirmatik/shared";
import { calculateLocalCompletionStreak, resolveActivityDateKey } from "../../home/services/local-streak";
import { i18n } from "../../../i18n";

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
  totalDaysActive: number;
};

type BadgeDefinition = {
  key: string;
  labelKey: string;
  metric: keyof LocalActivityStats;
  threshold: number;
};

// Single source of truth for the local (guest-mode / device-derived) badge
// set. Mirrors the count/streak badges the backend computes in
// stats-aggregator.ts (computeBadges) so guest and authenticated users see
// the same milestones. Kept intentionally small — the backend has a richer
// set once account-level history exists.
const BADGE_DEFINITIONS: BadgeDefinition[] = [
  { key: "first-steps", labelKey: "firstSteps", metric: "allTimeCount", threshold: 33 },
  { key: "steady-streak", labelKey: "steadyStreak", metric: "longestStreak", threshold: 7 },
  { key: "active-days", labelKey: "activeDays", metric: "totalDaysActive", threshold: 30 }
];

// Derives the same allTimeCount/longestStreak/totalDaysActive triad the
// stats screen shows, straight from dhikr-store state. Mirrors
// deriveStreakReminderStatus (streak-reminder-notifications.ts) and the
// guest branch of buildLocalStatsSummary (use-stats.ts) so all three agree
// on "active day" semantics.
export function deriveLocalActivityStats(
  items: ActivityItem[],
  freeModeCount: number,
  today: Date = new Date()
): LocalActivityStats {
  const todayKey = toDateKey(today);
  const activeDays = new Set<string>();
  let allTimeCount = Math.max(0, Math.floor(freeModeCount));

  for (const item of items) {
    const safeCount = Math.max(0, Math.floor(item.current));
    allTimeCount += safeCount;

    const dayKey = resolveActivityDateKey(item, today) ?? (safeCount > 0 ? todayKey : null);
    if (dayKey) {
      activeDays.add(dayKey);
    }
  }

  if (freeModeCount > 0) {
    activeDays.add(todayKey);
  }

  const { longestStreak } = calculateLocalCompletionStreak(Array.from(activeDays), today);

  return { allTimeCount, longestStreak, totalDaysActive: activeDays.size };
}

export function computeLocalBadges(stats: LocalActivityStats): StatsBadge[] {
  return BADGE_DEFINITIONS.map((definition) => {
    const value = stats[definition.metric];
    return {
      key: definition.key,
      label: i18n.t(`stats:badges.${definition.labelKey}`),
      achieved: value >= definition.threshold,
      progress: Math.max(0, Math.min(1, value / definition.threshold))
    };
  });
}
