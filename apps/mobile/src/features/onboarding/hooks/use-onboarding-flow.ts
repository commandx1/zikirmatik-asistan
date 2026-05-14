import { useMemo, useState } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/auth-store";
import { useOnboardingStore } from "../../../store/onboarding-store";
import { UsersApiError, saveUserOnboarding } from "../../users/services/users-api-client";
import { nextStep, previousStep } from "../services/onboarding-service";
import type { OnboardingStep } from "../types";

export function useOnboardingFlow() {
  const router = useRouter();
  const step = useOnboardingStore((s) => s.step as OnboardingStep);
  const purpose = useOnboardingStore((s) => s.purpose);
  const mood = useOnboardingStore((s) => s.mood);
  const city = useOnboardingStore((s) => s.city);
  const setStep = useOnboardingStore((s) => s.setStep);
  const completeOnboarding = useOnboardingStore((s) => s.completeOnboarding);
  const setPurpose = useOnboardingStore((s) => s.setPurpose);
  const setMood = useOnboardingStore((s) => s.setMood);
  const setCity = useOnboardingStore((s) => s.setCity);
  const authStatus = useAuthStore((s) => s.status);
  const session = useAuthStore((s) => s.session);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string>();

  const progress = useMemo(() => Math.round((step / 4) * 100), [step]);

  const submitFinalStep = async () => {
    if (authStatus !== "authenticated" || !session?.userId) {
      completeOnboarding();
      router.replace("/(tabs)/home");
      return;
    }

    setIsSubmitting(true);
    setSubmitError(undefined);
    try {
      await saveUserOnboarding(
        session.userId,
        {
          purpose,
          mood,
          city
        },
        session.accessToken
      );

      completeOnboarding();
      router.replace("/(tabs)/home");
    } catch (error) {
      if (error instanceof UsersApiError) {
        setSubmitError(error.message);
      } else {
        setSubmitError("Onboarding kaydedilemedi. Lütfen tekrar deneyin.");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    step,
    progress,
    purpose,
    mood,
    city,
    isSubmitting,
    submitError,
    setStep,
    setPurpose,
    setMood,
    setCity: (value: string) => {
      setSubmitError(undefined);
      setCity(value);
    },
    onNext: () => {
      if (isSubmitting) {
        return;
      }

      if (step === 4 && city.trim().length === 0) {
        setSubmitError("Lütfen şehir seç ya da yaz.");
        return;
      }

      if (step === 4) {
        void submitFinalStep();
        return;
      }

      setSubmitError(undefined);
      setStep(nextStep(step));
    },
    onBack: () => setStep(previousStep(step))
  };
}
