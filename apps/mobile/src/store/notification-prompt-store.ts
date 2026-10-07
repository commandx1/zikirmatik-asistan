import { create } from "zustand";

/** dailyReminder = in-app card offered after the first save ("Günlük hatırlatma ister misin?"). */
export type NotificationPromptReason = "default" | "dailyReminder";

type NotificationPromptState = {
  visible: boolean;
  reason: NotificationPromptReason;
  /** Reason the NEXT request() will use (the permission flows below it don't take one). */
  setNextReason: (reason: NotificationPromptReason) => void;
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
  reason: "default",
  setNextReason: (reason) => set({ reason }),
  deniedVisible: false,
  isPending: false,
  resolve: null,
  request: () =>
    new Promise<boolean>((resolve) => {
      set({ visible: true, resolve });
    }),
  confirm: () => {
    get().resolve?.(true);
    set({ visible: false, resolve: null, reason: "default" });
  },
  dismiss: () => {
    get().resolve?.(false);
    set({ visible: false, resolve: null, reason: "default" });
  },
  showDenied: () => set({ deniedVisible: true }),
  hideDenied: () => set({ deniedVisible: false }),
  setPending: (pending) => set({ isPending: pending })
}));
