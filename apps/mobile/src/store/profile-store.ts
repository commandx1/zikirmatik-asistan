import { create } from "zustand";

type ProfileState = {
  displayName: string;
  memberSinceLabel: string;
  totalDhikr: number;
  streakDays: number;
  activeDays: number;
  isPremium: boolean;
  city: string;
  language: string;
  reminderTime: string;
  dailyReminderEnabled: boolean;
  kandilNotificationsEnabled: boolean;
  adhanNotificationsEnabled: boolean;
  hapticsEnabled: boolean;
  setCity: (city: string) => void;
  setReminderTime: (time: string) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setKandilNotificationsEnabled: (enabled: boolean) => void;
  setAdhanNotificationsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  resetSessionScoped: () => void;
  hydrateFromBackend: (payload: {
    displayName?: string;
    city?: string;
    isPremium?: boolean;
    reminderTime?: string;
    dailyReminderEnabled?: boolean;
    kandilNotificationsEnabled?: boolean;
    adhanNotificationsEnabled?: boolean;
    hapticsEnabled?: boolean;
  }) => void;
};

export const useProfileStore = create<ProfileState>((set) => ({
  displayName: "Misafir",
  memberSinceLabel: "",
  totalDhikr: 0,
  streakDays: 0,
  activeDays: 0,
  isPremium: false,
  city: "",
  language: "Türkçe",
  reminderTime: "08:00",
  dailyReminderEnabled: false,
  kandilNotificationsEnabled: true,
  adhanNotificationsEnabled: false,
  hapticsEnabled: true,
  setCity: (city) => {
    const nextCity = city.trim();
    set({ city: nextCity });
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
  setAdhanNotificationsEnabled: (enabled) => {
    set({ adhanNotificationsEnabled: enabled });
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
      city: "",
      reminderTime: "08:00",
      dailyReminderEnabled: false,
      kandilNotificationsEnabled: true,
      adhanNotificationsEnabled: false,
      hapticsEnabled: true
    });
  },
  hydrateFromBackend: (payload) => {
    set((state) => ({
      ...state,
      ...(payload.displayName ? { displayName: payload.displayName } : {}),
      ...(payload.city ? { city: payload.city } : {}),
      ...(typeof payload.isPremium === "boolean" ? { isPremium: payload.isPremium } : {}),
      ...(payload.reminderTime ? { reminderTime: payload.reminderTime } : {}),
      ...(typeof payload.dailyReminderEnabled === "boolean"
        ? { dailyReminderEnabled: payload.dailyReminderEnabled }
        : {}),
      ...(typeof payload.kandilNotificationsEnabled === "boolean"
        ? { kandilNotificationsEnabled: payload.kandilNotificationsEnabled }
        : {}),
      ...(typeof payload.adhanNotificationsEnabled === "boolean"
        ? { adhanNotificationsEnabled: payload.adhanNotificationsEnabled }
        : {}),
      ...(typeof payload.hapticsEnabled === "boolean"
        ? { hapticsEnabled: payload.hapticsEnabled }
        : {})
    }));
  }
}));
