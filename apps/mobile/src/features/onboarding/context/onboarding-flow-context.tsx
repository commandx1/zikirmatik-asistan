import { createContext, useContext, type PropsWithChildren } from "react";
import type { useOnboardingFlow } from "../hooks/use-onboarding-flow";

type OnboardingFlowContextValue = ReturnType<typeof useOnboardingFlow>;

const OnboardingFlowContext = createContext<OnboardingFlowContextValue | null>(null);

type OnboardingFlowProviderProps = PropsWithChildren<{
  value: OnboardingFlowContextValue;
}>;

export function OnboardingFlowProvider({ children, value }: OnboardingFlowProviderProps) {
  return <OnboardingFlowContext.Provider value={value}>{children}</OnboardingFlowContext.Provider>;
}

export function useOnboardingFlowContext() {
  const context = useContext(OnboardingFlowContext);

  if (!context) {
    throw new Error("useOnboardingFlowContext must be used within OnboardingFlowProvider");
  }

  return context;
}
