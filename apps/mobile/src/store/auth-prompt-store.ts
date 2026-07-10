import { create } from "zustand";

type AuthPromptState = {
  visible: boolean;
  open: () => void;
  close: () => void;
};

export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  visible: false,
  open: () => set({ visible: true }),
  close: () => set({ visible: false })
}));
