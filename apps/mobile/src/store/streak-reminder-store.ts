import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local-only preference (NOT backend-synced, unlike profile-store): controls
// the "streak is about to break" local notification. Driven by the single
// "Bildirimler" master toggle on the profile screen (see
// features/profile/hooks/use-notification-settings.ts) — its value always
// mirrors that toggle, so the default matches the master's off-by-default,
// opt-in-with-permission-flow behavior.
type StreakReminderState = {
  streakReminderEnabled: boolean;
  setStreakReminderEnabled: (enabled: boolean) => void;
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

export const useStreakReminderStore = create<StreakReminderState>()(
  persist(
    (set) => ({
      streakReminderEnabled: false,
      setStreakReminderEnabled: (enabled) => set({ streakReminderEnabled: enabled })
    }),
    {
      name: "streak-reminder-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ streakReminderEnabled: state.streakReminderEnabled })
    }
  )
);
