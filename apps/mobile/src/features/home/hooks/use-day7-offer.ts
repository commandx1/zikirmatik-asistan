import { useEffect, useRef } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useProfileStore } from "../../../store/profile-store";
import { useReviewStore } from "../../../store/review-store";
import { deriveLocalActivityStats, withServerStreak, type ServerStreak } from "../../stats/services/local-badges";
import { shouldShowDay7Offer } from "../services/day7-offer";

const OFFER_DELAY_MS = 1500;

/**
 * One-shot "day 7" yearly-plan offer: on an app-open tick, if the home
 * screen has nothing else covering it (canShow), the user isn't premium,
 * and the local streak used by the "steady-streak" badge (local-badges.ts)
 * has reached 7, opens the premium sheet with the annual plan preselected.
 * Streak math is never reimplemented here — deriveLocalActivityStats (+ the
 * server streak for signed-in users, via withServerStreak) is the single
 * source, same as the badge.
 */
export function useDay7Offer(canShow: boolean, onOffer: () => void, serverStreak: ServerStreak | null = null): void {
  const isPremium = useProfileStore((s) => s.isPremium);
  const items = useDhikrStore((s) => s.items);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);
  const freeModeActivityAt = useDhikrStore((s) => s.freeModeActivityAt);
  const activeDayKeys = useDhikrStore((s) => s.activeDayKeys);
  const shownAt = useReviewStore((s) => s.day7OfferShownAt);
  const markShown = useReviewStore((s) => s.markDay7OfferShown);

  // onOffer is typically a fresh inline closure from the caller every
  // render; reading it through a ref keeps the effect below from tearing
  // down and rescheduling its timer on every unrelated home-view re-render.
  const onOfferRef = useRef(onOffer);
  onOfferRef.current = onOffer;
  // The foreground setTimeout below outlives effect re-runs; read canShow live so a
  // tab switch during the delay cancels the offer (B-50).
  const canShowRef = useRef(canShow);
  canShowRef.current = canShow;

  useEffect(() => {
    function check() {
      if (!canShowRef.current) {
        return;
      }
      const { currentStreak } = withServerStreak(
        deriveLocalActivityStats({ items, freeModeCount, freeModeActivityAt, activeDayKeys }),
        serverStreak
      );
      if (!shouldShowDay7Offer({ isPremium, streak: currentStreak, shownAt })) {
        return;
      }
      markShown();
      onOfferRef.current();
    }

    const timer = setTimeout(check, OFFER_DELAY_MS);
    const subscription = AppState.addEventListener("change", (next: AppStateStatus) => {
      if (next === "active") {
        setTimeout(check, OFFER_DELAY_MS);
      }
    });

    return () => {
      clearTimeout(timer);
      subscription.remove();
    };
  }, [canShow, isPremium, items, freeModeCount, freeModeActivityAt, activeDayKeys, serverStreak, shownAt, markShown]);
}
