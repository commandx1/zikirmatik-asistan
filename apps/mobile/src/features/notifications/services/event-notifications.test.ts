import { beforeEach, describe, expect, it, vi } from "vitest";

// Kept small and fixed so this test never drifts when the real (frequently
// updated) dataset changes — see data/special-days-dataset.ts's own comment
// about yearly updates.
vi.mock("../data/special-days-dataset", () => ({
  SPECIAL_DAY_NOTIFICATIONS: [
    {
      id: "test-kandil-1",
      date: "2026-09-20",
      type: "kandil",
      name: { tr: "Test Kandili", en: "Test Kandil" }
    },
    {
      id: "test-ozel-gun-1",
      date: "2026-09-25",
      type: "özel gün",
      name: { tr: "Test Özel Gün", en: "Test Special Day" }
    }
  ]
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
  getAllScheduledNotificationsAsync: (...args: unknown[]) =>
    getAllScheduledNotificationsAsync(...args),
  cancelScheduledNotificationAsync: (...args: unknown[]) =>
    cancelScheduledNotificationAsync(...args),
  setNotificationChannelAsync: (...args: unknown[]) => setNotificationChannelAsync(...args),
  SchedulableTriggerInputTypes: { WEEKLY: "weekly", DATE: "date" },
  AndroidImportance: { DEFAULT: 3 },
  AndroidNotificationVisibility: { PUBLIC: 1 }
}));

// Mirrors the private FRIDAY_KIND / SPECIAL_DAY_KIND constants in
// event-notifications.ts (not exported — these tests assert on the wire
// shape expo-notifications receives, not on internal identifiers).
const FRIDAY_KIND = "friday-reminder";
const SPECIAL_DAY_KIND = "special-day-reminder";

// Before both fixture dates (2026-09-20, 2026-09-25) so both are "upcoming".
const now = new Date(2026, 8, 1, 8, 0, 0);

describe("syncEventNotifications", () => {
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

  it("does not touch scheduling when permission is missing (existing behavior)", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    const { syncEventNotifications } = await import("./event-notifications");
    const result = await syncEventNotifications({ requestPermission: false, now });

    expect(result).toEqual({ permissionGranted: false, fridayScheduled: false, specialDaysScheduled: 0 });
    expect(scheduleNotificationAsync).not.toHaveBeenCalled();
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalled();
  });

  it("schedules Friday + special days when serverPushActive is omitted (existing behavior)", async () => {
    const { syncEventNotifications } = await import("./event-notifications");
    const result = await syncEventNotifications({ requestPermission: false, now });

    expect(result.permissionGranted).toBe(true);
    expect(result.fridayScheduled).toBe(true);
    expect(result.specialDaysScheduled).toBe(2);

    const kinds = scheduleNotificationAsync.mock.calls.map((call) => call[0].content.data.kind);
    expect(kinds).toEqual([FRIDAY_KIND, SPECIAL_DAY_KIND, SPECIAL_DAY_KIND]);
  });

  it("schedules Friday + special days when serverPushActive is false (existing behavior)", async () => {
    const { syncEventNotifications } = await import("./event-notifications");
    const result = await syncEventNotifications({ requestPermission: false, now, serverPushActive: false });

    expect(result.specialDaysScheduled).toBe(2);
    const kinds = scheduleNotificationAsync.mock.calls.map((call) => call[0].content.data.kind);
    expect(kinds.filter((kind) => kind === SPECIAL_DAY_KIND)).toHaveLength(2);
  });

  it("skips special-day scheduling and cancels existing ones when serverPushActive is true", async () => {
    getAllScheduledNotificationsAsync.mockResolvedValue([
      { identifier: "old-special-1", content: { data: { kind: SPECIAL_DAY_KIND } } },
      { identifier: "old-friday", content: { data: { kind: FRIDAY_KIND } } },
      { identifier: "unrelated-daily", content: { data: { kind: "daily-reminder" } } }
    ]);

    const { syncEventNotifications } = await import("./event-notifications");
    const result = await syncEventNotifications({ requestPermission: false, now, serverPushActive: true });

    expect(result).toEqual({ permissionGranted: true, fridayScheduled: true, specialDaysScheduled: 0 });

    // Existing special-day (and friday) notifications get cancelled...
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-special-1");
    expect(cancelScheduledNotificationAsync).toHaveBeenCalledWith("old-friday");
    expect(cancelScheduledNotificationAsync).not.toHaveBeenCalledWith("unrelated-daily");

    // ...and no new special-day notification is scheduled, only Friday.
    const scheduledKinds = scheduleNotificationAsync.mock.calls.map((call) => call[0].content.data.kind);
    expect(scheduledKinds).toEqual([FRIDAY_KIND]);
  });

  it("still schedules the Friday reminder when serverPushActive is true", async () => {
    const { syncEventNotifications } = await import("./event-notifications");
    await syncEventNotifications({ requestPermission: false, now, serverPushActive: true });

    expect(scheduleNotificationAsync).toHaveBeenCalledTimes(1);
    expect(scheduleNotificationAsync.mock.calls[0]![0].content.data).toEqual({ kind: FRIDAY_KIND });
  });
});

describe("resolveServerPushActive", () => {
  it("is false when the device is not registered, even if the rollout flag is on", async () => {
    const { resolveServerPushActive } = await import("./event-notifications");
    expect(resolveServerPushActive(false, true)).toBe(false);
  });

  it("is false when registered but the rollout flag is off (default / not rolled out yet)", async () => {
    const { resolveServerPushActive } = await import("./event-notifications");
    expect(resolveServerPushActive(true, false)).toBe(false);
  });

  it("is false when neither registered nor enabled", async () => {
    const { resolveServerPushActive } = await import("./event-notifications");
    expect(resolveServerPushActive(false, false)).toBe(false);
  });

  it("is true only once both registered and enabled", async () => {
    const { resolveServerPushActive } = await import("./event-notifications");
    expect(resolveServerPushActive(true, true)).toBe(true);
  });
});
