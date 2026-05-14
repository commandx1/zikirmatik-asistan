import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useProfileStore } from "./profile-store";

type OnboardingState = {
  step: number;
  isCompleted: boolean;
  hasHydrated: boolean;
  purpose: string;
  mood: string;
  city: string;
  setStep: (step: number) => void;
  completeOnboarding: () => void;
  resetOnboarding: () => void;
  setPurpose: (purpose: string) => void;
  setMood: (mood: string) => void;
  setCity: (city: string) => void;
  markHydrated: () => void;
};

const safeAsyncStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  }
};

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      step: 1,
      isCompleted: false,
      hasHydrated: false,
      purpose: "habit",
      mood: "huzurlu",
      city: "",
      setStep: (step) => set({ step }),
      completeOnboarding: () => set({ isCompleted: true, step: 4 }),
      resetOnboarding: () =>
        set({
          step: 1,
          isCompleted: false,
          purpose: "habit",
          mood: "huzurlu",
          city: ""
        }),
      setPurpose: (purpose) => set({ purpose }),
      setMood: (mood) => set({ mood }),
      setCity: (city) => {
        const nextCity = city.trim();
        set({ city: nextCity });
        useProfileStore.getState().setCity(nextCity);
      },
      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "onboarding-store-v3",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        step: state.step,
        isCompleted: state.isCompleted,
        purpose: state.purpose,
        mood: state.mood,
        city: state.city
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
