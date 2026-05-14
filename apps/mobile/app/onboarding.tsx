import { Redirect } from "expo-router";
import { OnboardingScreen } from "../src/features/onboarding/screen";
import { useAuthStore } from "../src/store/auth-store";
import { useOnboardingStore } from "../src/store/onboarding-store";

export default function OnboardingRoute() {
  const authStatus = useAuthStore((s) => s.status);
  const isCompleted = useOnboardingStore((s) => s.isCompleted);
  const onboardingHydrated = useOnboardingStore((s) => s.hasHydrated);

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  if (!onboardingHydrated) {
    return null;
  }

  if (isCompleted) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <OnboardingScreen />;
}
