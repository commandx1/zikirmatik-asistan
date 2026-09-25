import { describe, expect, it } from "vitest";
import { shouldShowDay7Offer } from "./day7-offer";

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
