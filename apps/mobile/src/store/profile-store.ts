import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n, detectDeviceLocale, type SupportedLocale } from "../i18n";

type ProfileState = {
  displayName: string;
  memberSinceLabel: string;
  totalDhikr: number;
  streakDays: number;
  activeDays: number;
  isPremium: boolean;
  locale: SupportedLocale;
  reminderTime: string;
  dailyReminderEnabled: boolean;
  kandilNotificationsEnabled: boolean;
  hapticsEnabled: boolean;
  setLocale: (locale: SupportedLocale) => void;
  setReminderTime: (time: string) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setKandilNotificationsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  resetSessionScoped: () => void;
  hydrateFromBackend: (payload: {
    displayName?: string;
    isPremium?: boolean;
    reminderTime?: string;
    dailyReminderEnabled?: boolean;
    kandilNotificationsEnabled?: boolean;
    hapticsEnabled?: boolean;
  }) => void;
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

export const useProfileStore = create<ProfileState>()(
  persist(
    (set) => ({
      displayName: "Misafir",
      memberSinceLabel: "",
      totalDhikr: 0,
      streakDays: 0,
      activeDays: 0,
      isPremium: false,
      locale: detectDeviceLocale(),
      reminderTime: "08:00",
      dailyReminderEnabled: false,
      kandilNotificationsEnabled: true,
      hapticsEnabled: true,
      setLocale: (locale) => {
        void i18n.changeLanguage(locale);
        set({ locale });
      },
      setReminderTime: (time) => {
        set({ reminderTime: time });
      },
      setDailyReminderEnabled: (enabled) => {
        set({ dailyReminderEnabled: enabled });
      },
      setKandilNotificationsEnabled: (enabled) => {
        set({ kandilNotificationsEnabled: enabled });
      },
      setHapticsEnabled: (enabled) => {
        set({ hapticsEnabled: enabled });
      },
      resetSessionScoped: () => {
        set({
          displayName: "Misafir",
          memberSinceLabel: "",
          totalDhikr: 0,
          streakDays: 0,
          activeDays: 0,
          isPremium: false,
          reminderTime: "08:00",
          dailyReminderEnabled: false,
          kandilNotificationsEnabled: true,
          hapticsEnabled: true
        });
      },
      hydrateFromBackend: (payload) => {
        set((state) => ({
          ...state,
          ...(payload.displayName ? { displayName: payload.displayName } : {}),
          ...(typeof payload.isPremium === "boolean" ? { isPremium: payload.isPremium } : {}),
          ...(payload.reminderTime ? { reminderTime: payload.reminderTime } : {}),
          ...(typeof payload.dailyReminderEnabled === "boolean"
            ? { dailyReminderEnabled: payload.dailyReminderEnabled }
            : {}),
          ...(typeof payload.kandilNotificationsEnabled === "boolean"
            ? { kandilNotificationsEnabled: payload.kandilNotificationsEnabled }
            : {}),
          ...(typeof payload.hapticsEnabled === "boolean"
            ? { hapticsEnabled: payload.hapticsEnabled }
            : {})
        }));
      }
    }),
    {
      name: "profile-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        locale: state.locale
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          void i18n.changeLanguage(state.locale);
        }
      }
    }
  )
);
