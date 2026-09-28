import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { toDateKey } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { calculateLocalCompletionStreak } from "./local-streak";
import { resolveActiveDays, type LocalActivitySource } from "../../stats/services/local-badges";

// Local "your streak is about to break" reminder. Fully device-local:
// derives streak + today's activity from the persisted dhikr store state,
// schedules with expo-notifications (device-local time), no backend calls.
export const STREAK_REMINDER_KIND = "streak-reminder";
// Main dhikr screen; must stay in the notification-tap-routing allowlist.
export const STREAK_REMINDER_ROUTE = "/(tabs)/home";
const ANDROID_CHANNEL_ID = "streak-reminders";
const REMINDER_HOUR = 21;

export type StreakReminderStatus = {
  currentStreak: number;
  hasCompletedToday: boolean;
};

// Uses resolveActiveDays (local-badges.ts) — the same "active day" derivation
// the stats screen and badges use, including the persisted activeDayKeys
// history — so a user counting the same dhikr every day still forms a
// streak here instead of appearing broken (an item only remembers its last
// activity, so items alone can't tell two different days apart).
export function deriveStreakReminderStatus(
  source: LocalActivitySource,
  today: Date = new Date()
): StreakReminderStatus {
  const todayKey = toDateKey(today);
  const activeDays = resolveActiveDays(source, today);
  const { currentStreak } = calculateLocalCompletionStreak(Array.from(activeDays), today);
  return { currentStreak, hasCompletedToday: activeDays.has(todayKey) };
}

// One-shot target: today 21:00 if the reminder is still relevant today,
// otherwise tomorrow 21:00 (already completed today, or 21:00 has passed).
export function resolveNextReminderDate(
  status: Pick<StreakReminderStatus, "hasCompletedToday">,
  now: Date = new Date()
): Date {
  const todayTarget = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate(),
    REMINDER_HOUR,
    0,
    0,
    0
  );

  if (status.hasCompletedToday || now.getTime() >= todayTarget.getTime()) {
    return new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
      REMINDER_HOUR,
      0,
      0,
      0
    );
  }

  return todayTarget;
}

// Serializes concurrent syncs so cancel+schedule blocks never interleave
// (same pattern as daily-reminder-notifications.ts).
let syncQueue: Promise<unknown> = Promise.resolve();

export function syncStreakReminderNotification(input: {
  enabled: boolean;
  status: StreakReminderStatus;
  now?: Date;
}): Promise<{ permissionGranted: boolean; scheduled: boolean }> {
  const next = syncQueue.then(() => runSync(input));
  syncQueue = next.catch(() => {});
  return next;
}

async function runSync(input: {
  enabled: boolean;
  status: StreakReminderStatus;
  now?: Date;
}) {
  // No active streak or feature disabled: nothing to protect — remove any
  // pending reminder so the user is never nudged about a streak of 0.
  if (!input.enabled || input.status.currentStreak < 1) {
    await cancelStreakReminderNotifications();
    return { permissionGranted: true, scheduled: false };
  }

  const permission = await Notifications.getPermissionsAsync();
  if (!permission.granted) {
    // Never prompt from a background sync; without the OS permission nothing
    // would be delivered anyway, so silently no-op (matches daily reminder).
    return { permissionGranted: false, scheduled: false };
  }

  await ensureAndroidChannel();
  // Cancel-then-schedule keeps the sync idempotent: at most one streak
  // reminder is ever pending, no matter how often this runs.
  await cancelStreakReminderNotifications();

  const fireDate = resolveNextReminderDate(input.status, input.now ?? new Date());

  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("home:streakReminder.title"),
      body: i18n.t("home:streakReminder.body", { streak: input.status.currentStreak }),
      sound: Platform.OS === "ios" ? "default" : undefined,
      data: { kind: STREAK_REMINDER_KIND, route: STREAK_REMINDER_ROUTE }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: fireDate,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
    }
  });

  return { permissionGranted: true, scheduled: true };
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: i18n.t("home:streakReminder.channelName"),
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

async function cancelStreakReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const reminderIds = scheduled
    .filter((item) => item.content?.data?.kind === STREAK_REMINDER_KIND)
    .map((item) => item.identifier);

  await Promise.all(reminderIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
