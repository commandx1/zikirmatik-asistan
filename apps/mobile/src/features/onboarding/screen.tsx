import { View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { LocationStep, PurposeStep, SplashStep } from "./components/steps";
import { OnboardingFlowProvider } from "./context/onboarding-flow-context";
import { ONBOARDING_FRAME } from "./onboarding-theme";
import { useOnboardingFlow } from "./hooks/use-onboarding-flow";

export function OnboardingScreen() {
  const flow = useOnboardingFlow();

  return (
    <SafeAreaView className="flex-1 bg-[#0F1B2D]" edges={["top", "bottom"]}>
      <View className="flex-1 items-center bg-[#0F1B2D]">
        <OnboardingFlowProvider value={flow}>
          <View style={{ width: "100%", maxWidth: ONBOARDING_FRAME.maxWidth }} className="flex-1 overflow-hidden">
            {flow.step === 1 ? <SplashStep /> : null}
            {flow.step === 2 ? <PurposeStep /> : null}
            {flow.step === 3 ? <LocationStep /> : null}
          </View>
        </OnboardingFlowProvider>
      </View>
    </SafeAreaView>
  );
}
