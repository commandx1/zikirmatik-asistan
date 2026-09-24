import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

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
