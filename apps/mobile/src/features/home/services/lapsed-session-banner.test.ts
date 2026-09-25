import { describe, expect, it } from "vitest";
import { shouldShowLapsedSessionBanner } from "./lapsed-session-banner";

describe("shouldShowLapsedSessionBanner", () => {
  it("is true for a lapsed member (guest, signed_out, authError, prior user)", () => {
    expect(
      shouldShowLapsedSessionBanner({
        guestMode: true,
        status: "signed_out",
        authError: "session expired",
        lastAuthenticatedUserId: "user-1"
      })
    ).toBe(true);
  });

  it("is false for a fresh guest who never signed in", () => {
    expect(
      shouldShowLapsedSessionBanner({
        guestMode: true,
        status: "signed_out",
        authError: undefined,
        lastAuthenticatedUserId: undefined
      })
    ).toBe(false);
  });

  it("is false while authenticated", () => {
    expect(
      shouldShowLapsedSessionBanner({
        guestMode: false,
        status: "authenticated",
        authError: undefined,
        lastAuthenticatedUserId: "user-1"
      })
    ).toBe(false);
  });

  it("is false once authError has been cleared", () => {
    expect(
      shouldShowLapsedSessionBanner({
        guestMode: true,
        status: "signed_out",
        authError: undefined,
        lastAuthenticatedUserId: "user-1"
      })
    ).toBe(false);
  });
});
