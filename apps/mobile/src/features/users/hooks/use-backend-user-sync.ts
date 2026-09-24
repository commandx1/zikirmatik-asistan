import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { saveUserPreferences } from "../services/users-api-client";
import { toBackendUserHydration } from "../services/backend-user-hydration";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useThemeStore } from "../../../store/theme-store";
import {
  isRevenueCatConfigured,
  syncPremiumStatusWithRevenueCat
} from "../../subscriptions/services/revenuecat-client";
import { getNotificationsPermissionState } from "../../profile/services/daily-reminder-notifications";
import { requestDailyReminderOptIn } from "../../profile/services/request-daily-reminder-opt-in";
import { useBackendUser } from "./use-backend-user";

const DEFAULT_REMINDER_TIME = "08:00";

// Kök layout'ta bir kez mount edilir. Sunucu kullanıcı belgesi
// (useBackendUser cache'i) her değiştiğinde — hangi ekran fetch etmiş olursa
// olsun — profile-store + tema/font'a hidrate edilir. RevenueCat premium
// senkronu (yazma yolu) yalnızca mount + ön plana dönüşte çalışır, ardından
// kullanıcı belgesi tazelenir (premium bayrağı sunucuda güncellenmiş olur).
export function useBackendUserSync() {
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const hydrateProfile = useProfileStore((s) => s.hydrateFromBackend);
  const hydrateAppearance = useThemeStore((s) => s.hydrateAppearance);
  const { data: user, refetch } = useBackendUser();
  const hasReconciledReminderRef = useRef(false);

  useEffect(() => {
    if (!user) {
      return;
    }

    const { profile, appearance } = toBackendUserHydration(user);
    hydrateProfile(profile);
    hydrateAppearance(appearance);

    if (!user.notifSettings?.dailyReminder || hasReconciledReminderRef.current) {
      return;
    }
    hasReconciledReminderRef.current = true;
    const reminderTime = user.notifSettings.reminderTime ?? DEFAULT_REMINDER_TIME;
    const reminderUserId = user._id;

    void (async () => {
      const { status } = await getNotificationsPermissionState();
      if (status === "granted") {
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

      if (permissionGranted) {
        return;
      }

      hydrateProfile({ dailyReminderEnabled: false });
      await saveUserPreferences(reminderUserId, { dailyReminder: false, reminderTime }).catch(() => {});
    })().catch(() => {
      // Keep local snapshot when reminder reconciliation fails.
    });
  }, [hydrateAppearance, hydrateProfile, user]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !userId) {
      return;
    }

    // Mount'ta useQuery kendi ilk fetch'ini zaten yapar; RevenueCat yoksa
    // ikinci bir GET gereksiz. Ön plana dönüşte her durumda tazelenir.
    const sync = async ({ isMount }: { isMount: boolean }) => {
      try {
        if (isRevenueCatConfigured()) {
          await syncPremiumStatusWithRevenueCat(userId, { refreshCustomerInfo: true });
        } else if (isMount) {
          return;
        }
        await refetch();
      } catch {
        // Keep local snapshot when user / premium status cannot be synced.
      }
    };

    void sync({ isMount: true });

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void sync({ isMount: false });
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, refetch, userId]);
}
