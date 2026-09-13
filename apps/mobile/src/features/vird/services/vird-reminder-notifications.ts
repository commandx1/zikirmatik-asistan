// Vird dilim hatırlatmaları — TAMAMEN LOKAL bildirimler (bkz.
// notifications/services/event-notifications.ts ile aynı desen: syncQueue,
// `kind` alanı + getAllScheduledNotificationsAsync üzerinden iptal, Android
// kanalı). Sunucuya/FCM'e bağımlılık YOKTUR.
//
// Yalnız BUGÜN ve YARIN için, dilim başına TEK bir tetik planlanır:
//  - morning: fajr + 30 dk
//  - prayer : prayerSelection'daki HER vakit için AYRI bir tetik, o vaktin
//             saati + 15 dk (1=fajr, 2=dhuhr, 3=asr, 4=maghrib, 5=isha —
//             bkz. ../types.ts VIRD_PRAYER_INDEX_LABEL_TR / vird.types.ts)
//  - evening: maghrib + 30 dk
//  - night  : isha + 60 dk
// (`free` dilimi için hatırlatma YOK — VirdProgramReminders.slots'ta zaten
// yer almıyor.)
//
// Geçmişte kalan saatler ve BUGÜN için zaten tamamlanmış dilim/vakit
// örnekleri atlanır (slotProgress ile). reminderPrefs.enabled=false ya da
// provinceKey yoksa (ya da aktif program yoksa) tüm vird hatırlatmaları
// iptal edilir, hiçbir planlama denenmez.
import { Platform } from "react-native";
import * as Notifications from "expo-notifications";
import { toDateKey } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import type { VirdDayProgressByDate, VirdReminderPrefs, VirdSlotKey } from "../types";
import { dayIndexFor, expectedItemsForDay, slotProgress, type VirdDayProgramLike } from "./vird-day";
import { getPrayerTimes, type PrayerTimesResult } from "./prayer-times";

export const VIRD_SLOT_REMINDER_KIND = "vird-slot-reminder";
const ANDROID_CHANNEL_ID = "vird-reminders";

const MORNING_OFFSET_MIN = 30;
const PRAYER_OFFSET_MIN = 15;
const EVENING_OFFSET_MIN = 30;
const NIGHT_OFFSET_MIN = 60;

// prayerIndex (1..5) -> adhan alanı (1=sabah,2=öğle,3=ikindi,4=akşam,5=yatsı).
const PRAYER_INDEX_TO_FIELD: Record<number, keyof PrayerTimesResult> = {
  1: "fajr",
  2: "dhuhr",
  3: "asr",
  4: "maghrib",
  5: "isha"
};

const DAYS_AHEAD = [0, 1] as const; // bugün + yarın

export type SyncVirdRemindersInput = {
  /** Aktif vird programı; null ise (program yok/aktif değil) hepsi iptal edilir. */
  program: VirdDayProgramLike | null;
  reminderPrefs: VirdReminderPrefs;
  /** store'daki dayProgress alanı (bkz. store/vird-store.ts). */
  dayProgress: VirdDayProgressByDate;
  now?: Date;
  requestPermission?: boolean;
};

export type SyncVirdRemindersResult = { scheduled: number };

// Eşzamanlı çağrıları sıraya alır; cancel+schedule bloğu çakışmaz (bkz.
// event-notifications.ts syncQueue ile aynı desen).
let syncQueue: Promise<unknown> = Promise.resolve();

export function syncVirdReminders(input: SyncVirdRemindersInput): Promise<SyncVirdRemindersResult> {
  const next = syncQueue.then(() => runSync(input));
  syncQueue = next.catch(() => {});
  return next;
}

async function runSync(input: SyncVirdRemindersInput): Promise<SyncVirdRemindersResult> {
  const now = input.now ?? new Date();

  if (!input.reminderPrefs.enabled || !input.reminderPrefs.provinceKey || !input.program) {
    await cancelVirdReminders();
    return { scheduled: 0 };
  }

  const permissionGranted = await ensureNotificationsPermission(input.requestPermission ?? false);
  if (!permissionGranted) {
    // İzin yoksa mevcut zamanlamaya dokunma (event-notifications.ts ile aynı davranış).
    return { scheduled: 0 };
  }

  await ensureAndroidChannel();
  await cancelVirdReminders();

  const program = input.program;
  const provinceKey = input.reminderPrefs.provinceKey;
  let scheduled = 0;

  for (const dayOffset of DAYS_AHEAD) {
    scheduled += await scheduleForDay({
      program,
      reminderPrefs: input.reminderPrefs,
      dayProgress: input.dayProgress,
      provinceKey,
      now,
      dayOffset
    });
  }

  return { scheduled };
}

async function scheduleForDay(args: {
  program: VirdDayProgramLike;
  reminderPrefs: VirdReminderPrefs;
  dayProgress: VirdDayProgressByDate;
  provinceKey: string;
  now: Date;
  dayOffset: number;
}): Promise<number> {
  const { program, reminderPrefs, dayProgress, provinceKey, now, dayOffset } = args;
  const targetDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + dayOffset);
  const dateKey = toDateKey(targetDate);
  const dayIndex = dayIndexFor(program, dateKey);
  const expected = expectedItemsForDay(program, dayIndex);
  if (expected.length === 0) {
    return 0;
  }

  const progress = slotProgress(expected, dayProgress[dateKey]);
  const prayerTimes = getPrayerTimes(provinceKey, targetDate);
  let scheduled = 0;

  const nonPrayerSlots = ["morning", "evening", "night"] as const;
  for (const slot of nonPrayerSlots) {
    if (!reminderPrefs.slots[slot]) {
      continue;
    }
    const slotView = progress[slot];
    if (!slotView || slotView.done >= slotView.total) {
      continue; // beklenen item yok ya da dilim zaten tamamlanmış
    }

    const base = slot === "morning" ? prayerTimes.fajr : slot === "evening" ? prayerTimes.maghrib : prayerTimes.isha;
    const offsetMin = slot === "morning" ? MORNING_OFFSET_MIN : slot === "evening" ? EVENING_OFFSET_MIN : NIGHT_OFFSET_MIN;
    const trigger = addMinutes(base, offsetMin);
    if (trigger.getTime() <= now.getTime()) {
      continue; // geçmişte kalmış
    }

    await scheduleOne({ dateKey, slot, prayerIndex: null, trigger });
    scheduled += 1;
  }

  if (reminderPrefs.slots.prayer && progress.prayer) {
    const prayerIndexes = Array.from(
      new Set(progress.prayer.items.map((item) => item.prayerIndex).filter((value): value is number => value != null))
    ).sort((a, b) => a - b);

    for (const prayerIndex of prayerIndexes) {
      const isComplete = progress.prayer.items.filter((item) => item.prayerIndex === prayerIndex).every((item) => item.completed);
      if (isComplete) {
        continue;
      }

      const field = PRAYER_INDEX_TO_FIELD[prayerIndex];
      if (!field) {
        continue;
      }
      const trigger = addMinutes(prayerTimes[field], PRAYER_OFFSET_MIN);
      if (trigger.getTime() <= now.getTime()) {
        continue;
      }

      await scheduleOne({ dateKey, slot: "prayer", prayerIndex, trigger });
      scheduled += 1;
    }
  }

  return scheduled;
}

async function scheduleOne(args: { dateKey: string; slot: VirdSlotKey; prayerIndex: number | null; trigger: Date }): Promise<void> {
  const { dateKey, slot, prayerIndex, trigger } = args;

  await Notifications.scheduleNotificationAsync({
    identifier: buildIdentifier(dateKey, slot, prayerIndex),
    content: {
      title: i18n.t(`vird:reminders.${slot}.title`),
      body: i18n.t(`vird:reminders.${slot}.body`),
      sound: Platform.OS === "ios" ? "default" : undefined,
      data: {
        kind: VIRD_SLOT_REMINDER_KIND,
        route: "/(tabs)/home",
        virdSlot: slot,
        ...(prayerIndex != null ? { virdPrayerIndex: prayerIndex } : {})
      }
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: trigger,
      ...(Platform.OS === "android" ? { channelId: ANDROID_CHANNEL_ID } : {})
    }
  });
}

function buildIdentifier(dateKey: string, slot: VirdSlotKey, prayerIndex: number | null): string {
  return `${VIRD_SLOT_REMINDER_KIND}:${dateKey}:${slot}${prayerIndex != null ? `:${prayerIndex}` : ""}`;
}

function addMinutes(date: Date, minutes: number): Date {
  return new Date(date.getTime() + minutes * 60_000);
}

/** Planlı tüm vird dilim hatırlatmalarını iptal eder (diğer bildirim
 * türlerine dokunmaz — bkz. event-notifications.ts cancelEventNotifications
 * ile aynı desen). reminderPrefs kapatıldığında ya da aktif program/konum
 * kalmadığında da (runSync üzerinden) kullanılır. */
export async function cancelVirdReminders(): Promise<void> {
  const scheduled = await Notifications.getAllScheduledNotificationsAsync();
  const ids = scheduled.filter((item) => item.content?.data?.kind === VIRD_SLOT_REMINDER_KIND).map((item) => item.identifier);

  await Promise.all(ids.map((id) => Notifications.cancelScheduledNotificationAsync(id)));
}

async function ensureNotificationsPermission(requestPermission: boolean): Promise<boolean> {
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

async function ensureAndroidChannel(): Promise<void> {
  if (Platform.OS !== "android") {
    return;
  }
  await Notifications.setNotificationChannelAsync(ANDROID_CHANNEL_ID, {
    name: i18n.t("vird:reminders.channelName"),
    importance: Notifications.AndroidImportance.DEFAULT
  });
}
