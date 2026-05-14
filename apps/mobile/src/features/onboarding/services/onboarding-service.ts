import type { OnboardingStep } from "../types";

export function nextStep(step: OnboardingStep): OnboardingStep {
  return (step >= 4 ? 4 : (step + 1)) as OnboardingStep;
}

export function previousStep(step: OnboardingStep): OnboardingStep {
  return (step <= 1 ? 1 : (step - 1)) as OnboardingStep;
}
