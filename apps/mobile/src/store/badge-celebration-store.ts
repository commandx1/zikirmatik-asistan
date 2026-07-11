import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local-only (NOT backend-synced, same rationale as streak-reminder-store):
// tracks which badge keys have already shown their in-app celebration so a
// badge is celebrated exactly once, ever, on this device. Badges themselves
// are derived data (see local-badges.ts / stats-aggregator.ts), not stored
// here — only the "have we already congratulated the user" flag is.
type BadgeCelebrationState = {
  celebratedBadgeKeys: string[];
  markCelebrated: (key: string) => void;
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
      celebratedBadgeKeys: [],
      markCelebrated: (key) => {
        if (get().celebratedBadgeKeys.includes(key)) {
          return;
        }
        set({ celebratedBadgeKeys: [...get().celebratedBadgeKeys, key] });
      }
    }),
    {
      name: "badge-celebration-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ celebratedBadgeKeys: state.celebratedBadgeKeys })
    }
  )
);
