import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { ESMAUL_HUSNA } from "../../focus/data";

const DAILY_REMINDER_KIND = "daily-dhikr-reminder";
const ANDROID_CHANNEL_ID = "daily-reminders";
const DEFAULT_REMINDER_TIME = "08:00";
const ESMA_PER_DAY = 3;

// expo-notifications WEEKLY weekday: 1=Pazar, 2=Pazartesi, ..., 7=Cumartesi
const TURKISH_DAY_TO_WEEKDAY: Record<string, number> = {
  Pazar: 1,
  Pazartesi: 2,
  Salı: 3,
  Çarşamba: 4,
  Perşembe: 5,
  Cuma: 6,
  Cumartesi: 7
};

// Eşzamanlı çağrıları sıraya alır; cancel+schedule bloğu çakışmaz.
let syncQueue: Promise<unknown> = Promise.resolve();

export function syncDailyReminderNotification(input: {
  enabled: boolean;
  reminderTime: string;
  requestPermission?: boolean;
}): Promise<{ permissionGranted: boolean; scheduled: boolean }> {
  const next = syncQueue.then(() => runSync(input));
  syncQueue = next.catch(() => {});
  return next;
}

async function runSync(input: {
  enabled: boolean;
  reminderTime: string;
  requestPermission?: boolean;
}) {
  if (!input.enabled) {
    await cancelDailyReminderNotifications();
    return { permissionGranted: true, scheduled: false };
  }

  const permissionGranted = await ensureNotificationsPermission(
    input.requestPermission ?? false
  );
  if (!permissionGranted) {
    // OS izni yoksa mevcut zamanlamaya dokunma — OS zaten teslim etmez.
    // Tercih, yalnızca kullanıcı açıkça kapatırsa değişmeli.
    return { permissionGranted: false, scheduled: false };
  }

  const time = parseReminderTime(input.reminderTime) ?? parseReminderTime(DEFAULT_REMINDER_TIME)!;
  await ensureAndroidChannel();
  await cancelDailyReminderNotifications();

  const weekdayEsmas = buildWeekdayEsmaNames();

  for (let weekday = 1; weekday <= 7; weekday++) {
    const names = weekdayEsmas.get(weekday) ?? [];
    const body =
      names.length > 0
        ? `Bugünkü esma: ${names.join(", ")}`
        : "Bugünkü zikrini tamamlamak için kısa bir mola ver.";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Günlük zikir vaktin",
        body,
        sound: Platform.OS === "ios" ? "default" : undefined,
        data: { kind: DAILY_REMINDER_KIND }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday,
        hour: time.hour,
        minute: time.minute,
        ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
      }
    });
  }

  return { permissionGranted: true, scheduled: true };
}

function buildWeekdayEsmaNames(): Map<number, string[]> {
  const map = new Map<number, string[]>();

  for (const esma of ESMAUL_HUSNA) {
    const weekday = TURKISH_DAY_TO_WEEKDAY[esma.dhikrDay];
    if (!weekday) {
      continue;
    }

    const list = map.get(weekday) ?? [];
    if (list.length < ESMA_PER_DAY) {
      list.push(esma.transliteration);
      map.set(weekday, list);
    }
  }

  return map;
}

export async function getNotificationsPermissionState(): Promise<{
  granted: boolean;
  canAskAgain: boolean;
  status: Notifications.PermissionStatus;
}> {
  const current = await Notifications.getPermissionsAsync();
  return { granted: current.granted, canAskAgain: current.canAskAgain, status: current.status };
}

async function ensureNotificationsPermission(requestPermission: boolean) {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  if (!requestPermission) {
    return false;
  }

  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== "android") {
    return;
  }

  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: "Günlük Hatırlatma",
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

async function cancelDailyReminderNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const dailyIds = scheduled
    .filter((item) => item.content?.data?.kind === DAILY_REMINDER_KIND)
    .map((item) => item.identifier);

  await Promise.all(dailyIds.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

function parseReminderTime(raw: string) {
  const match = raw.match(/^(\d{2}):(\d{2})$/);
  if (!match) {
    return undefined;
  }

  const hour = Number.parseInt(match[1], 10);
  const minute = Number.parseInt(match[2], 10);
  if (hour < 0 || hour > 23 || minute < 0 || minute > 59) {
    return undefined;
  }

  return { hour, minute };
}
