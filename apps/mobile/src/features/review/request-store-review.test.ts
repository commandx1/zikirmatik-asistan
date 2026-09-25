import { beforeEach, describe, expect, it, vi } from "vitest";

// AsyncStorage is mocked globally in src/test/setup.ts (getItem resolves to
// `null`, matching zustand persist hydration's expectations).
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
