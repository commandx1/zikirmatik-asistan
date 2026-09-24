import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { useBackendUser } from "../../users/hooks/use-backend-user";

export function useOnboardingGate() {
  const authStatus = useAuthStore((s) => s.status);
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const applyBackendSnapshot = useOnboardingStore((s) => s.applyBackendSnapshot);
  // Hata durumunda data gelmez → yerel onboarding snapshot'ı korunur.
  const { data: user } = useBackendUser();

  // Background-only: the backend snapshot just refreshes the locally persisted
  // onboarding purpose, so navigation must never wait on it. Blocking here made
  // a cold-started API (30s+) hold the app on an empty screen.
  useEffect(() => {
    if (!authHydrated || !onboardingHydrated || !user) {
      return;
    }

    applyBackendSnapshot({
      purpose: user.onboarding?.purpose
    });
  }, [applyBackendSnapshot, authHydrated, onboardingHydrated, user]);

  // Only local persisted state gates the first render — no network on this path.
  const isReady = authHydrated && onboardingHydrated;

  return {
    isReady,
    authStatus
  };
}
