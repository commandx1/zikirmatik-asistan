import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { getUserById } from "../../users/services/users-api-client";

export function useOnboardingGate() {
  const authStatus = useAuthStore((s) => s.status);
  const guestMode = useAuthStore((s) => s.guestMode);
  const authHydrated = useAuthStore((s) => s.hasHydrated);
  const session = useAuthStore((s) => s.session);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const applyBackendSnapshot = useOnboardingStore((s) => s.applyBackendSnapshot);
  const [isResolving, setIsResolving] = useState(false);
  const [resolvedUserId, setResolvedUserId] = useState<string>();

  useEffect(() => {
    if (!authHydrated || !onboardingHydrated) {
      return;
    }

    if (guestMode && authStatus !== "authenticated") {
      setIsResolving(false);
      setResolvedUserId(undefined);
      return;
    }

    if (authStatus !== "authenticated" || !session?.userId) {
      setIsResolving(false);
      setResolvedUserId(undefined);
      return;
    }

    let cancelled = false;
    setIsResolving(true);

    void getUserById(session.userId, session.accessToken)
      .then((user) => {
        if (cancelled) {
          return;
        }

        applyBackendSnapshot({
          purpose: user.onboarding?.purpose,
          city: user.onboarding?.city ?? user.city
        });
        setResolvedUserId(session.userId);
      })
      .catch(() => {
        // If user fetch fails, keep local onboarding snapshot.
        setResolvedUserId(session.userId);
      })
      .finally(() => {
        if (!cancelled) {
          setIsResolving(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    applyBackendSnapshot,
    authHydrated,
    authStatus,
    guestMode,
    onboardingHydrated,
    session?.accessToken,
    session?.userId
  ]);

  const needsUserResolution =
    authStatus === "authenticated" && !!session?.userId && resolvedUserId !== session.userId;

  const isReady = authHydrated && onboardingHydrated && !isResolving && !needsUserResolution;

  return {
    isReady,
    authStatus
  };
}
