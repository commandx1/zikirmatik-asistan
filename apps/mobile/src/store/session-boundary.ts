import { useDhikrStore } from "./dhikr-store";
import { useOnboardingStore } from "./onboarding-store";
import { useProfileStore } from "./profile-store";

export function resetSessionScopedStores() {
  useOnboardingStore.getState().resetOnboarding();
  useProfileStore.getState().resetSessionScoped();
  useDhikrStore.getState().resetSessionScoped();
}
