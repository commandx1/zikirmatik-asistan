// Pure so app/index.tsx's "become a guest automatically" effect is unit-testable
// without rendering: a signed-out, non-guest user should never see the auth wall.
export function shouldAutoBecomeGuest(isReady: boolean, authStatus: string, guestMode: boolean) {
  return isReady && authStatus !== "authenticated" && !guestMode;
}
