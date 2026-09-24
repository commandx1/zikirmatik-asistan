import { beforeEach, describe, expect, it } from "vitest";
import { usePushRegistrationStore } from "./push-registration-store";

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
