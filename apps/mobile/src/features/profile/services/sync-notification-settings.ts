import { requestNotificationPermissionForToggle } from "../../notifications/services/request-notification-permission";
import { updateDevicePrefs } from "../../notifications/services/update-device-prefs";
import { saveUserPreferences } from "../../users/services/users-api-client";
import { i18n } from "../../../i18n";
import { syncDailyReminderNotification } from "./daily-reminder-notifications";

export type NotificationSettingsToggleInput = {
  enabled: boolean;
  reminderTime: string;
  userId?: string;
  accessToken?: string;
  // Fans the toggle out to every local store this master switch drives
  // (weekly esma reminder, streak reminder, device push-campaign prefs).
  setAll: (enabled: boolean) => void;
  onError: (message: string) => void;
};

// Orchestrates the profile screen's single "Bildirimler" master toggle.
// Replaces the Faz 5 per-feature toggles (daily esma reminder, streak
// reminder, special days push, Friday push) with one on/off switch that
// always keeps every surface in sync:
// - turning on requests OS notification permission first (shared flow,
//   also drives the permanently-denied modal) and only flips local state
//   once granted
// - turning off never needs permission and flips local state immediately
// - either direction then persists to the backend (daily reminder via the
//   per-user preferences endpoint when signed in, special days/Friday via
//   the device-scoped prefs endpoint which works for guests too); a
//   backend failure reverts every surface and reports a Turkish error
export async function runNotificationSettingsToggle({
  enabled,
  reminderTime,
  userId,
  accessToken,
  setAll,
  onError
}: NotificationSettingsToggleInput): Promise<void> {
  if (!enabled) {
    setAll(false);
    try {
      await applyNotificationSettings(false, { reminderTime, userId, accessToken });
    } catch {
      setAll(true);
      onError(i18n.t("profile:errors.pushPrefsUpdateFailed"));
    }
    return;
  }

  const granted = await requestNotificationPermissionForToggle();
  if (!granted) {
    // Denied (or permanently blocked — the shared denied modal already
    // pointed the user at Settings): leave every surface off.
    return;
  }

  setAll(true);
  try {
    await applyNotificationSettings(true, { reminderTime, userId, accessToken });
  } catch {
    setAll(false);
    onError(i18n.t("profile:errors.pushPrefsUpdateFailed"));
  }
}

async function applyNotificationSettings(
  enabled: boolean,
  { reminderTime, userId, accessToken }: { reminderTime: string; userId?: string; accessToken?: string }
): Promise<void> {
  await syncDailyReminderNotification({ enabled, reminderTime, requestPermission: false });

  await Promise.all([
    userId
      ? saveUserPreferences(userId, { dailyReminder: enabled, reminderTime }, accessToken)
      : Promise.resolve(),
    updateDevicePrefs({ specialDays: enabled, friday: enabled }, accessToken)
  ]);
}
