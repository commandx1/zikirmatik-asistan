import { beforeEach, describe, expect, it, vi } from "vitest";

// Overrides the global setup.ts stub (bare vi.fn(), which resolves to
// `undefined`): zustand's persist hydration does `JSON.parse` on whatever
// getItem resolves to unless it is exactly `null`, so `undefined` makes
// hydration throw internally and never call onFinishHydration/hasHydrated
// — hanging awaitHydration() in request-store-review.ts forever. Real
// AsyncStorage resolves missing keys to `null`, matching this mock.
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: vi.fn(async () => null), setItem: vi.fn(), removeItem: vi.fn() }
}));

const { useReviewStore } = await import("../../store/review-store");

const isAvailableAsync = vi.fn();
const requestReview = vi.fn();

vi.mock("expo-store-review", () => ({
  isAvailableAsync: (...args: unknown[]) => isAvailableAsync(...args),
  requestReview: (...args: unknown[]) => requestReview(...args)
}));

const trackEvent = vi.fn();

vi.mock("../../lib/analytics", () => ({
  trackEvent: (...args: unknown[]) => trackEvent(...args)
}));

import { maybeRequestStoreReview } from "./request-store-review";

describe("maybeRequestStoreReview", () => {
  beforeEach(() => {
    useReviewStore.setState({ reviewRequestedAt: null });
    isAvailableAsync.mockReset();
    requestReview.mockReset();
    trackEvent.mockReset();
  });

  it("skips when already requested", async () => {
    useReviewStore.setState({ reviewRequestedAt: "2026-01-01T00:00:00.000Z" });

    await maybeRequestStoreReview("streak_7");

    expect(isAvailableAsync).not.toHaveBeenCalled();
    expect(requestReview).not.toHaveBeenCalled();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("skips when unavailable", async () => {
    isAvailableAsync.mockResolvedValue(false);

    await maybeRequestStoreReview("vird_day");

    expect(requestReview).not.toHaveBeenCalled();
    expect(useReviewStore.getState().reviewRequestedAt).toBeNull();
    expect(trackEvent).not.toHaveBeenCalled();
  });

  it("requests, persists and tracks when available", async () => {
    isAvailableAsync.mockResolvedValue(true);
    requestReview.mockResolvedValue(undefined);

    await maybeRequestStoreReview("circle_goal");

    expect(requestReview).toHaveBeenCalledTimes(1);
    expect(useReviewStore.getState().reviewRequestedAt).not.toBeNull();
    expect(trackEvent).toHaveBeenCalledWith("review_prompted", { trigger: "circle_goal" });
  });

  it("shares one in-flight request between two concurrent triggers", async () => {
    let resolveAvailable!: (value: boolean) => void;
    isAvailableAsync.mockImplementation(
      () =>
        new Promise<boolean>((resolve) => {
          resolveAvailable = resolve;
        })
    );
    requestReview.mockResolvedValue(undefined);

    const first = maybeRequestStoreReview("streak_7");
    const second = maybeRequestStoreReview("vird_day");

    // Let both calls run past hydration up to the isAvailableAsync call
    // (a macrotask hop clears every microtask in between) before resolving.
    await new Promise((resolve) => setTimeout(resolve, 0));
    resolveAvailable(true);
    await Promise.all([first, second]);

    expect(isAvailableAsync).toHaveBeenCalledTimes(1);
    expect(requestReview).toHaveBeenCalledTimes(1);
  });

  it("never throws when the OS call fails", async () => {
    isAvailableAsync.mockResolvedValue(true);
    requestReview.mockRejectedValue(new Error("boom"));

    await expect(maybeRequestStoreReview("streak_7")).resolves.toBeUndefined();
    expect(useReviewStore.getState().reviewRequestedAt).toBeNull();
  });
});
