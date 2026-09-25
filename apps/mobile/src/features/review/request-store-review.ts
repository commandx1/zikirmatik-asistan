import * as StoreReview from "expo-store-review";
import { useReviewStore } from "../../store/review-store";
import { trackEvent } from "../../lib/analytics";
import { E2E_MOCK_AUTH } from "../../lib/env";

export type ReviewTrigger = "streak_7" | "vird_day" | "circle_goal";

// Two triggers can land in the same tick (e.g. a streak and a vird day
// completing together) — share one in-flight request instead of racing two
// independent isAvailableAsync/requestReview calls.
let inFlight: Promise<void> | null = null;

async function awaitHydration(): Promise<void> {
  if (useReviewStore.persist.hasHydrated()) {
    return;
  }
  await new Promise<void>((resolve) => {
    const unsubscribe = useReviewStore.persist.onFinishHydration(() => {
      unsubscribe();
      resolve();
    });
  });
}

// Exactly one in-app store rating prompt per install, ever, fired at a
// success moment (7-day streak, first vird day, circle goal reached) —
// called after that moment's own success UI has already been shown. Never
// throws: a rating-prompt failure must not surface to the user.
export function maybeRequestStoreReview(trigger: ReviewTrigger): Promise<void> {
  // Detox builds: the iOS StoreKit sheet is a system modal XCUITest cannot
  // dismiss, and it would block every test after the first success moment.
  if (E2E_MOCK_AUTH) {
    return Promise.resolve();
  }
  if (inFlight) {
    return inFlight;
  }
  inFlight = run(trigger).finally(() => {
    inFlight = null;
  });
  return inFlight;
}

async function run(trigger: ReviewTrigger): Promise<void> {
  try {
    // A pre-hydration mark (unlikely, but the flag lives in AsyncStorage)
    // must never be overwritten by a hydrated-but-stale null read below.
    await awaitHydration();
    if (useReviewStore.getState().reviewRequestedAt) {
      return;
    }
    if (!(await StoreReview.isAvailableAsync())) {
      return;
    }
    await StoreReview.requestReview();
    useReviewStore.getState().markReviewRequested();
    void trackEvent("review_prompted", { trigger });
  } catch {
    // Best effort: never block or surface a failure to the user.
  }
}
