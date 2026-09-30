import { beforeEach, describe, expect, it, vi } from "vitest";

const state = { language: "en" };

vi.mock("react-native", () => ({ Platform: { OS: "android" } }));

vi.mock("../../../i18n", () => ({
  getAppLocale: () => state.language,
  i18n: {
    t: (key: string) =>
      key === "notifications:dailyReminder.channelName"
        ? state.language === "en"
          ? "Daily Reminder"
          : "Günlük Hatırlatma"
        : key
  }
}));

const setNotificationChannelAsync = vi.fn();
const getAllScheduledNotificationsAsync = vi.fn();

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn(async () => ({ granted: true })),
  scheduleNotificationAsync: vi.fn(),
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    getAllScheduledNotificationsAsync(...args),
  cancelScheduledNotificationAsync: vi.fn(),
  setNotificationChannelAsync: (...args: unknown[]) => setNotificationChannelAsync(...args),
  SchedulableTriggerInputTypes: { WEEKLY: "weekly" },
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 }
}));

import { syncDailyReminderNotification } from "./daily-reminder-notifications";

describe("syncDailyReminderNotification channel", () => {
  beforeEach(() => {
    setNotificationChannelAsync.mockReset();
    getAllScheduledNotificationsAsync.mockReset().mockResolvedValue([]);
  });

  it.each([true, false])("refreshes the localized channel name under en (enabled=%s)", async (enabled) => {
    state.language = "en";
    try {
      await syncDailyReminderNotification({ enabled, reminderTime: "08:00" });
    } finally {
      state.language = "tr";
    }

    expect(setNotificationChannelAsync).toHaveBeenCalledWith(
      "daily-reminders",
      expect.objectContaining({ name: "Daily Reminder" })
    );
  });
});
