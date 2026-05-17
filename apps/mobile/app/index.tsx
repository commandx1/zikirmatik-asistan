import { Redirect } from "expo-router";
import { useOnboardingGate } from "../src/features/onboarding/hooks/use-onboarding-gate";

export default function Index() {
  const { isReady, authStatus, isCompleted } = useOnboardingGate();

  if (!isReady) {
    return null;
  }

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  return <Redirect href={isCompleted ? "/(tabs)/home" : "/onboarding"} />;
}
