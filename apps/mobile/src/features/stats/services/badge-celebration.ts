import type { StatsBadge } from "@zikirmatik/shared";

// Pure selection logic, kept separate from the hook so it's trivially
// unit-testable without mounting React or a persisted store.
// Idempotent by construction: given the same badges + celebratedKeys, it
// always returns the same (possibly empty) set of "newly achieved" badges.
export function selectNewlyAchievedBadges(
  badges: StatsBadge[],
  celebratedBadgeKeys: readonly string[]
): StatsBadge[] {
  const celebrated = new Set(celebratedBadgeKeys);
  return badges.filter((badge) => badge.achieved && !celebrated.has(badge.key));
}

export type BadgeCelebrationEvaluation =
  // Data isn't trustworthy yet (celebration store still rehydrating, or —
  // for authenticated sessions — dhikr counts haven't come back from the
  // backend). Do nothing this pass.
  | { action: "wait" }
  // First evaluation ever against a fresh celebration store (new install, or
  // a device where local "celebrated" state was wiped independently of
  // backend-derived badge data). Mark whatever is already achieved as
  // celebrated WITHOUT showing a popup, then flip hasSeeded.
  | { action: "seed"; keysToMarkCelebrated: string[] }
  // Normal path: queue a popup for anything newly achieved since the last
  // evaluation.
  | { action: "celebrate"; badges: StatsBadge[] };

// Pure decision core for useBadgeCelebration, so the hydration-gate + silent
// -seed + celebrate logic can be unit-tested without mounting React or a
// persisted zustand store. The hook is a thin shell that calls this and
// applies the resulting side effects (markCelebrated/markSeeded/setQueue).
export function evaluateBadgeCelebration(params: {
  badges: StatsBadge[];
  celebratedBadgeKeys: readonly string[];
  hasHydrated: boolean;
  hasSeeded: boolean;
  isDhikrDataSettled: boolean;
}): BadgeCelebrationEvaluation {
  if (!params.hasHydrated || !params.isDhikrDataSettled) {
    return { action: "wait" };
  }

  if (!params.hasSeeded) {
    return {
      action: "seed",
      keysToMarkCelebrated: params.badges.filter((badge) => badge.achieved).map((badge) => badge.key)
    };
  }

  return {
    action: "celebrate",
    badges: selectNewlyAchievedBadges(params.badges, params.celebratedBadgeKeys)
  };
}
