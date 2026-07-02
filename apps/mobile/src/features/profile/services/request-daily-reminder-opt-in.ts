import { useNotificationPromptStore } from "../../../store/notification-prompt-store";
import {
  getNotificationsPermissionState,
  syncDailyReminderNotification
} from "./daily-reminder-notifications";

export async function requestDailyReminderOptIn(
  reminderTime: string,
  options?: { showDeniedPrompt?: boolean }
): Promise<{ permissionGranted: boolean; scheduled: boolean }> {
  const showDeniedPrompt = options?.showDeniedPrompt ?? true;

  // Diğer "günlük" modallarla (örn. günlük esma karşılama modalı) çakışmayı
  // önlemek için, ilk await'ten önce senkron olarak pending işaretlenir —
  // böylece aynı render turunda çakışan modallar bu bayrağı görüp erteler.
  useNotificationPromptStore.getState().setPending(true);

  try {
    const { granted, canAskAgain } = await getNotificationsPermissionState();

    if (!granted && !canAskAgain) {
      // OS artık native diyaloğu göstermeyecek (kullanıcı kalıcı reddetmiş) —
      // ne soft-ask sheet'i ne de anlamsız native çağrıyı tetikle.
      if (showDeniedPrompt) {
        useNotificationPromptStore.getState().showDenied();
      }
      return { permissionGranted: false, scheduled: false };
    }

    if (!granted) {
      const confirmed = await useNotificationPromptStore.getState().request();
      if (!confirmed) {
        return { permissionGranted: false, scheduled: false };
      }
    }

    return await syncDailyReminderNotification({ enabled: true, reminderTime, requestPermission: true });
  } finally {
    useNotificationPromptStore.getState().setPending(false);
  }
}
