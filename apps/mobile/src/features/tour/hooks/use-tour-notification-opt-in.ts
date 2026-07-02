import { useCallback } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { requestDailyReminderOptIn } from "../../profile/services/request-daily-reminder-opt-in";
import { saveUserPreferences } from "../../users/services/users-api-client";

export function useTourNotificationOptIn() {
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const dailyReminderEnabled = useProfileStore((s) => s.dailyReminderEnabled);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const setDailyReminderEnabled = useProfileStore((s) => s.setDailyReminderEnabled);

  return useCallback(() => {
    if (dailyReminderEnabled) {
      return;
    }

    void requestDailyReminderOptIn(reminderTime, { showDeniedPrompt: false }).then(async ({ permissionGranted }) => {
      if (!permissionGranted) {
        return;
      }

      setDailyReminderEnabled(true);

      if (authStatus !== "authenticated" || !session?.userId) {
        return;
      }

      await saveUserPreferences(
        session.userId,
        { dailyReminder: true, reminderTime },
        session.accessToken
      );
    });
  }, [authStatus, dailyReminderEnabled, reminderTime, session?.accessToken, session?.userId, setDailyReminderEnabled]);
}
