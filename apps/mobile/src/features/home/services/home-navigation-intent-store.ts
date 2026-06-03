import { create } from "zustand";
import type { EsmaulHusnaItem } from "../../focus/types";

type HomeNavigationIntentState = {
  pendingDailyEsmaStart?: EsmaulHusnaItem;
  esmaListFocusRequestId: number;
  requestDailyEsmaStart: (item: EsmaulHusnaItem) => void;
  consumeDailyEsmaStart: () => void;
  requestEsmaListFocus: () => void;
  consumeEsmaListFocus: (requestId: number) => void;
};

export const useHomeNavigationIntentStore = create<HomeNavigationIntentState>((set) => ({
  pendingDailyEsmaStart: undefined,
  esmaListFocusRequestId: 0,
  requestDailyEsmaStart: (item) => set({ pendingDailyEsmaStart: item }),
  consumeDailyEsmaStart: () => set({ pendingDailyEsmaStart: undefined }),
  requestEsmaListFocus: () =>
    set((state) => ({ esmaListFocusRequestId: state.esmaListFocusRequestId + 1 })),
  consumeEsmaListFocus: (requestId) =>
    set((state) =>
      state.esmaListFocusRequestId === requestId ? { esmaListFocusRequestId: 0 } : state
    )
}));
