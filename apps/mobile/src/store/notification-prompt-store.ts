import { create } from "zustand";

type NotificationPromptState = {
  visible: boolean;
  deniedVisible: boolean;
  isPending: boolean;
  resolve: ((confirmed: boolean) => void) | null;
  request: () => Promise<boolean>;
  confirm: () => void;
  dismiss: () => void;
  showDenied: () => void;
  hideDenied: () => void;
  setPending: (pending: boolean) => void;
};

export const useNotificationPromptStore = create<NotificationPromptState>((set, get) => ({
  visible: false,
  deniedVisible: false,
  isPending: false,
  resolve: null,
  request: () =>
    new Promise<boolean>((resolve) => {
      set({ visible: true, resolve });
    }),
  confirm: () => {
    get().resolve?.(true);
    set({ visible: false, resolve: null });
  },
  dismiss: () => {
    get().resolve?.(false);
    set({ visible: false, resolve: null });
  },
  showDenied: () => set({ deniedVisible: true }),
  hideDenied: () => set({ deniedVisible: false }),
  setPending: (pending) => set({ isPending: pending })
}));
