import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
      return Promise.resolve();
    })
  }
}));

vi.mock("expo-crypto", () => ({
  randomUUID: vi.fn(() => "generated-uuid-1234")
}));

// push-device-registration.ts (which this service reuses for deviceId +
// platform) also imports expo-notifications and expo-constants; without
// mocks the real packages load expo-modules-core, which needs React
// Native's __DEV__ global that isn't defined under vitest.
vi.mock("expo-notifications", () => ({
  getPermissionsAsync: vi.fn(),
  requestPermissionsAsync: vi.fn(),
  getExpoPushTokenAsync: vi.fn()
}));

vi.mock("expo-constants", () => ({
  default: { expoConfig: { extra: { eas: { projectId: "test-project-id" } } } }
}));

const registerDevice = vi.fn();

vi.mock("./devices-api-client", () => ({
  registerDevice: (...args: unknown[]) => registerDevice(...args)
}));

describe("update-device-prefs", () => {
  beforeEach(() => {
    storage.clear();
    vi.resetModules();
    registerDevice.mockReset();
  });

  it("registers the device-scoped prefs update without touching the push token", async () => {
    registerDevice.mockResolvedValue(undefined);

    const { updateDevicePrefs } = await import("./update-device-prefs");
    await updateDevicePrefs({ specialDays: false });

    expect(registerDevice).toHaveBeenCalledWith(
      { deviceId: "generated-uuid-1234", platform: "ios", prefs: { specialDays: false } },
      undefined
    );
  });

  it("forwards the access token for authenticated users", async () => {
    registerDevice.mockResolvedValue(undefined);

    const { updateDevicePrefs } = await import("./update-device-prefs");
    await updateDevicePrefs({ friday: true }, "access-token-123");

    expect(registerDevice).toHaveBeenCalledWith(
      { deviceId: "generated-uuid-1234", platform: "ios", prefs: { friday: true } },
      "access-token-123"
    );
  });

  it("propagates a failed update so callers can revert optimistic state", async () => {
    registerDevice.mockRejectedValue(new Error("network"));

    const { updateDevicePrefs } = await import("./update-device-prefs");

    await expect(updateDevicePrefs({ specialDays: true })).rejects.toThrow("network");
  });
});
