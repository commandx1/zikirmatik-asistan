import * as Notifications from "expo-notifications";
import { useNotificationPromptStore } from "../../../store/notification-prompt-store";

// Shared "turn a notification toggle on" permission flow, reused by every
// settings toggle that needs OS notification permission (streak reminder,
// push-campaign prefs). Mirrors profile/services/request-daily-reminder-opt-in.ts
// but is decoupled from any single feature's sync logic — callers decide
// what to enable once permission is confirmed.
export async function requestNotificationPermissionForToggle(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  useNotificationPromptStore.getState().setPending(true);
  try {
    if (!current.canAskAgain) {
      // OS won't show the native dialog again (user permanently denied) —
      // point the user at Settings instead of a no-op native call.
      useNotificationPromptStore.getState().showDenied();
      return false;
    }

    const confirmed = await useNotificationPromptStore.getState().request();
    if (!confirmed) {
      return false;
    }

    const requested = await Notifications.requestPermissionsAsync();
    return requested.granted;
  } finally {
    useNotificationPromptStore.getState().setPending(false);
  }
}
