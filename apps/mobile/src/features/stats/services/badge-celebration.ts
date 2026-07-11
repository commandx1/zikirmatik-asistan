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
