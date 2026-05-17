import { Redirect } from "expo-router";
import { OnboardingScreen } from "../src/features/onboarding/screen";
import { useOnboardingGate } from "../src/features/onboarding/hooks/use-onboarding-gate";

export default function OnboardingRoute() {
  const { isReady, authStatus, isCompleted } = useOnboardingGate();

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  if (!isReady) {
    return null;
  }

  if (isCompleted) {
    return <Redirect href="/(tabs)/home" />;
  }

  return <OnboardingScreen />;
}
