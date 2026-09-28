import { useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import type { BadgeKey, StatsBadge } from "@zikirmatik/shared";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useReviewStore } from "../../../store/review-store";
import { useBadgeCelebrationStore } from "../../../store/badge-celebration-store";
import { queryClient } from "../../../lib/query-client";
import { computeLocalBadges, deriveLocalActivityStats, withServerStreak } from "../services/local-badges";
import {
  BADGE_CELEBRATION_IDLE_MS,
  canShowBadgeCelebration,
  enqueueBadges,
  evaluateBadgeCelebration,
  resolveBadgeDataOwner,
  resolveCelebrationBadges,
  shouldSkipReviewForDay7Offer
} from "../services/badge-celebration";
import { maybeRequestStoreReview } from "../../review/request-store-review";
import { useStreak } from "./use-streak";
import { statsSummaryQueryOptions } from "./use-stats";

// Badge key for the 7-day streak (shared BADGE_DEFINITIONS): dismissing its
// celebration is the "success UI already shown" moment for the store review
// prompt.
const STREAK_7_BADGE_KEY: BadgeKey = "streak-7";
// Lets the badge modal's fade-out finish before the system review sheet.
const REVIEW_AFTER_DISMISS_MS = 400;

// Root-mounted (see app/_layout.tsx), mirroring useStreakReminderSync:
// reacting to dhikr-store gives badge celebration for free wherever the user
// counts, for both guest and authenticated sessions. Showing is gated
// separately (canShowBadgeCelebration): queued badges wait for an idle
// counter, the home/stats tab and no open home modal.
export function useBadgeCelebration() {
  const items = useDhikrStore((state) => state.items);
  const freeModeCount = useDhikrStore((state) => state.freeModeCount);
  const freeModeActivityAt = useDhikrStore((state) => state.freeModeActivityAt);
  const activeDayKeys = useDhikrStore((state) => state.activeDayKeys);
  const lifetimeCount = useDhikrStore((state) => state.lifetimeCount);
  const lastSavedBackendLog = useDhikrStore((state) => state.lastSavedBackendLog);
  const authStatus = useAuthStore((state) => state.status);
  const sessionUserId = useAuthStore((state) => state.session?.userId);
  const isAuthHydrated = useAuthStore((state) => state.hasHydrated);
  const hasHydrated = useBadgeCelebrationStore((state) => state.hasHydrated);
  const seededForOwner = useBadgeCelebrationStore((state) => state.seededForOwner);
  const celebratedBadgeKeys = useBadgeCelebrationStore((state) => state.celebratedBadgeKeys);
  const isHomeOverlayOpen = useBadgeCelebrationStore((state) => state.isHomeOverlayOpen);
  const markCelebrated = useBadgeCelebrationStore((state) => state.markCelebrated);
  const markSeeded = useBadgeCelebrationStore((state) => state.markSeeded);
  const setCelebrationVisible = useBadgeCelebrationStore((state) => state.setCelebrationVisible);
  const { serverStreak } = useStreak();
  const pathname = usePathname();

  const [queue, setQueue] = useState<StatsBadge[]>([]);
  const [isDhikrRestored, setIsDhikrRestored] = useState(() => useDhikrStore.persist.hasHydrated());
  const [isCounterIdle, setIsCounterIdle] = useState(false);

  useEffect(() => {
    if (useDhikrStore.persist.hasHydrated()) {
      setIsDhikrRestored(true);
      return;
    }
    return useDhikrStore.persist.onFinishHydration(() => setIsDhikrRestored(true));
  }, []);

  // Idle = no count change for BADGE_CELEBRATION_IDLE_MS. Subscribing (vs.
  // an effect on items) keeps this off the render path of every tap.
  useEffect(() => {
    let timer = setTimeout(() => setIsCounterIdle(true), BADGE_CELEBRATION_IDLE_MS);
    const unsubscribe = useDhikrStore.subscribe((state, prev) => {
      if (state.items === prev.items && state.freeModeCount === prev.freeModeCount) {
        return;
      }
      setIsCounterIdle(false);
      clearTimeout(timer);
      timer = setTimeout(() => setIsCounterIdle(true), BADGE_CELEBRATION_IDLE_MS);
    });
    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, []);

  const localStats = useMemo(
    () => deriveLocalActivityStats({ items, freeModeCount, freeModeActivityAt, activeDayKeys }),
    [items, freeModeCount, freeModeActivityAt, activeDayKeys]
  );
  // Only the day-7 review skip uses this — same streak the offer hook checks.
  const stats = useMemo(() => withServerStreak(localStats, serverStreak), [localStats, serverStreak]);
  const localBadges = useMemo(
    () => computeLocalBadges({ lifetimeCount, longestStreak: localStats.longestStreak }),
    [lifetimeCount, localStats.longestStreak]
  );

  // Members: the stats screen's own query (same key/options), so both show
  // one array. Refetched after every saved log, like useStreak.
  const isAuthenticated = authStatus === "authenticated" && Boolean(sessionUserId);
  const summaryQuery = useQuery({ ...statsSummaryQueryOptions(sessionUserId), enabled: isAuthenticated }, queryClient);
  useEffect(() => {
    if (!isAuthenticated || !lastSavedBackendLog || lastSavedBackendLog.userId !== sessionUserId) {
      return;
    }
    void queryClient.invalidateQueries({ queryKey: statsSummaryQueryOptions(sessionUserId).queryKey });
  }, [isAuthenticated, lastSavedBackendLog, sessionUserId]);

  const isPremium = useProfileStore((state) => state.isPremium);
  const day7OfferShownAt = useReviewStore((state) => state.day7OfferShownAt);

  const owner = resolveBadgeDataOwner(authStatus, sessionUserId);
  const badges = resolveCelebrationBadges({
    storesHydrated: hasHydrated && isAuthHydrated && isDhikrRestored,
    authStatus,
    localBadges,
    serverBadges: summaryQuery.data?.badges
  });

  useEffect(() => {
    const evaluation = evaluateBadgeCelebration({
      badges: badges ?? [],
      celebratedBadgeKeys,
      owner,
      seededForOwner,
      isDataSettled: badges !== null
    });

    if (evaluation.action === "wait") {
      return;
    }

    if (evaluation.action === "seed") {
      // Silent (re)seed for a new data owner: fresh install, sign-in,
      // account switch, or reinstall + sign-in — already-earned badges are
      // marked without a popup, and anything queued for the previous owner
      // is dropped. A genuinely new guest has nothing achieved yet, so their
      // first real badge still fires later.
      for (const key of evaluation.keysToMarkCelebrated) {
        markCelebrated(key);
      }
      markSeeded(evaluation.owner);
      setQueue([]);
      return;
    }

    // Marked celebrated only once actually shown (effect below), so an app
    // kill before it's seen re-queues it; enqueueBadges dedupes meanwhile.
    setQueue((prev) => enqueueBadges(prev, evaluation.badges));
  }, [badges, owner, seededForOwner, celebratedBadgeKeys, markCelebrated, markSeeded]);

  const current =
    queue[0] && canShowBadgeCelebration({ isCounterIdle, pathname, isHomeOverlayOpen }) ? queue[0] : null;
  const currentKey = current?.key;

  useEffect(() => {
    if (currentKey) {
      markCelebrated(currentKey);
    }
    setCelebrationVisible(Boolean(currentKey));
  }, [currentKey, markCelebrated, setCelebrationVisible]);

  const reviewTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => {
    if (reviewTimerRef.current) {
      clearTimeout(reviewTimerRef.current);
    }
  }, []);

  const dismiss = () => {
    if (
      current?.key === STREAK_7_BADGE_KEY &&
      !shouldSkipReviewForDay7Offer({ isPremium, streak: stats.currentStreak, day7OfferShownAt })
    ) {
      reviewTimerRef.current = setTimeout(() => {
        // Never stack the system review sheet on the premium sheet (e.g. the
        // day-7 offer), which counts as a home overlay.
        if (!useBadgeCelebrationStore.getState().isHomeOverlayOpen) {
          void maybeRequestStoreReview("streak_7");
        }
      }, REVIEW_AFTER_DISMISS_MS);
    }
    setQueue((prev) => prev.slice(1));
  };

  return { current, dismiss };
}
