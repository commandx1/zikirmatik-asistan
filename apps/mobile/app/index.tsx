import { Redirect } from "expo-router";
import { View } from "react-native";
import { useOnboardingGate } from "../src/features/onboarding/hooks/use-onboarding-gate";
import { shouldAutoBecomeGuest } from "../src/features/onboarding/should-auto-become-guest";
import { useAuthStore } from "../src/store/auth-store";
import { DEFAULT_BG_FALLBACK } from "@zikirmatik/shared";

export default function Index() {
  const { isReady, authStatus } = useOnboardingGate();
  const guestMode = useAuthStore((s) => s.guestMode);
  // The root layout's effect (app/_layout.tsx) is what actually calls
  // continueAsGuest() — it runs for every entry route, not just this one.
  // Here we just keep showing the blank loader until that effect has landed,
  // so there's no one-frame flash of a signed-out, non-guest state.
  const mustBecomeGuest = shouldAutoBecomeGuest(isReady, authStatus, guestMode);

  if (!isReady || mustBecomeGuest) {
    return <View style={{ flex: 1, backgroundColor: DEFAULT_BG_FALLBACK }} />;
  }

  return <Redirect href="/(tabs)/home" />;
}
