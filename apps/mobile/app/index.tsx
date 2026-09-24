import { Redirect } from "expo-router";
import { View } from "react-native";
import { useOnboardingGate } from "../src/features/onboarding/hooks/use-onboarding-gate";
import { useAuthStore } from "../src/store/auth-store";
import { DEFAULT_BG_FALLBACK } from "@zikirmatik/shared";

export default function Index() {
  const { isReady, authStatus } = useOnboardingGate();
  const guestMode = useAuthStore((s) => s.guestMode);

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: DEFAULT_BG_FALLBACK }} />;
  }

  if (authStatus !== "authenticated" && !guestMode) {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
