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

vi.mock("expo-constants", () => ({
  default: { expoConfig: { extra: { eas: { projectId: "test-project-id" } } } }
}));

const getPermissionsAsync = vi.fn();
const requestPermissionsAsync = vi.fn();
const getExpoPushTokenAsync = vi.fn();

vi.mock("expo-notifications", () => ({
  getPermissionsAsync: (...args: unknown[]) => getPermissionsAsync(...args),
  requestPermissionsAsync: (...args: unknown[]) => requestPermissionsAsync(...args),
  getExpoPushTokenAsync: (...args: unknown[]) => getExpoPushTokenAsync(...args)
}));

const registerDevice = vi.fn();
const unlinkDevice = vi.fn();

vi.mock("./devices-api-client", () => ({
  registerDevice: (...args: unknown[]) => registerDevice(...args),
  unlinkDevice: (...args: unknown[]) => unlinkDevice(...args)
}));

describe("push-device-registration", () => {
  beforeEach(() => {
    storage.clear();
    vi.resetModules();
    getPermissionsAsync.mockReset();
    requestPermissionsAsync.mockReset();
    getExpoPushTokenAsync.mockReset();
    registerDevice.mockReset();
    unlinkDevice.mockReset();
  });

  it("generates a device id once and persists it across calls", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });

    const { getOrCreateDeviceId } = await import("./push-device-registration");

    const first = await getOrCreateDeviceId();
    const second = await getOrCreateDeviceId();

    expect(first).toBe("generated-uuid-1234");
    expect(second).toBe("generated-uuid-1234");
    expect(storage.get("push-device-id-v1")).toBe("generated-uuid-1234");
  });

  it("registers the device with a push token when permission is already granted", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: true, canAskAgain: true });
    getExpoPushTokenAsync.mockResolvedValue({ data: "ExponentPushToken[abc]" });
    registerDevice.mockResolvedValue(undefined);

    const { registerPushDevice } = await import("./push-device-registration");

    await registerPushDevice("access-token-123");

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(registerDevice).toHaveBeenCalledWith(
      {
        deviceId: "generated-uuid-1234",
        expoPushToken: "ExponentPushToken[abc]",
        platform: "ios"
      },
      "access-token-123"
    );
  });

  it("prompts for permission at most once when previously undetermined", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: true });
    requestPermissionsAsync.mockResolvedValue({ granted: false });
    registerDevice.mockResolvedValue(undefined);

    const { registerPushDevice } = await import("./push-device-registration");

    await registerPushDevice();
    await registerPushDevice();

    expect(requestPermissionsAsync).toHaveBeenCalledTimes(1);
    expect(getExpoPushTokenAsync).not.toHaveBeenCalled();
    expect(registerDevice).toHaveBeenNthCalledWith(
      1,
      {
        deviceId: "generated-uuid-1234",
        expoPushToken: undefined,
        platform: "ios"
      },
      undefined
    );
  });

  it("never re-prompts once permission was permanently denied", async () => {
    getPermissionsAsync.mockResolvedValue({ granted: false, canAskAgain: false });
    registerDevice.mockResolvedValue(undefined);

    const { registerPushDevice } = await import("./push-device-registration");

    await registerPushDevice();

    expect(requestPermissionsAsync).not.toHaveBeenCalled();
    expect(registerDevice).toHaveBeenCalledWith(
      {
        deviceId: "generated-uuid-1234",
        expoPushToken: undefined,
        platform: "ios"
      },
      undefined
    );
  });

  it("unlinks the persisted device id on logout", async () => {
    unlinkDevice.mockResolvedValue(undefined);

    const { getOrCreateDeviceId, unlinkPushDevice } = await import("./push-device-registration");
    const deviceId = await getOrCreateDeviceId();
    await unlinkPushDevice();

    expect(unlinkDevice).toHaveBeenCalledWith(deviceId);
  });
});
