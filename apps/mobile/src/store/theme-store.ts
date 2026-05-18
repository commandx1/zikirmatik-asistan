import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import type { ThemeName } from "@zikirmatik/shared";
import { saveUserPreferences } from "../features/users/services/users-api-client";
import { useAuthStore } from "./auth-store";

export type AppFontFamily =
  | "default"
  | "merriweather"
  | "intel-one-mono"
  | "finlandica-headline"
  | "indie-flower";

type ThemeState = {
  hasHydrated: boolean;
  themeName: ThemeName;
  fontFamily: AppFontFamily;
  setThemeName: (themeName: ThemeName) => void;
  setFontFamily: (fontFamily: AppFontFamily) => void;
  hydrateAppearance: (payload: { themeName?: ThemeName; fontFamily?: AppFontFamily }) => void;
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

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      themeName: "gece-koyu",
      fontFamily: "default",
      setThemeName: (themeName) => {
        set({ themeName });
        syncUserAppearance({ theme: themeName });
      },
      setFontFamily: (fontFamily) => {
        set({ fontFamily });
        syncUserAppearance({ fontFamily });
      },
      hydrateAppearance: (payload) => {
        set((state) => ({
          ...state,
          ...(payload.themeName ? { themeName: payload.themeName } : {}),
          ...(payload.fontFamily ? { fontFamily: payload.fontFamily } : {})
        }));
      },
      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "theme-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        themeName: state.themeName,
        fontFamily: state.fontFamily
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);

function syncUserAppearance(payload: { theme?: string; fontFamily?: AppFontFamily }) {
  const auth = useAuthStore.getState();
  if (auth.status !== "authenticated" || !auth.session?.userId) {
    return;
  }

  void saveUserPreferences(auth.session.userId, payload, auth.session.accessToken).catch(() => {
    // Non-blocking best-effort sync; local preference remains source of truth.
  });
}
