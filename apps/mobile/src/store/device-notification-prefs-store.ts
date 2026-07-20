import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Local mirror of this device's push-campaign prefs (special days, Friday).
// These are device-scoped on the backend (see apps/api devices module).
// Both fields are driven together by the single "Bildirimler" master
// toggle on the profile screen (see
// features/profile/hooks/use-notification-settings.ts) — they always move
// in lockstep with it. Defaults are `true` to match the backend's
// $setOnInsert defaults for new devices. The backend is only written by
// the explicit master-toggle flow (sync-notification-settings.ts →
// updateDevicePrefs); registration deliberately no longer sends these
// values, so an unhydrated store can never overwrite server-side prefs.
// On a failed backend update the caller reverts these fields.
type DeviceNotificationPrefsState = {
  specialDays: boolean;
  friday: boolean;
  setSpecialDays: (enabled: boolean) => void;
  setFriday: (enabled: boolean) => void;
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

export const useDeviceNotificationPrefsStore = create<DeviceNotificationPrefsState>()(
  persist(
    (set) => ({
      specialDays: true,
      friday: true,
      setSpecialDays: (enabled) => set({ specialDays: enabled }),
      setFriday: (enabled) => set({ friday: enabled })
    }),
    {
      name: "device-notification-prefs-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ specialDays: state.specialDays, friday: state.friday })
    }
  )
);
