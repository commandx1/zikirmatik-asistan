import { useEffect } from "react";
import { AppState } from "react-native";
import type { ThemeName } from "@zikirmatik/shared";
import { getUserById } from "../services/users-api-client";
import { useAuthStore } from "../../../store/auth-store";
import type { AppFontFamily } from "../../../store/theme-store";
import { useProfileStore } from "../../../store/profile-store";
import { useThemeStore } from "../../../store/theme-store";
import { THEME_LABELS } from "../../../theme/labels";

function normalizeThemeName(value: string | undefined): ThemeName | undefined {
  if (!value) {
    return undefined;
  }

  return value in THEME_LABELS ? (value as ThemeName) : undefined;
}

function normalizeFontFamily(value: string | undefined): AppFontFamily | undefined {
  if (
    value === "default" ||
    value === "merriweather" ||
    value === "intel-one-mono" ||
    value === "finlandica-headline" ||
    value === "indie-flower"
  ) {
    return value;
  }

  return undefined;
}

export function useUserPreferencesSync() {
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const hydrateProfile = useProfileStore((s) => s.hydrateFromBackend);
  const hydrateAppearance = useThemeStore((s) => s.hydrateAppearance);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    let cancelled = false;
    const sync = async () => {
      try {
        const user = await getUserById(session.userId, session.accessToken);
        if (cancelled) {
          return;
        }

        hydrateProfile({
          displayName: user.displayName,
          city: user.city,
          isPremium: user.isPremium,
          reminderTime: user.notifSettings?.reminderTime,
          dailyReminderEnabled: user.notifSettings?.dailyReminder,
          kandilNotificationsEnabled: user.notifSettings?.kandilNotifications,
          adhanNotificationsEnabled: user.notifSettings?.azanNotifications,
          hapticsEnabled: user.hapticsEnabled
        });
        hydrateAppearance({
          themeName: normalizeThemeName(user.theme),
          fontFamily: normalizeFontFamily(user.fontFamily)
        });
      } catch {
        // Keep local snapshot when user preferences cannot be fetched.
      }
    };

    void sync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void sync();
      }
    });

    return () => {
      cancelled = true;
      subscription.remove();
    };
  }, [
    authStatus,
    hydrateAppearance,
    hydrateProfile,
    session?.accessToken,
    session?.userId
  ]);
}
