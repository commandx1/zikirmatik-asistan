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
