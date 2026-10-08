// Pure decision for the one-time "day 7" yearly-plan offer (see use-day7-offer.ts).
// Kept side-effect free so the four cases are trivial to test without React.
export function shouldShowDay7Offer({
  isPremium,
  streak,
  shownAt
}: {
  isPremium: boolean;
  streak: number;
  shownAt: string | null;
}): boolean {
  if (isPremium) {
    return false;
  }
  if (streak < 7) {
    return false;
  }
  if (shownAt) {
    return false;
  }
  return true;
}

/** B-50: tabs stay mounted, so the offer must also wait for the home tab to be focused. */
export function canShowDay7Offer({
  isHomeFocused,
  isOverlayOpen,
  isBadgeCelebrationVisible
}: {
  isHomeFocused: boolean;
  isOverlayOpen: boolean;
  isBadgeCelebrationVisible: boolean;
}): boolean {
  return isHomeFocused && !isOverlayOpen && !isBadgeCelebrationVisible;
}
