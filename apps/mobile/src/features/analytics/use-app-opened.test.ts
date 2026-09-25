import { describe, expect, it, vi } from "vitest";

let appStateListeners: Array<(state: string) => void> = [];

vi.mock("react-native", () => ({
  AppState: {
    addEventListener: vi.fn((_event: string, listener: (state: string) => void) => {
      appStateListeners.push(listener);
      return {
        remove: vi.fn(() => {
          appStateListeners = appStateListeners.filter((entry) => entry !== listener);
        })
      };
    })
  }
}));

const trackEvent = vi.fn();
vi.mock("../../lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args)
}));

const { attachAppOpenedListener } = await import("./use-app-opened");

describe("attachAppOpenedListener", () => {
  it("emits app_opened once on attach (cold start) and again on each resume", () => {
    appStateListeners = [];
    trackEvent.mockClear();

    const detach = attachAppOpenedListener();
    expect(trackEvent).toHaveBeenCalledTimes(1);
    expect(trackEvent).toHaveBeenCalledWith("app_opened");

    expect(appStateListeners).toHaveLength(1);
    appStateListeners[0]!("background");
    expect(trackEvent).toHaveBeenCalledTimes(1);

    appStateListeners[0]!("active");
    expect(trackEvent).toHaveBeenCalledTimes(2);

    appStateListeners[0]!("background");
    appStateListeners[0]!("active");
    expect(trackEvent).toHaveBeenCalledTimes(3);

    detach();
  });
});
