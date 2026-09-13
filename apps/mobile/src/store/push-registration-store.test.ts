import { beforeEach, describe, expect, it, vi } from "vitest";
import { usePushRegistrationStore } from "./push-registration-store";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe("push-registration-store", () => {
  beforeEach(() => {
    usePushRegistrationStore.setState({ serverPushActive: false });
  });

  it("defaults serverPushActive to false (conservative: keep local scheduling until confirmed)", () => {
    expect(usePushRegistrationStore.getState().serverPushActive).toBe(false);
  });

  it("flips to true once set", () => {
    usePushRegistrationStore.getState().setServerPushActive(true);

    expect(usePushRegistrationStore.getState().serverPushActive).toBe(true);
  });

  it("flips back to false once set", () => {
    usePushRegistrationStore.getState().setServerPushActive(true);
    usePushRegistrationStore.getState().setServerPushActive(false);

    expect(usePushRegistrationStore.getState().serverPushActive).toBe(false);
  });
});
