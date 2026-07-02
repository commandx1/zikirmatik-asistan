import { Redirect } from "expo-router";
import { View } from "react-native";
import { useOnboardingGate } from "../src/features/onboarding/hooks/use-onboarding-gate";

// Matches the default theme's bg (packages/shared/src/utils/theme.ts) and
// android.adaptiveIcon.backgroundColor in app.json — used before ThemeProvider
// mounts, so it can't read theme tokens yet.
const FALLBACK_BACKGROUND_COLOR = "#0B1423";

export default function Index() {
  const { isReady, authStatus } = useOnboardingGate();

  if (!isReady) {
    return <View style={{ flex: 1, backgroundColor: FALLBACK_BACKGROUND_COLOR }} />;
  }

  if (authStatus !== "authenticated") {
    return <Redirect href="/auth" />;
  }

  return <Redirect href="/(tabs)/home" />;
}
