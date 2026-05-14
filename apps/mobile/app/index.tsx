import { Redirect } from "expo-router";
import { useOnboardingStore } from "../src/store/onboarding-store";
import { useAuthStore } from "../src/store/auth-store";

export default function Index() {
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);
  const authStatus = useAuthStore((s) => s.status);
  const authHydrated = useAuthStore((s) => s.hasHydrated);

  if (!authHydrated || !onboardingHydrated) {
    return null;
  }

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  return <Redirect href={isCompleted ? "/(tabs)/home" : "/onboarding"} />;
}
