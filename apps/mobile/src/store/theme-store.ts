import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";
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

  void saveUserPreferences(auth.session.userId, payload).catch(() => {
    // Non-blocking best-effort sync; local preference remains source of truth.
  });
}
