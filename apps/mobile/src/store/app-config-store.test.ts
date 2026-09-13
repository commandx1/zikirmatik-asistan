import { beforeEach, describe, expect, it, vi } from "vitest";
import { useAppConfigStore } from "./app-config-store";

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn()
  }
}));

describe("app-config-store", () => {
  beforeEach(() => {
    useAppConfigStore.setState({ serverPushEnabled: false });
  });

  it("defaults serverPushEnabled to false (server push rollout is off until the API says otherwise)", () => {
    expect(useAppConfigStore.getState().serverPushEnabled).toBe(false);
  });

  it("flips to true once set", () => {
    useAppConfigStore.getState().setServerPushEnabled(true);

    expect(useAppConfigStore.getState().serverPushEnabled).toBe(true);
  });

  it("flips back to false once set", () => {
    useAppConfigStore.getState().setServerPushEnabled(true);
    useAppConfigStore.getState().setServerPushEnabled(false);

    expect(useAppConfigStore.getState().serverPushEnabled).toBe(false);
  });
});
