// Pure visibility check for the lapsed-session banner (see
// components/lapsed-session-banner.tsx): a lapsed member is a guest whose
// last session ended in a terminal refresh failure, not a fresh guest who
// never signed in (see auth-store.ts's `becomeGuest`).
export function shouldShowLapsedSessionBanner({
  guestMode,
  status,
  authError,
  lastAuthenticatedUserId
}: {
  guestMode: boolean;
  status: string;
  authError: string | undefined;
  lastAuthenticatedUserId: string | undefined;
}): boolean {
  return guestMode && status === "signed_out" && Boolean(authError) && Boolean(lastAuthenticatedUserId);
}
