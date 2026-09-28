import type { StatsBadge } from "@zikirmatik/shared";
import { shouldShowDay7Offer } from "../../home/services/day7-offer";

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
  // Data isn't trustworthy yet (a store still rehydrating, auth in flight,
  // or — for authenticated sessions — the server badges haven't loaded).
  // Do nothing this pass.
  | { action: "wait" }
  // The data owner changed since the last seed (fresh install, sign-in,
  // account switch, upgrade from the pre-owner store). Mark whatever is
  // already achieved as celebrated WITHOUT a popup and remember the owner.
  | { action: "seed"; owner: string; keysToMarkCelebrated: string[] }
  // Normal path: queue a popup for anything newly achieved since the last
  // evaluation.
  | { action: "celebrate"; badges: StatsBadge[] };

export const GUEST_BADGE_OWNER = "guest";

/** Whose dhikr data the badges are computed from; null while that is unknown (sign-in in flight). */
export function resolveBadgeDataOwner(
  authStatus: "signed_out" | "authenticating" | "authenticated",
  sessionUserId: string | undefined
): string | null {
  if (authStatus === "authenticating") {
    return null;
  }
  if (authStatus === "authenticated") {
    return sessionUserId ?? null;
  }
  return GUEST_BADGE_OWNER;
}

// Pure decision core for useBadgeCelebration, so the hydration-gate +
// per-owner silent seed + celebrate logic can be unit-tested without
// mounting React or a persisted zustand store.
export function evaluateBadgeCelebration(params: {
  badges: StatsBadge[];
  celebratedBadgeKeys: readonly string[];
  owner: string | null;
  seededForOwner: string | null;
  isDataSettled: boolean;
}): BadgeCelebrationEvaluation {
  if (!params.owner || !params.isDataSettled) {
    return { action: "wait" };
  }

  if (params.seededForOwner !== params.owner) {
    return {
      action: "seed",
      owner: params.owner,
      keysToMarkCelebrated: params.badges.filter((badge) => badge.achieved).map((badge) => badge.key)
    };
  }

  return {
    action: "celebrate",
    badges: selectNewlyAchievedBadges(params.badges, params.celebratedBadgeKeys)
  };
}

// The streak-7 badge dismissal fires the store review prompt
// (400ms) — but for a non-premium user still eligible for the day-7
// yearly-plan offer (1.5s, same dismissal), both would fire back to back.
// Reuses shouldShowDay7Offer (day7-offer.ts) with the same inputs the offer
// hook itself checks, so this never disagrees with whether the offer is
// actually still pending.
export function shouldSkipReviewForDay7Offer(params: {
  isPremium: boolean;
  streak: number;
  day7OfferShownAt: string | null;
}): boolean {
  return shouldShowDay7Offer({
    isPremium: params.isPremium,
    streak: params.streak,
    shownAt: params.day7OfferShownAt
  });
}

export const BADGE_CELEBRATION_IDLE_MS = 3000;
const BADGE_CELEBRATION_ROUTES = ["/home", "/stats"];

// When a queued badge may actually be shown: never mid-counting (it would
// cover the lap checkmark/toast and swallow taps), only on the home or stats
// tab, and never on top of another home modal.
export function canShowBadgeCelebration(params: {
  isCounterIdle: boolean;
  pathname: string;
  isHomeOverlayOpen: boolean;
}): boolean {
  return params.isCounterIdle && BADGE_CELEBRATION_ROUTES.includes(params.pathname) && !params.isHomeOverlayOpen;
}

/** Appends badges not already queued (by key). Returns `queue` itself when nothing is new. */
export function enqueueBadges(queue: StatsBadge[], badges: StatsBadge[]): StatsBadge[] {
  const fresh = badges.filter((badge) => !queue.some((queued) => queued.key === badge.key));
  return fresh.length > 0 ? [...queue, ...fresh] : queue;
}

// The one badge list both the popup and the stats screen show, or null while
// it isn't final for the current owner (then the hook waits). Members: the
// server's badges from GET /v1/stats/summary — the same query cache the stats
// screen reads — so offline / not-yet-loaded means "wait", never a local
// guess that could pop and then disagree. Guests: the local computation
// (computeLocalBadges), which buildLocalStatsSummary also uses.
export function resolveCelebrationBadges(params: {
  storesHydrated: boolean;
  authStatus: "signed_out" | "authenticating" | "authenticated";
  localBadges: StatsBadge[];
  serverBadges: StatsBadge[] | undefined;
}): StatsBadge[] | null {
  if (!params.storesHydrated || params.authStatus === "authenticating") {
    return null;
  }
  if (params.authStatus === "authenticated") {
    return params.serverBadges ?? null;
  }
  return params.localBadges;
}
