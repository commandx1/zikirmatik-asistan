import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { getUserById } from "../../users/services/users-api-client";

export function useOnboardingGate() {
  const authStatus = useAuthStore((s) => s.status);
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const session = useAuthStore((s) => s.session);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const applyBackendSnapshot = useOnboardingStore((s) => s.applyBackendSnapshot);

  // Background-only: the backend snapshot just refreshes the locally persisted
  // onboarding purpose, so navigation must never wait on it. Blocking here made
  // a cold-started API (30s+) hold the app on an empty screen.
  useEffect(() => {
    if (!authHydrated || !onboardingHydrated) {
      return;
    }

    if (authStatus !== "authenticated" || !session?.userId) {
      return;
    }

    let cancelled = false;

    void getUserById(session.userId, session.accessToken)
      .then((user) => {
        if (cancelled) {
          return;
        }

        applyBackendSnapshot({
          purpose: user.onboarding?.purpose
        });
      })
      .catch(() => {
        // If user fetch fails, keep local onboarding snapshot.
      });

    return () => {
      cancelled = true;
    };
  }, [
    applyBackendSnapshot,
    authHydrated,
    authStatus,
    onboardingHydrated,
    session?.accessToken,
    session?.userId
  ]);

  // Only local persisted state gates the first render — no network on this path.
  const isReady = authHydrated && onboardingHydrated;

  return {
    isReady,
    authStatus
  };
}
