import { beforeEach, describe, expect, it } from "vitest";
import { useAppConfigStore } from "./app-config-store";

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
