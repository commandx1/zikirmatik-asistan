import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { i18n } from "../../../i18n";
import {
  SPECIAL_DAY_NOTIFICATIONS,
  type SpecialDayNotification
} from "../data/special-days-dataset";

// Tamamen LOKAL bildirimler — sunucuya/FCM'e bağımlılık YOKTUR.
// İki tür planlanır:
//  1) Cuma: her hafta Cuma sabahı (WEEKLY trigger).
//  2) Özel gün: gömülü datasetteki her yaklaşan olay için o günün sabahı (DATE trigger).

const FRIDAY_KIND = "friday-reminder";
const SPECIAL_DAY_KIND = "special-day-reminder";
const ANDROID_CHANNEL_ID = "special-days";

// expo-notifications WEEKLY weekday: 1=Pazar, 2=Pazartesi, ..., 6=Cuma, 7=Cumartesi
const FRIDAY_WEEKDAY = 6;
const FRIDAY_HOUR = 9;
const FRIDAY_MINUTE = 0;

// Özel günlerde sabah bildirimi saati.
const SPECIAL_DAY_HOUR = 9;
const SPECIAL_DAY_MINUTE = 0;

// iOS'ta bekleyen bildirim tavanı (64) düşük tutulur; günlük hatırlatma (7) ve
// cuma (1) ile birlikte güvenli sınır içinde kalınır.
const MAX_SPECIAL_DAY_NOTIFICATIONS = 24;

const activeLanguage = (): "tr" | "en" => (i18n.language?.startsWith("en") ? "en" : "tr");

// Eşzamanlı çağrıları sıraya alır; cancel+schedule bloğu çakışmaz.
let syncQueue: Promise<unknown> = Promise.resolve();

export function syncEventNotifications(input?: {
  requestPermission?: boolean;
  now?: Date;
}): Promise<{ permissionGranted: boolean; fridayScheduled: boolean; specialDaysScheduled: number }> {
  const next = syncQueue.then(() => runSync(input ?? {}));
  syncQueue = next.catch(() => {});
  return next;
}

async function runSync(input: { requestPermission?: boolean; now?: Date }) {
  const permissionGranted = await ensureNotificationsPermission(input.requestPermission ?? false);
  if (!permissionGranted) {
    // İzin yoksa mevcut zamanlamaya dokunma — OS zaten teslim etmez.
    return { permissionGranted: false, fridayScheduled: false, specialDaysScheduled: 0 };
  }

  await ensureAndroidChannel();
  await cancelEventNotifications();

  await scheduleFriday();
  const specialDaysScheduled = await scheduleSpecialDays(input.now ?? new Date());

  return { permissionGranted: true, fridayScheduled: true, specialDaysScheduled };
}

async function scheduleFriday() {
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t("notifications:friday.title"),
      body: i18n.t("notifications:friday.body"),
      sound: Platform.OS === "ios" ? "default" : undefined,
      data: { kind: FRIDAY_KIND }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
      weekday: FRIDAY_WEEKDAY,
      hour: FRIDAY_HOUR,
      minute: FRIDAY_MINUTE,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
    }
  });
}

async function scheduleSpecialDays(now: Date): Promise<number> {
  const upcoming = selectUpcomingSpecialDays(now);
  let scheduled = 0;

  for (const day of upcoming) {
    const triggerDate = buildSpecialDayTriggerDate(day.date);
    if (!triggerDate || triggerDate.getTime() <= now.getTime()) {
      continue;
    }

    const name = day.name[activeLanguage()] || day.name.tr;
    const isKandil = day.type === "kandil";
    const titleKey = isKandil ? "notifications:kandil.title" : "notifications:specialDay.title";
    const bodyKey = isKandil ? "notifications:kandil.body" : "notifications:specialDay.body";

    await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t(titleKey, { name }),
        body: i18n.t(bodyKey),
        sound: Platform.OS === "ios" ? "default" : undefined,
        data: {
          kind: SPECIAL_DAY_KIND,
          specialDayId: day.id,
          // Detay ekranı eventKey ile de açılabiliyor (API `:id/detail`
          // hem ObjectId hem eventKey kabul eder).
          route: `/special-days/${day.id}`
        }
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: triggerDate,
        ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
      }
    });
    scheduled += 1;
  }

  return scheduled;
}

/**
 * Bugünkü (dahil) ve gelecekteki özel günleri kronolojik, sınırlı sayıda
 * döndürür. Aynı güne birden çok olay düşerse (ör. 10 Aralık 2026: Üç Aylar
 * başlangıcı + Regaib Kandili) tek bildirim kalır; kandil öncelenir.
 */
export function selectUpcomingSpecialDays(now: Date): SpecialDayNotification[] {
  const byDate = new Map<string, SpecialDayNotification>();

  for (const day of SPECIAL_DAY_NOTIFICATIONS) {
    const trigger = buildSpecialDayTriggerDate(day.date);
    if (trigger == null || trigger.getTime() <= now.getTime()) {
      continue;
    }

    const existing = byDate.get(day.date);
    if (!existing || (day.type === "kandil" && existing.type !== "kandil")) {
      byDate.set(day.date, day);
    }
  }

  return [...byDate.values()]
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : 0))
    .slice(0, MAX_SPECIAL_DAY_NOTIFICATIONS);
}

/** "YYYY-MM-DD" -> o günün yerel saatinde sabah tetikleyici Date'i. */
function buildSpecialDayTriggerDate(isoDate: string): Date | null {
  const match = isoDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);

  const date = new Date(year, month - 1, day, SPECIAL_DAY_HOUR, SPECIAL_DAY_MINUTE, 0, 0);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return date;
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
    name: i18n.t("notifications:specialDay.channelName"),
    importance: Notifications.AndroidImportance.DEFAULT,
    vibrationPattern: [0, 200, 150, 200],
    lockscreenVisibility: Notifications.AndroidNotificationVisibility.PUBLIC
  });
}

/** Cuma + özel gün bildirimlerini iptal eder (günlük hatırlatmalara dokunmaz). */
export async function cancelEventNotifications() {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled
    .filter((item) => {
      const kind = item.content?.data?.kind;
      return kind === FRIDAY_KIND || kind === SPECIAL_DAY_KIND;
    })
    .map((item) => item.identifier);

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}
