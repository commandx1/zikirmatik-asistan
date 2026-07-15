import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import type { ThemeName } from "@zikirmatik/shared";
import { getUserById, saveUserPreferences } from "../services/users-api-client";
import { useAuthStore } from "../../../store/auth-store";
import type { AppFontFamily } from "../../../store/theme-store";
import { useProfileStore } from "../../../store/profile-store";
import { useThemeStore } from "../../../store/theme-store";
import { THEME_LABELS } from "../../../theme/labels";
import {
  isRevenueCatConfigured,
  syncPremiumStatusWithRevenueCat
} from "../../subscriptions/services/revenuecat-client";
import { getNotificationsPermissionState } from "../../profile/services/daily-reminder-notifications";
import { requestDailyReminderOptIn } from "../../profile/services/request-daily-reminder-opt-in";

const DEFAULT_REMINDER_TIME = "08:00";

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
  const hasReconciledReminderRef = useRef(false);

  useEffect(() => {
    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    let cancelled = false;
    const sync = async ({ refreshCustomerInfo = false }: { refreshCustomerInfo?: boolean } = {}) => {
      try {
        if (isRevenueCatConfigured()) {
          await syncPremiumStatusWithRevenueCat(
            session.userId,
            session.accessToken,
            { refreshCustomerInfo }
          );
        }

        const user = await getUserById(session.userId, session.accessToken);
        if (cancelled) {
          return;
        }

        hydrateProfile({
          displayName: user.displayName,
          isPremium: user.isPremium,
          reminderTime: user.notifSettings?.reminderTime,
          dailyReminderEnabled: user.notifSettings?.dailyReminder,
          kandilNotificationsEnabled: user.notifSettings?.kandilNotifications,
          hapticsEnabled: user.hapticsEnabled
        });
        hydrateAppearance({
          themeName: normalizeThemeName(user.theme),
          fontFamily: normalizeFontFamily(user.fontFamily)
        });

        if (user.notifSettings?.dailyReminder && !hasReconciledReminderRef.current) {
          hasReconciledReminderRef.current = true;
          const reminderTime = user.notifSettings.reminderTime ?? DEFAULT_REMINDER_TIME;

          const { status } = await getNotificationsPermissionState();
          if (cancelled || status === "granted") {
            return;
          }

          // Bildirim izni backend'in "true" bildiği bir durumla uyuşmuyor.
          // "undetermined" = izin bu kurulumda hiç sorulmamış (tipik reinstall
          // sinyali) — kullanıcının önceki tercihini geri kazanmayı dene.
          let permissionGranted = false;
          if (status === "undetermined") {
            const result = await requestDailyReminderOptIn(reminderTime, { showDeniedPrompt: false });
            permissionGranted = result.permissionGranted;
          }

          if (cancelled || permissionGranted) {
            return;
          }

          hydrateProfile({ dailyReminderEnabled: false });
          await saveUserPreferences(
            session.userId,
            { dailyReminder: false, reminderTime },
            session.accessToken
          ).catch(() => {});
        }
      } catch {
        // Keep local snapshot when user preferences cannot be fetched.
      }
    };

    void sync({ refreshCustomerInfo: true });

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void sync({ refreshCustomerInfo: true });
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
