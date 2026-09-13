import { beforeEach, describe, expect, it, vi } from "vitest";
import type { VirdDayProgramLike } from "./vird-day";
import type { VirdDayProgressByDate, VirdReminderPrefs } from "../types";

// Namaz vakitleri gerçek astronomik hesaba (adhan) dayandığından, "şu an
// geçmiş mi" karşılaştırmalarının bu testte makineden bağımsız/deterministik
// olması için süreç saat dilimini İstanbul'a sabitliyoruz (bkz.
// prayer-times.ts dosya başı notu: adhan `date`'in YEREL bileşenlerini okur).
// Node bu ortamda process.env.TZ değişikliklerini anlık uygular (doğrulandı).
process.env.TZ = "Europe/Istanbul";

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

vi.mock("../../../i18n", () => ({
  i18n: {
    language: "tr",
    t: (key: string) => key
  }
}));

const getPermissionsAsync = vi.fn();
const requestPermissionsAsync = vi.fn();
const scheduleNotificationAsync = vi.fn();
const getAllScheduledNotificationsAsync = vi.fn();
const cancelScheduledNotificationAsync = vi.fn();
const setNotificationChannelAsync = vi.fn();

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => getPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => requestPermissionsAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => scheduleNotificationAsync(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) => getAllScheduledNotificationsAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) => cancelScheduledNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => setNotificationChannelAsync(...args),
  SchedulableTriggerInputTypes: { DATE: "date" },
  AndroidImportance: { DEFAULT: 3 }
}));

const VIRD_SLOT_REMINDER_KIND = "vird-slot-reminder";

// startDate === "bugün" (2026-01-15) -> dayIndex 1 bugün, 2 yarın; tek
// (routine, açık uçlu) faz her iki gün için de aynı beklenen item'ları verir.
const program: VirdDayProgramLike = {
  startDate: "2026-01-15",
  phases: [
    {
      fromDay: 1,
      toDay: null,
      slots: {
        morning: [{ customDhikrId: "sabah-zikri", target: 33 }],
        prayer: [{ customDhikrId: "vakit-zikri", target: 10 }],
        evening: [{ customDhikrId: "aksam-zikri", target: 33 }],
        night: [{ customDhikrId: "yatsi-zikri", target: 33 }]
      }
    }
  ],
  prayerSelection: [1, 2, 3, 4, 5]
};

const enabledPrefs: VirdReminderPrefs = {
  enabled: true,
  slots: { morning: true, prayer: true, evening: true, night: true },
  provinceKey: "istanbul"
};

// İstanbul, 2026-01-15: fajr ~06:50, dolayısıyla bugünün en erken tetiği
// (prayer:1 = fajr+15) ~07:05 — 00:05 tüm günün tetiklerinden kesin olarak önce.
const wellBeforeAnyTrigger = new Date(2026, 0, 15, 0, 5, 0);

function scheduledIdentifiers(): string[] {
  return scheduleNotificationAsync.mock.calls.map((call) => call[0].identifier as string);
}

describe("syncVirdReminders", () => {
  beforeEach(() => {
    vi.resetModules();
    getPermissionsAsync.mockReset();
    requestPermissionsAsync.mockReset();
    scheduleNotificationAsync.mockReset();
    getAllScheduledNotificationsAsync.mockReset();
    cancelScheduledNotificationAsync.mockReset();
    setNotificationChannelAsync.mockReset();

    getPermissionsAsync.mockResolvedValue({ granted: true });
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    scheduleNotificationAsync.mockResolvedValue("scheduled-id");
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  it("cancels everything and schedules nothing when reminderPrefs.enabled is false", async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "old-vird", content: { data: { kind: VIRD_SLOT_REMINDER_KIND } } }
    ]);

    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program,
      reminderPrefs: { ...enabledPrefs, enabled: false },
      dayProgress: {},
      now: wellBeforeAnyTrigger
    });

    expect(result).toEqual({ scheduled: 0 });
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-vird");
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels everything and schedules nothing when provinceKey is null", async () => {
    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program,
      reminderPrefs: { ...enabledPrefs, provinceKey: null },
      dayProgress: {},
      now: wellBeforeAnyTrigger
    });

    expect(result).toEqual({ scheduled: 0 });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("cancels everything and schedules nothing when there is no active program", async () => {
    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program: null,
      reminderPrefs: enabledPrefs,
      dayProgress: {},
      now: wellBeforeAnyTrigger
    });

    expect(result).toEqual({ scheduled: 0 });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not touch the existing schedule when notification permission is missing", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program,
      reminderPrefs: enabledPrefs,
      dayProgress: {},
      now: wellBeforeAnyTrigger,
      requestPermission: false
    });

    expect(result).toEqual({ scheduled: 0 });
    expect(getAllScheduledNotificationsAsync).not.toHaveBeenCalled();
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled();
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("schedules exactly 16 reminders (5 prayer vakits + 3 slots, x2 days) when nothing is completed and now precedes every trigger", async () => {
    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program,
      reminderPrefs: enabledPrefs,
      dayProgress: {},
      now: wellBeforeAnyTrigger
    });

    expect(result).toEqual({ scheduled: 16 });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(16);

    const ids = scheduledIdentifiers();
    for (const dateKey of ["2026-01-15", "2026-01-16"]) {
      expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:${dateKey}:morning`);
      expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:${dateKey}:evening`);
      expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:${dateKey}:night`);
      for (const prayerIndex of [1, 2, 3, 4, 5]) {
        expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:${dateKey}:prayer:${prayerIndex}`);
      }
    }
  });

  it("attaches the expected notification content/data shape", async () => {
    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    await syncVirdReminders({ program, reminderPrefs: enabledPrefs, dayProgress: {}, now: wellBeforeAnyTrigger });

    const morningCall = scheduleNotificationAsync.mock.calls.find(
      (call) => call[0].identifier === `${VIRD_SLOT_REMINDER_KIND}:2026-01-15:morning`
    );
    expect(morningCall).toBeDefined();
    expect(morningCall![0].content.data).toEqual({
      kind: VIRD_SLOT_REMINDER_KIND,
      route: "/(tabs)/home",
      virdSlot: "morning"
    });
    expect(morningCall![0].trigger.type).toBe("date");

    const prayerCall = scheduleNotificationAsync.mock.calls.find(
      (call) => call[0].identifier === `${VIRD_SLOT_REMINDER_KIND}:2026-01-15:prayer:3`
    );
    expect(prayerCall![0].content.data).toEqual({
      kind: VIRD_SLOT_REMINDER_KIND,
      route: "/(tabs)/home",
      virdSlot: "prayer",
      virdPrayerIndex: 3
    });
  });

  it("skips a slot that is already completed today, but still schedules it for tomorrow", async () => {
    const dayProgress: VirdDayProgressByDate = {
      "2026-01-15": {
        "morning:0:sabah-zikri": { count: 33, target: 33, completed: true }
      }
    };

    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({ program, reminderPrefs: enabledPrefs, dayProgress, now: wellBeforeAnyTrigger });

    expect(result).toEqual({ scheduled: 15 });
    const ids = scheduledIdentifiers();
    expect(ids).not.toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:morning`);
    expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-16:morning`);
  });

  it("skips only the specific prayer vakit that is already completed, not the others", async () => {
    const dayProgress: VirdDayProgressByDate = {
      "2026-01-15": {
        "prayer:2:vakit-zikri": { count: 10, target: 10, completed: true }
      }
    };

    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({ program, reminderPrefs: enabledPrefs, dayProgress, now: wellBeforeAnyTrigger });

    expect(result).toEqual({ scheduled: 15 });
    const ids = scheduledIdentifiers();
    expect(ids).not.toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:prayer:2`);
    expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:prayer:1`);
    expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-16:prayer:2`);
  });

  it("skips only today's already-past trigger (prayer:1, fajr+15) while keeping the rest of today and all of tomorrow", async () => {
    // fajr ~06:50 local -> prayer:1 tetiği ~07:05, morning (fajr+30) ~07:20.
    // 07:10 ikisinin arasında: yalnız prayer:1 geçmişte kalmış olmalı.
    const now = new Date(2026, 0, 15, 7, 10, 0);

    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({ program, reminderPrefs: enabledPrefs, dayProgress: {}, now });

    expect(result).toEqual({ scheduled: 15 });
    const ids = scheduledIdentifiers();
    expect(ids).not.toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:prayer:1`);
    expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:morning`);
    expect(ids).toContain(`${VIRD_SLOT_REMINDER_KIND}:2026-01-16:prayer:1`);
  });

  it("only schedules reminders for slots enabled in reminderPrefs.slots", async () => {
    const { syncVirdReminders } = await import("./vird-reminder-notifications");
    const result = await syncVirdReminders({
      program,
      reminderPrefs: { ...enabledPrefs, slots: { morning: true, prayer: false, evening: false, night: false } },
      dayProgress: {},
      now: wellBeforeAnyTrigger
    });

    expect(result).toEqual({ scheduled: 2 }); // morning x 2 days
    const ids = scheduledIdentifiers();
    expect(ids).toEqual([`${VIRD_SLOT_REMINDER_KIND}:2026-01-15:morning`, `${VIRD_SLOT_REMINDER_KIND}:2026-01-16:morning`]);
  });
});
