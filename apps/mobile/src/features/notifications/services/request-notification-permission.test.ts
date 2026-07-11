import { beforeEach, describe, expect, it, vi } from "vitest";

const getPermissionsAsync = vi.fn();
const requestPermissionsAsync = vi.fn();

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => getPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => requestPermissionsAsync(...args)
}));

describe("requestNotificationPermissionForToggle", () => {
  beforeEach(() => {
    vi.resetModules();
    getPermissionsAsync.mockReset();
    requestPermissionsAsync.mockReset();
  });

  it("resolves true immediately when permission is already granted, without prompting", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });

    const { requestNotificationPermissionForToggle } = await import("./request-notification-permission");
    const { useNotificationPromptStore } = await import("../../../store/notification-prompt-store");

    const granted = await requestNotificationPermissionForToggle();

    expect(granted).toBe(true);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(useNotificationPromptStore.getState().visible).toBe(false);
  });

  it("shows the denied prompt (not the ask modal) when the OS won't re-ask", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    const { requestNotificationPermissionForToggle } = await import("./request-notification-permission");
    const { useNotificationPromptStore } = await import("../../../store/notification-prompt-store");

    const granted = await requestNotificationPermissionForToggle();

    expect(granted).toBe(false);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(useNotificationPromptStore.getState().deniedVisible).toBe(true);
  });

  it("requests OS permission after the user confirms the custom prompt", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    requestPermissionsAsync.mockResolvedValue({ granted: true });

    const { requestNotificationPermissionForToggle } = await import("./request-notification-permission");
    const { useNotificationPromptStore } = await import("../../../store/notification-prompt-store");

    const resultPromise = requestNotificationPermissionForToggle();
    // Wait a microtask so the store's `request()` has registered its resolver.
    await Promise.resolve();
    await Promise.resolve();
    useNotificationPromptStore.getState().confirm();

    const granted = await resultPromise;

    expect(granted).toBe(true);
    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
  });

  it("returns false without requesting OS permission when the user dismisses the custom prompt", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });

    const { requestNotificationPermissionForToggle } = await import("./request-notification-permission");
    const { useNotificationPromptStore } = await import("../../../store/notification-prompt-store");

    const resultPromise = requestNotificationPermissionForToggle();
    await Promise.resolve();
    await Promise.resolve();
    useNotificationPromptStore.getState().dismiss();

    const granted = await resultPromise;

    expect(granted).toBe(false);
    expect(requestPermissionsAsync).not.toHaveBeenCalled();
  });
});
