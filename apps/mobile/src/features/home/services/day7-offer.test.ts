import { describe, expect, it } from "vitest";
import { shouldShowDay7Offer } from "./day7-offer";
import { deriveLocalActivityStats, withServerStreak } from "../../stats/services/local-badges";

describe("shouldShowDay7Offer", () => {
  it("is false for premium users", () => {
    expect(shouldShowDay7Offer({ isPremium: true, streak: 10, shownAt: null })).toBe(false);
  });

  it("is false when the streak is below 7", () => {
    expect(shouldShowDay7Offer({ isPremium: false, streak: 6, shownAt: null })).toBe(false);
  });

  it("is false when already shown", () => {
    expect(
      shouldShowDay7Offer({ isPremium: false, streak: 9, shownAt: "2026-09-20T00:00:00.000Z" })
    ).toBe(false);
  });

  it("is true when non-premium, streak >= 7, and never shown", () => {
    expect(shouldShowDay7Offer({ isPremium: false, streak: 7, shownAt: null })).toBe(true);
  });
});

describe("day-7 offer streak source", () => {
  const today = new Date(2026, 6, 11);
  // Fresh device for a signed-in user: no local history yet.
  const local = deriveLocalActivityStats({ items: [], freeModeCount: 0 }, today);

  it("uses the server streak for a signed-in user when it is available", () => {
    const { currentStreak } = withServerStreak(local, { currentStreak: 7, longestStreak: 7, totalDaysActive: 7 });
    expect(shouldShowDay7Offer({ isPremium: false, streak: currentStreak, shownAt: null })).toBe(true);
  });

  it("falls back to the local day history when the server streak is not loaded", () => {
    const { currentStreak } = withServerStreak(local, null);
    expect(shouldShowDay7Offer({ isPremium: false, streak: currentStreak, shownAt: null })).toBe(false);
  });
});
