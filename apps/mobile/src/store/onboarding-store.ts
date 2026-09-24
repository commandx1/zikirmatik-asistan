import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

type OnboardingState = {
  hasHydrated: boolean;
  purpose: string;
  isTourCompleted: boolean;
  resetOnboarding: () => void;
  setPurpose: (purpose: string) => void;
  applyBackendSnapshot: (payload: { purpose?: string }) => void;
  markHydrated: () => void;
  completeTour: () => void;
  resetTour: () => void;
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      hasHydrated: false,
      purpose: "habit",
      isTourCompleted: false,
      resetOnboarding: () =>
        set({
          purpose: "habit"
        }),
      setPurpose: (purpose) => set({ purpose }),
      applyBackendSnapshot: ({ purpose }) =>
        set((state) => {
          const nextPurpose = purpose?.trim() || state.purpose || "habit";
          return {
            purpose: nextPurpose
          };
        }),
      markHydrated: () => set({ hasHydrated: true }),
      completeTour: () => set({ isTourCompleted: true }),
      resetTour: () => set({ isTourCompleted: false })
    }),
    {
      name: "onboarding-store-v4",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        purpose: state.purpose,
        isTourCompleted: state.isTourCompleted
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
