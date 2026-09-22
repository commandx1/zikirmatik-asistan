import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n, detectDeviceLocale, type SupportedLocale } from "../i18n";
import { resolveHapticsPattern, type HapticsPattern } from "../services/haptics-pattern";

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
  // Geriye uyumluluk için korunuyor (eski istemciler / sunucu yanıtları hâlâ
  // bu alanı kullanabilir). Yeni kod hapticsPattern'ı tercih etmeli;
  // resolveHapticsPattern ikisini uzlaştırır.
  hapticsEnabled: boolean;
  hapticsPattern: HapticsPattern;
  setLocale: (locale: SupportedLocale) => void;
  setReminderTime: (time: string) => void;
  setDailyReminderEnabled: (enabled: boolean) => void;
  setKandilNotificationsEnabled: (enabled: boolean) => void;
  setHapticsEnabled: (enabled: boolean) => void;
  setHapticsPattern: (pattern: HapticsPattern) => void;
  resetSessionScoped: () => void;
  hydrateFromBackend: (payload: {
    displayName?: string;
    isPremium?: boolean;
    reminderTime?: string;
    dailyReminderEnabled?: boolean;
    kandilNotificationsEnabled?: boolean;
    hapticsEnabled?: boolean;
    hapticsPattern?: string;
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
      hapticsPattern: "orta",
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
        set((state) => ({
          hapticsEnabled: enabled,
          // Legacy on/off switch stays coherent with the newer pattern setting:
          // turning it off silences haptics outright, turning it back on
          // restores the default pattern only if it was previously silenced
          // (a specific hafif/tesbih choice is never clobbered).
          hapticsPattern: enabled ? (state.hapticsPattern === "off" ? "orta" : state.hapticsPattern) : "off"
        }));
      },
      setHapticsPattern: (pattern) => {
        set({ hapticsPattern: pattern, hapticsEnabled: pattern !== "off" });
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
          hapticsEnabled: true,
          hapticsPattern: "orta"
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
            : {}),
          // Sunucudan gelen hapticsPattern önceliklidir; yoksa hapticsEnabled'dan
          // türetilir. İkisi de yoksa mevcut yerel pattern korunur (üstteki
          // spread state'i taşır).
          ...(payload.hapticsPattern !== undefined || typeof payload.hapticsEnabled === "boolean"
            ? { hapticsPattern: resolveHapticsPattern(payload.hapticsPattern, payload.hapticsEnabled) }
            : {})
        }));
      }
    }),
    {
      name: "profile-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        locale: state.locale,
        // Misafir kullanıcıda da haptik tercihi yeniden açılışta korunsun;
        // giriş yapan kullanıcıda hydrateFromBackend sunucu değerini üstüne yazar.
        hapticsEnabled: state.hapticsEnabled,
        hapticsPattern: state.hapticsPattern,
        // Widget'ın headless handler'ı isPremium'u AsyncStorage'dan okur;
        // girişte hydrateFromBackend sunucu değerini üstüne yazar, çıkışta
        // resetSessionScoped false yapar.
        isPremium: state.isPremium
      }),
      onRehydrateStorage: () => (state) => {
        if (state?.locale) {
          void i18n.changeLanguage(state.locale);
        }
      }
    }
  )
);
