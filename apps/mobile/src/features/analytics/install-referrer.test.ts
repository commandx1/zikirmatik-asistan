import AsyncStorage from "@react-native-async-storage/async-storage";
import { beforeEach, describe, expect, it, vi } from "vitest";

const platform = vi.hoisted(() => ({ OS: "android" }));
vi.mock("react-native", () => ({ Platform: platform }));

const getInstallReferrerAsync = vi.fn();
vi.mock("expo-application", () => ({
  getInstallReferrerAsync: () => getInstallReferrerAsync()
}));

const trackEvent = vi.fn();
vi.mock("../../lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args)
}));

const { captureInstallReferrer } = await import("./install-referrer");

beforeEach(() => {
  platform.OS = "android";
  trackEvent.mockClear();
  getInstallReferrerAsync.mockReset();
  vi.mocked(AsyncStorage.getItem).mockReset().mockResolvedValue(null);
  vi.mocked(AsyncStorage.setItem).mockClear();
});

describe("captureInstallReferrer", () => {
  it("android: parsed props only (no raw string / gclid value), sets flag", async () => {
    getInstallReferrerAsync.mockResolvedValue("gclid=ABC123&utm_source=google&utm_medium=cpc");
    await captureInstallReferrer();
    expect(trackEvent).toHaveBeenCalledWith("install_referrer", {
      hasGclid: true,
      source: "google",
      medium: "cpc"
    });
    expect(AsyncStorage.setItem).toHaveBeenCalledTimes(1);
  });

  it("no-op when already sent", async () => {
    vi.mocked(AsyncStorage.getItem).mockResolvedValue("1");
    await captureInstallReferrer();
    expect(getInstallReferrerAsync).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("swallows errors and leaves the flag unset", async () => {
    getInstallReferrerAsync.mockRejectedValue(new Error("no play store"));
    await expect(captureInstallReferrer()).resolves.toBeUndefined();
    expect(trackEvent).not.toHaveBeenCalled();
    expect(AsyncStorage.setItem).not.toHaveBeenCalled();
  });

  it("ios: no-op", async () => {
    platform.OS = "ios";
    await captureInstallReferrer();
    expect(getInstallReferrerAsync).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });
});
