import { create } from "zustand";

/** "save" = opened from a Kaydet press (M-02): copy says why sign-in is needed to save. */
export type AuthPromptReason = "default" | "save";

type AuthPromptState = {
  visible: boolean;
  reason: AuthPromptReason;
  open: (reason?: AuthPromptReason) => void;
  close: () => void;
};

export const useAuthPromptStore = create<AuthPromptState>((set) => ({
  visible: false,
  reason: "default",
  open: (reason = "default") => set({ visible: true, reason }),
  close: () => set({ visible: false })
}));
