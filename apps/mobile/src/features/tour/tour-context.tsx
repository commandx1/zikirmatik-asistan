import { createContext, useCallback, useContext, useRef, useState, type PropsWithChildren, type RefObject } from "react";
import type { View } from "react-native";
import { useOnboardingStore } from "../../store/onboarding-store";
import { TOUR_STEPS } from "./tour-steps";
import type { TourStepDef, TourRefs } from "./types";

type TourContextValue = {
  isActive: boolean;
  currentStepIndex: number;
  currentStep: TourStepDef | null;
  totalSteps: number;
  startTour: () => void;
  nextStep: () => void;
  prevStep: () => void;
  skipTour: () => void;
  registerRef: (key: string, ref: RefObject<View | null>) => void;
  getRef: (key: string) => RefObject<View | null> | undefined;
};

const TourContext = createContext<TourContextValue | null>(null);

type TourProviderProps = PropsWithChildren<{ onComplete?: () => void }>;

export function TourProvider({ children, onComplete }: TourProviderProps) {
  const isTourCompleted = useOnboardingStore((s) => s.isTourCompleted);
  const completeTour = useOnboardingStore((s) => s.completeTour);
  const [currentStepIndex, setCurrentStepIndex] = useState(-1);
  const refsRef = useRef<TourRefs>(new Map());

  const isActive = currentStepIndex >= 0;
  const currentStep = isActive ? (TOUR_STEPS[currentStepIndex] ?? null) : null;

  const registerRef = useCallback((key: string, ref: RefObject<View | null>) => {
    refsRef.current.set(key, ref);
  }, []);

  const getRef = useCallback((key: string) => refsRef.current.get(key), []);

  const startTour = useCallback(() => {
    if (isTourCompleted) return;
    setCurrentStepIndex(0);
  }, [isTourCompleted]);

  const nextStep = useCallback(() => {
    setCurrentStepIndex((prev) => {
      if (prev >= TOUR_STEPS.length - 1) {
        completeTour();
        onComplete?.();
        return -1;
      }
      return prev + 1;
    });
  }, [completeTour, onComplete]);

  const prevStep = useCallback(() => {
    setCurrentStepIndex((prev) => Math.max(0, prev - 1));
  }, []);

  const skipTour = useCallback(() => {
    completeTour();
    onComplete?.();
    setCurrentStepIndex(-1);
  }, [completeTour, onComplete]);

  return (
    <TourContext.Provider
      value={{
        isActive,
        currentStepIndex,
        currentStep,
        totalSteps: TOUR_STEPS.length,
        startTour,
        nextStep,
        prevStep,
        skipTour,
        registerRef,
        getRef,
      }}
    >
      {children}
    </TourContext.Provider>
  );
}

export function useTourContext() {
  const ctx = useContext(TourContext);
  if (!ctx) throw new Error("useTourContext must be used within TourProvider");
  return ctx;
}
