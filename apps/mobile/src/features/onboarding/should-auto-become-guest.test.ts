import { describe, expect, it } from "vitest";
import { shouldAutoBecomeGuest } from "./should-auto-become-guest";

describe("shouldAutoBecomeGuest", () => {
  it("becomes a guest when signed_out and not already a guest (no auth wall on first launch)", () => {
    expect(shouldAutoBecomeGuest(true, "signed_out", false)).toBe(true);
  });

  it("does nothing while not ready yet", () => {
    expect(shouldAutoBecomeGuest(false, "signed_out", false)).toBe(false);
  });

  it("does nothing once already a guest", () => {
    expect(shouldAutoBecomeGuest(true, "signed_out", true)).toBe(false);
  });

  it("does nothing when already authenticated", () => {
    expect(shouldAutoBecomeGuest(true, "authenticated", false)).toBe(false);
  });

  // The root layout (app/_layout.tsx) feeds auth `hasHydrated` as `isReady` —
  // not the onboarding gate's combined readiness — so this must run before
  // onboarding hydration finishes too (a cold deep link never mounts
  // app/index.tsx, which is the only place that used the onboarding gate).
  it("becomes a guest from auth hasHydrated alone, without waiting on onboarding readiness", () => {
    const authHasHydrated = true;
    expect(shouldAutoBecomeGuest(authHasHydrated, "signed_out", false)).toBe(true);
  });
});
