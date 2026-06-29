import { useRouter } from "expo-router";
import { useOnboardingStore } from "../../../store/onboarding-store";
import type { OnboardingStep } from "../types";

export function useOnboardingFlow() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step as OnboardingStep);
  const setStep = useOnboardingStore((s) => s.setStep);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);

  return {
    step,
    setStep,
    onNext: () => {
      completeOnboarding();
      router.replace("/(tabs)/home");
    },
    onBack: () => setStep(step)
  };
}
