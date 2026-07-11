import { useCallback, useState } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDeviceNotificationPrefsStore } from "../../../store/device-notification-prefs-store";
import { useProfileStore } from "../../../store/profile-store";
import { useStreakReminderStore } from "../../../store/streak-reminder-store";
import { runNotificationSettingsToggle } from "../services/sync-notification-settings";

// Single master toggle for the profile screen's "Bildirimler" section.
// Fans out to every notification surface previously exposed as separate
// Faz 5 toggles: the weekly esma reminder (profile-store, backend-synced —
// dailyReminderEnabled doubles as this master's canonical value), the
// streak reminder (local-only; useStreakReminderSync reacts to the store),
// and the device-scoped push-campaign prefs (special days / Friday). All
// four now always move together — see sync-notification-settings.ts for
// the actual orchestration, kept here as a thin store-wiring layer so it
// stays unit-testable without React.
export function useNotificationSettings() {
  const notificationsEnabled = useProfileStore((s) => s.dailyReminderEnabled);
  const setDailyReminderEnabled = useProfileStore((s) => s.setDailyReminderEnabled);
  const reminderTime = useProfileStore((s) => s.reminderTime);

  const setStreakReminderEnabled = useStreakReminderStore((s) => s.setStreakReminderEnabled);
  const setSpecialDays = useDeviceNotificationPrefsStore((s) => s.setSpecialDays);
  const setFriday = useDeviceNotificationPrefsStore((s) => s.setFriday);

  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);

  const [pushPrefsError, setPushPrefsError] = useState<string>();

  const onToggleNotifications = useCallback(
    (enabled: boolean) => {
      void runNotificationSettingsToggle({
        enabled,
        reminderTime,
        userId: authStatus === "authenticated" ? userId : undefined,
        accessToken,
        setAll: (value) => {
          setDailyReminderEnabled(value);
          setStreakReminderEnabled(value);
          setSpecialDays(value);
          setFriday(value);
        },
        onError: setPushPrefsError
      });
    },
    [
      accessToken,
      authStatus,
      reminderTime,
      setDailyReminderEnabled,
      setFriday,
      setSpecialDays,
      setStreakReminderEnabled,
      userId
    ]
  );

  return {
    notificationsEnabled,
    onToggleNotifications,
    pushPrefsError,
    clearPushPrefsError: () => setPushPrefsError(undefined)
  };
}
