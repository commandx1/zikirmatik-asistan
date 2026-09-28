import type { StatsBadge } from "../types/stats";

// Single badge list for the whole product (quiet habit support: few,
// meaningful milestones). The API mirrors this in stats-aggregator.ts (it
// cannot import this package at runtime) and a parity spec there keeps the
// two identical. `label` is the Turkish label the API sends; the mobile app
// shows the i18n label for `key` instead.
export const BADGE_DEFINITIONS = [
  { key: "count-100", metric: "count", threshold: 100, order: 1, label: "İlk 100 zikir" },
  { key: "count-1k", metric: "count", threshold: 1000, order: 2, label: "İlk 1.000 zikir" },
  { key: "count-10k", metric: "count", threshold: 10000, order: 3, label: "10.000 zikir" },
  { key: "count-100k", metric: "count", threshold: 100000, order: 4, label: "100.000 zikir" },
  { key: "streak-7", metric: "streak", threshold: 7, order: 5, label: "7 günlük seri" },
  { key: "streak-30", metric: "streak", threshold: 30, order: 6, label: "30 günlük seri" },
  { key: "streak-100", metric: "streak", threshold: 100, order: 7, label: "100 günlük seri" },
  { key: "vird-7", metric: "virdStreak", threshold: 7, order: 8, label: "7 günlük vird serisi" },
  { key: "vird-30", metric: "virdStreak", threshold: 30, order: 9, label: "30 günlük vird serisi" },
  { key: "vird-100", metric: "virdStreak", threshold: 100, order: 10, label: "100 günlük vird serisi" }
] as const;

export type BadgeKey = (typeof BADGE_DEFINITIONS)[number]["key"];
export type BadgeMetric = (typeof BADGE_DEFINITIONS)[number]["metric"];

export type BadgeInputs = {
  lifetimeCount: number;
  longestStreak: number;
  virdLongestStreak: number;
};

const METRIC_INPUT: Record<BadgeMetric, keyof BadgeInputs> = {
  count: "lifetimeCount",
  streak: "longestStreak",
  virdStreak: "virdLongestStreak"
};

/** Badges in `order`, achieved/progress (clamped 0..1) from the three lifetime metrics. */
export function computeBadges(inputs: BadgeInputs): StatsBadge[] {
  return [...BADGE_DEFINITIONS]
    .sort((a, b) => a.order - b.order)
    .map((definition) => {
      const value = Math.max(0, inputs[METRIC_INPUT[definition.metric]] || 0);
      return {
        key: definition.key,
        label: definition.label,
        achieved: value >= definition.threshold,
        progress: Math.min(1, value / definition.threshold)
      };
    });
}

/** Position of a badge key in the shared order; unknown keys sort last. */
export function badgeOrder(key: string): number {
  return BADGE_DEFINITIONS.find((definition) => definition.key === key)?.order ?? Number.MAX_SAFE_INTEGER;
}
