import { beforeEach, describe, expect, it, vi } from "vitest";

const requestNotificationPermissionForToggle = vi.fn();
const updateDevicePrefs = vi.fn();
const saveUserPreferences = vi.fn();
const syncDailyReminderNotification = vi.fn();

vi.mock("../../notifications/services/request-notification-permission", () => ({
  requestNotificationPermissionForToggle: (...args: unknown[]) =>
    requestNotificationPermissionForToggle(...args)
}));

vi.mock("../../notifications/services/update-device-prefs", () => ({
  updateDevicePrefs: (...args: unknown[]) => updateDevicePrefs(...args)
}));

vi.mock("../../users/services/users-api-client", () => ({
  saveUserPreferences: (...args: unknown[]) => saveUserPreferences(...args)
}));

vi.mock("./daily-reminder-notifications", () => ({
  syncDailyReminderNotification: (...args: unknown[]) => syncDailyReminderNotification(...args)
}));

vi.mock("../../../i18n", () => ({
  i18n: { t: (key: string) => (key === "profile:errors.pushPrefsUpdateFailed" ? "Bildirim tercihi güncellenemedi. Lütfen tekrar dene." : key) }
}));

describe("runNotificationSettingsToggle", () => {
  beforeEach(() => {
    vi.resetModules();
    requestNotificationPermissionForToggle.mockReset();
    updateDevicePrefs.mockReset();
    saveUserPreferences.mockReset();
    syncDailyReminderNotification.mockReset();
  });

  it("turning on: requests permission first, then enables every surface and persists", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(true);
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: true });
    saveUserPreferences.mockResolvedValue(undefined);
    updateDevicePrefs.mockResolvedValue(undefined);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setAll = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      userId: "user-1",
      accessToken: "token-1",
      setAll,
      onError
    });

    expect(requestNotificationPermissionForToggle).toHaveBeenCalledTimes(1);
    expect(setAll).toHaveBeenCalledWith(true);
    expect(setAll).toHaveBeenCalledTimes(1);
    expect(syncDailyReminderNotification).toHaveBeenCalledWith({
      enabled: true,
      reminderTime: "08:00",
      requestPermission: false
    });
    expect(saveUserPreferences).toHaveBeenCalledWith(
      "user-1",
      { dailyReminder: true, reminderTime: "08:00" },
      "token-1"
    );
    expect(updateDevicePrefs).toHaveBeenCalledWith({ specialDays: true, friday: true }, "token-1");
    expect(onError).not.toHaveBeenCalled();
  });

  it("turning on: permission denied leaves every surface untouched", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(false);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setAll = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      setAll,
      onError
    });

    expect(setAll).not.toHaveBeenCalled();
    expect(syncDailyReminderNotification).not.toHaveBeenCalled();
    expect(updateDevicePrefs).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });

  it("turning off: never requests permission, disables every surface immediately, and cancels the schedule", async () => {
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: false });
    updateDevicePrefs.mockResolvedValue(undefined);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setAll = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: false,
      reminderTime: "08:00",
      setAll,
      onError
    });

    expect(requestNotificationPermissionForToggle).not.toHaveBeenCalled();
    expect(setAll).toHaveBeenCalledWith(false);
    expect(setAll).toHaveBeenCalledTimes(1);
    expect(syncDailyReminderNotification).toHaveBeenCalledWith({
      enabled: false,
      reminderTime: "08:00",
      requestPermission: false
    });
    expect(updateDevicePrefs).toHaveBeenCalledWith({ specialDays: false, friday: false }, undefined);
    expect(onError).not.toHaveBeenCalled();
  });

  it("does not persist the daily reminder preference for guests", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(true);
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: true });
    updateDevicePrefs.mockResolvedValue(undefined);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      setAll: vi.fn(),
      onError: vi.fn()
    });

    expect(saveUserPreferences).not.toHaveBeenCalled();
    expect(updateDevicePrefs).toHaveBeenCalledWith({ specialDays: true, friday: true }, undefined);
  });

  it("backend failure while turning on reverts every surface and reports a Turkish error", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(true);
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: true });
    updateDevicePrefs.mockRejectedValue(new Error("network"));

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setAll = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      setAll,
      onError
    });

    expect(setAll).toHaveBeenNthCalledWith(1, true);
    expect(setAll).toHaveBeenNthCalledWith(2, false);
    expect(onError).toHaveBeenCalledWith("Bildirim tercihi güncellenemedi. Lütfen tekrar dene.");
  });

  it("backend failure while turning off reverts every surface back on and reports a Turkish error", async () => {
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: false });
    updateDevicePrefs.mockRejectedValue(new Error("network"));

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setAll = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: false,
      reminderTime: "08:00",
      setAll,
      onError
    });

    expect(setAll).toHaveBeenNthCalledWith(1, false);
    expect(setAll).toHaveBeenNthCalledWith(2, true);
    expect(onError).toHaveBeenCalledWith("Bildirim tercihi güncellenemedi. Lütfen tekrar dene.");
  });

  // Onboarding (features/tour/hooks/use-tour-notification-opt-in.ts) drives
  // this same function with a `setAll` that fans out to all four local
  // stores (daily esma reminder, streak reminder, special days, Friday) —
  // mirroring the profile screen's master toggle exactly so a grant during
  // onboarding is never partial.
  it("onboarding-style four-way setAll: granting turns every surface on", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(true);
    syncDailyReminderNotification.mockResolvedValue({ permissionGranted: true, scheduled: true });
    saveUserPreferences.mockResolvedValue(undefined);
    updateDevicePrefs.mockResolvedValue(undefined);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setDailyReminderEnabled = vi.fn();
    const setStreakReminderEnabled = vi.fn();
    const setSpecialDays = vi.fn();
    const setFriday = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      userId: "user-1",
      accessToken: "token-1",
      setAll: (value) => {
        setDailyReminderEnabled(value);
        setStreakReminderEnabled(value);
        setSpecialDays(value);
        setFriday(value);
      },
      onError
    });

    expect(setDailyReminderEnabled).toHaveBeenCalledWith(true);
    expect(setStreakReminderEnabled).toHaveBeenCalledWith(true);
    expect(setSpecialDays).toHaveBeenCalledWith(true);
    expect(setFriday).toHaveBeenCalledWith(true);
    expect(updateDevicePrefs).toHaveBeenCalledWith({ specialDays: true, friday: true }, "token-1");
    expect(saveUserPreferences).toHaveBeenCalledWith(
      "user-1",
      { dailyReminder: true, reminderTime: "08:00" },
      "token-1"
    );
    expect(onError).not.toHaveBeenCalled();
  });

  it("onboarding-style four-way setAll: denying permission leaves every surface off", async () => {
    requestNotificationPermissionForToggle.mockResolvedValue(false);

    const { runNotificationSettingsToggle } = await import("./sync-notification-settings");
    const setDailyReminderEnabled = vi.fn();
    const setStreakReminderEnabled = vi.fn();
    const setSpecialDays = vi.fn();
    const setFriday = vi.fn();
    const onError = vi.fn();

    await runNotificationSettingsToggle({
      enabled: true,
      reminderTime: "08:00",
      setAll: (value) => {
        setDailyReminderEnabled(value);
        setStreakReminderEnabled(value);
        setSpecialDays(value);
        setFriday(value);
      },
      onError
    });

    expect(setDailyReminderEnabled).not.toHaveBeenCalled();
    expect(setStreakReminderEnabled).not.toHaveBeenCalled();
    expect(setSpecialDays).not.toHaveBeenCalled();
    expect(setFriday).not.toHaveBeenCalled();
    expect(updateDevicePrefs).not.toHaveBeenCalled();
    expect(saveUserPreferences).not.toHaveBeenCalled();
    expect(onError).not.toHaveBeenCalled();
  });
});
