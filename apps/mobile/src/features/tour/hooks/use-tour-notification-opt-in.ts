import { useCallback } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDeviceNotificationPrefsStore } from "../../../store/device-notification-prefs-store";
import { useProfileStore } from "../../../store/profile-store";
import { useStreakReminderStore } from "../../../store/streak-reminder-store";
import { runNotificationSettingsToggle } from "../../profile/services/sync-notification-settings";

// Onboarding's post-tour permission prompt. Reuses the profile screen's
// master "Bildirimler" toggle fan-out (sync-notification-settings.ts) so a
// single grant here turns on every notification surface — daily esma
// reminder, streak reminder, and the backend special days/Friday device
// prefs — instead of just the daily reminder. This also means onboarding
// shares the exact same OS-permission request path as the master toggle,
// so there is never a second native dialog.
export function useTourNotificationOptIn() {
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const dailyReminderEnabled = useProfileStore((s) => s.dailyReminderEnabled);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const setDailyReminderEnabled = useProfileStore((s) => s.setDailyReminderEnabled);
  const setStreakReminderEnabled = useStreakReminderStore((s) => s.setStreakReminderEnabled);
  const setSpecialDays = useDeviceNotificationPrefsStore((s) => s.setSpecialDays);
  const setFriday = useDeviceNotificationPrefsStore((s) => s.setFriday);

  return useCallback(() => {
    // dailyReminderEnabled doubles as the master toggle's canonical value
    // (see use-notification-settings.ts) — if it's already on, onboarding
    // has nothing left to opt the user into.
    if (dailyReminderEnabled) {
      return;
    }

    void runNotificationSettingsToggle({
      enabled: true,
      reminderTime,
      userId: authStatus === "authenticated" ? session?.userId : undefined,
      accessToken: session?.accessToken,
      setAll: (value) => {
        setDailyReminderEnabled(value);
        setStreakReminderEnabled(value);
        setSpecialDays(value);
        setFriday(value);
      },
      // Onboarding has no error UI to surface a failure to — a backend
      // hiccup here must never block the flow, so it's swallowed silently.
      onError: () => {}
    });
  }, [
    authStatus,
    dailyReminderEnabled,
    reminderTime,
    session?.accessToken,
    session?.userId,
    setDailyReminderEnabled,
    setFriday,
    setSpecialDays,
    setStreakReminderEnabled
  ]);
}
