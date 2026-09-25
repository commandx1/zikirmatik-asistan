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
};

export const useReviewStore = create<ReviewState>()(
  persist(
    (set) => ({
      reviewRequestedAt: null,
      markReviewRequested: () => set({ reviewRequestedAt: new Date().toISOString() })
    }),
    {
      name: "review-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ reviewRequestedAt: state.reviewRequestedAt })
    }
  )
);
