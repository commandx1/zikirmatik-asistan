import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

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
// hasSeeded: true once the hook has run its one-time silent seed (see
// use-badge-celebration.ts). A fresh store (first install, or after the user
// clears app data) can have already-earned badges the moment dhikr data is
// re-hydrated from the backend — without this flag those would be
// misread as "newly achieved" and pop the celebration modal unprompted.
type BadgeCelebrationState = {
  hasHydrated: boolean;
  hasSeeded: boolean;
  celebratedBadgeKeys: string[];
  markCelebrated: (key: string) => void;
  markSeeded: () => void;
  markHydrated: () => void;
};

const safeAsyncStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  }
};

export const useBadgeCelebrationStore = create<BadgeCelebrationState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      hasSeeded: false,
      celebratedBadgeKeys: [],
      markCelebrated: (key) => {
        if (get().celebratedBadgeKeys.includes(key)) {
          return;
        }
        set({ celebratedBadgeKeys: [...get().celebratedBadgeKeys, key] });
      },
      markSeeded: () => set({ hasSeeded: true }),
      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "badge-celebration-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        celebratedBadgeKeys: state.celebratedBadgeKeys,
        hasSeeded: state.hasSeeded
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
