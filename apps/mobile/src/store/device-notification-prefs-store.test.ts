import { beforeEach, describe, expect, it } from "vitest";
import { useDeviceNotificationPrefsStore } from "./device-notification-prefs-store";

describe("device-notification-prefs-store", () => {
  beforeEach(() => {
    useDeviceNotificationPrefsStore.setState({ specialDays: false, friday: false });
  });

  it("defaults both prefs to disabled, matching the master notifications toggle's off-by-default state", () => {
    const state = useDeviceNotificationPrefsStore.getState();

    expect(state.specialDays).toBe(false);
    expect(state.friday).toBe(false);
  });

  it("updates specialDays independently of friday", () => {
    useDeviceNotificationPrefsStore.getState().setSpecialDays(true);

    expect(useDeviceNotificationPrefsStore.getState().specialDays).toBe(true);
    expect(useDeviceNotificationPrefsStore.getState().friday).toBe(false);
  });

  it("updates friday independently of specialDays", () => {
    useDeviceNotificationPrefsStore.getState().setFriday(true);

    expect(useDeviceNotificationPrefsStore.getState().friday).toBe(true);
    expect(useDeviceNotificationPrefsStore.getState().specialDays).toBe(false);
  });
});
