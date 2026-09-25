import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

// Local-only, one-shot flag: has the OS in-app store rating prompt already
// been requested on this device? The OS itself throttles repeat prompts, but
// we still gate to exactly one request per install (see
// features/review/request-store-review.ts).
type ReviewState = {
  reviewRequestedAt: string | null;
  markReviewRequested: () => void;
  // One-shot flag for the "day 7" yearly-plan offer (see
  // features/home/hooks/use-day7-offer.ts) — same one-per-install shape as
  // reviewRequestedAt above.
  day7OfferShownAt: string | null;
  markDay7OfferShown: () => void;
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      reviewRequestedAt: null,
      markReviewRequested: () => set({ reviewRequestedAt: new Date().toISOString() }),
      day7OfferShownAt: null,
      markDay7OfferShown: () => set({ day7OfferShownAt: new Date().toISOString() })
    }),
    {
      name: "review-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        reviewRequestedAt: state.reviewRequestedAt,
        day7OfferShownAt: state.day7OfferShownAt
      })
    }
  )
);
