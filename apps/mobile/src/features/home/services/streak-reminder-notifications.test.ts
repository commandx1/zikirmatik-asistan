import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string, options?: Record<string, unknown>) => {
      if (key === "home:streakReminder.title") return "Streak'in seni bekliyor 🔥";
      if (key === "home:streakReminder.body") return `${options?.streak} günlük serin bitmesin, bir zikir yeter.`;
      if (key === "home:streakReminder.channelName") return "Seri Hatırlatması";
      return key;
    }
  }
}));

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

const getPermissionsAsync = vi.fn();
const scheduleNotificationAsync = vi.fn();
const getAllScheduledNotificationsAsync = vi.fn();
const cancelScheduledNotificationAsync = vi.fn();
const setNotificationChannelAsync = vi.fn();

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => getPermissionsAsync(...args),
  scheduleNotificationAsync: (...args: unknown[]) => scheduleNotificationAsync(...args),
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    getAllScheduledNotificationsAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    cancelScheduledNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => setNotificationChannelAsync(...args),
  SchedulableTriggerInputTypes: { DATE: "date" },
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 }
}));

import {
  STREAK_REMINDER_KIND,
  STREAK_REMINDER_ROUTE,
  deriveStreakReminderStatus,
  resolveNextReminderDate,
  syncStreakReminderNotification
} from "./streak-reminder-notifications";

// Fixed local-time anchors: a Thursday at 10:00 and at 22:00.
const morning = new Date(2026, 0, 15, 10, 0, 0);
const evening = new Date(2026, 0, 15, 22, 0, 0);

describe("deriveStreakReminderStatus", () => {
  it("reports no streak when there is no activity", () => {
    expect(deriveStreakReminderStatus([], 0, morning)).toEqual({
      currentStreak: 0,
      hasCompletedToday: false
    });
  });

  it("counts label-based activity the same way as the stats summary", () => {
    const status = deriveStreakReminderStatus(
      [
        { current: 33, lastActivityLabel: "Dün 21:12" },
        { current: 10, lastActivityLabel: "Bugün 09:30" }
      ],
      0,
      morning
    );

    expect(status).toEqual({ currentStreak: 2, hasCompletedToday: true });
  });

  it("keeps yesterday's streak alive without marking today complete", () => {
    const status = deriveStreakReminderStatus(
      [{ current: 33, lastActivityLabel: "Dün 21:12" }],
      0,
      morning
    );

    expect(status).toEqual({ currentStreak: 1, hasCompletedToday: false });
  });

  it("treats free-mode counts and unlabeled progress as today", () => {
    expect(deriveStreakReminderStatus([], 5, morning)).toEqual({
      currentStreak: 1,
      hasCompletedToday: true
    });
    expect(deriveStreakReminderStatus([{ current: 3 }], 0, morning)).toEqual({
      currentStreak: 1,
      hasCompletedToday: true
    });
  });

  it("parses absolute date labels", () => {
    const status = deriveStreakReminderStatus(
      [{ current: 33, lastActivityLabel: "14.1.2026 08:00" }],
      0,
      morning
    );

    expect(status).toEqual({ currentStreak: 1, hasCompletedToday: false });
  });
});

describe("resolveNextReminderDate", () => {
  it("targets today 21:00 when today is incomplete and 21:00 has not passed", () => {
    const date = resolveNextReminderDate({ hasCompletedToday: false }, morning);

    expect(date).toEqual(new Date(2026, 0, 15, 21, 0, 0, 0));
  });

  it("targets tomorrow 21:00 when today is already complete", () => {
    const date = resolveNextReminderDate({ hasCompletedToday: true }, morning);

    expect(date).toEqual(new Date(2026, 0, 16, 21, 0, 0, 0));
  });

  it("targets tomorrow 21:00 when 21:00 already passed", () => {
    const date = resolveNextReminderDate({ hasCompletedToday: false }, evening);

    expect(date).toEqual(new Date(2026, 0, 16, 21, 0, 0, 0));
  });
});

describe("syncStreakReminderNotification", () => {
  beforeEach(() => {
    getPermissionsAsync.mockReset();
    scheduleNotificationAsync.mockReset();
    getAllScheduledNotificationsAsync.mockReset();
    cancelScheduledNotificationAsync.mockReset();
    setNotificationChannelAsync.mockReset();

    getPermissionsAsync.mockResolvedValue({ granted: true });
    getAllScheduledNotificationsAsync.mockResolvedValue([]);
    scheduleNotificationAsync.mockResolvedValue("scheduled-id");
    cancelScheduledNotificationAsync.mockResolvedValue(undefined);
  });

  it("schedules a one-shot reminder for today 21:00 with the tap route", async () => {
    const result = await syncStreakReminderNotification({
      enabled: true,
      status: { currentStreak: 3, hasCompletedToday: false },
      now: morning
    });

    expect(result).toEqual({ permissionGranted: true, scheduled: true });
    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    const input = scheduleNotificationAsync.mock.calls[0][0];
    expect(input.content.data).toEqual({
      kind: STREAK_REMINDER_KIND,
      route: STREAK_REMINDER_ROUTE
    });
    expect(input.content.body).toContain("3");
    expect(input.trigger).toMatchObject({
      type: "date",
      date: new Date(2026, 0, 15, 21, 0, 0, 0)
    });
  });

  it("reschedules for tomorrow once today is completed", async () => {
    await syncStreakReminderNotification({
      enabled: true,
      status: { currentStreak: 3, hasCompletedToday: true },
      now: morning
    });

    const input = scheduleNotificationAsync.mock.calls[0][0];
    expect(input.trigger.date).toEqual(new Date(2026, 0, 16, 21, 0, 0, 0));
  });

  it("cancels only its own pending reminders before scheduling", async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "mine", content: { data: { kind: STREAK_REMINDER_KIND } } },
      { identifier: "daily", content: { data: { kind: "daily-reminder" } } }
    ]);

    await syncStreakReminderNotification({
      enabled: true,
      status: { currentStreak: 1, hasCompletedToday: false },
      now: morning
    });

    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("mine");
  });

  it("removes pending reminders when disabled or when there is no streak", async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "mine", content: { data: { kind: STREAK_REMINDER_KIND } } }
    ]);

    const disabled = await syncStreakReminderNotification({
      enabled: false,
      status: { currentStreak: 3, hasCompletedToday: false },
      now: morning
    });
    const noStreak = await syncStreakReminderNotification({
      enabled: true,
      status: { currentStreak: 0, hasCompletedToday: false },
      now: morning
    });

    expect(disabled).toEqual({ permissionGranted: true, scheduled: false });
    expect(noStreak).toEqual({ permissionGranted: true, scheduled: false });
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledTimes(2);
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });

  it("does not schedule or prompt when permission is missing", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    const result = await syncStreakReminderNotification({
      enabled: true,
      status: { currentStreak: 3, hasCompletedToday: false },
      now: morning
    });

    expect(result).toEqual({ permissionGranted: false, scheduled: false });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
  });
});
