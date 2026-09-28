import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

// Local-only (NOT backend-synced, same rationale as streak-reminder-store):
// tracks which badge keys have already shown their in-app celebration so a
// badge is celebrated exactly once, ever, on this device. Badges themselves
// are derived data (see local-badges.ts / stats-aggregator.ts), not stored
// here — only the "have we already congratulated the user" flag is.
//
// hasHydrated (mirrors theme-store/auth-store): true once persisted state has
// been read back from AsyncStorage. Consumers must wait for this before
// evaluating "newly achieved" badges, otherwise they'd race the rehydrate and
// see an empty celebratedBadgeKeys on cold start.
//
// seededForOwner: whose data the one-time silent seed last ran against
// (session userId, or "guest"). The seed marks every already-achieved badge
// as celebrated without a popup; it re-runs whenever the data owner changes
// (sign-in, account switch, reinstall + sign-in) once that owner's data has
// settled, so badges earned in the past never pop as "new" (see
// use-badge-celebration.ts / evaluateBadgeCelebration).
//
// isHomeOverlayOpen / isCelebrationVisible: NOT persisted, UI coordination
// only. Home publishes whether one of its own modals is open (the badge
// modal waits for it); the host publishes whether the badge modal is up
// (the day-7 offer waits for it).
type BadgeCelebrationState = {
  hasHydrated: boolean;
  seededForOwner: string | null;
  celebratedBadgeKeys: string[];
  isHomeOverlayOpen: boolean;
  isCelebrationVisible: boolean;
  markCelebrated: (key: string) => void;
  markSeeded: (owner: string) => void;
  markHydrated: () => void;
  setHomeOverlayOpen: (open: boolean) => void;
  setCelebrationVisible: (visible: boolean) => void;
};

export const useBadgeCelebrationStore = create<BadgeCelebrationState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      seededForOwner: null,
      celebratedBadgeKeys: [],
      isHomeOverlayOpen: false,
      isCelebrationVisible: false,
      markCelebrated: (key) => {
        if (get().celebratedBadgeKeys.includes(key)) {
          return;
        }
        set({ celebratedBadgeKeys: [...get().celebratedBadgeKeys, key] });
      },
      markSeeded: (owner) => set({ seededForOwner: owner }),
      markHydrated: () => set({ hasHydrated: true }),
      setHomeOverlayOpen: (open) => set({ isHomeOverlayOpen: open }),
      setCelebrationVisible: (visible) => set({ isCelebrationVisible: visible })
    }),
    {
      name: "badge-celebration-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        celebratedBadgeKeys: state.celebratedBadgeKeys,
        seededForOwner: state.seededForOwner
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
