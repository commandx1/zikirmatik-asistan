import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from "expo-notifications";
import { REMINDER_OFFER_SHOWN_KEY } from "../../../lib/storage/keys";
import { useNotificationPromptStore } from "../../../store/notification-prompt-store";
import { useProfileStore } from "../../../store/profile-store";

type OfferInput = {
  permissionGranted: boolean;
  canAskAgain: boolean;
  alreadyOffered: boolean;
  reminderEnabled: boolean;
};

/**
 * B-11: show the "Günlük hatırlatma ister misin?" card at most once, only when
 * the OS dialog could still appear and the user has no reminder yet.
 */
export function shouldOfferReminderCard(input: OfferInput): boolean {
  return !input.permissionGranted && input.canAskAgain && !input.alreadyOffered && !input.reminderEnabled;
}

/**
 * Call after a user's first meaningful moment (a successful dhikr save).
 * `optIn` is the existing master opt-in (use-tour-notification-opt-in), whose
 * soft-ask modal is the card; the OS dialog opens only after "Evet".
 */
export async function offerDailyReminderAfterSave(optIn: () => void): Promise<void> {
  try {
    const [current, shown] = await Promise.all([
      Notifications.getPermissionsAsync(),
      AsyncStorage.getItem(REMINDER_OFFER_SHOWN_KEY)
    ]);
    const offer = shouldOfferReminderCard({
      permissionGranted: current.granted,
      canAskAgain: current.canAskAgain,
      alreadyOffered: Boolean(shown),
      reminderEnabled: useProfileStore.getState().dailyReminderEnabled
    });
    if (!offer) {
      return;
    }
    await AsyncStorage.setItem(REMINDER_OFFER_SHOWN_KEY, "1");
    useNotificationPromptStore.getState().setNextReason("dailyReminder");
    optIn();
  } catch {
    // Best effort: an offer must never break saving.
  }
}
