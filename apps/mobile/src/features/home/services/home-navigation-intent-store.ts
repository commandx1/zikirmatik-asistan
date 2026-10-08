import { create } from "zustand";
import type { EsmaulHusnaItem } from "../../focus/types";

type HomeNavigationIntentState = {
  pendingDailyEsmaStart?: EsmaulHusnaItem;
  esmaListFocusRequestId: number;
  /** Widget'ın "Premium ›" daveti gibi bir derin bağlantının istediği paywall.
   * Rota paramı yerine burada taşınır: soğuk açılışta sekme düzeninin auth
   * kapısı /auth'a yönlendirip geri dönerken query paramlarını düşürüyor. */
  pendingPaywallSource?: "widget";
  /** MOB-KOL-04: koleksiyondan "Kaydet ve devam" + kaydedilmemiş serbest sayım —
   * ana sayfa serbest-kayıt ad formunu açar, kayıttan sonra bu zikre geçer. */
  pendingFreeSaveSelectId?: string;
  requestFreeSaveSelect: (dhikrId: string) => void;
  consumeFreeSaveSelect: () => void;
  requestPaywall: (source: "widget") => void;
  consumePaywall: () => void;
  requestDailyEsmaStart: (item: EsmaulHusnaItem) => void;
  consumeDailyEsmaStart: () => void;
  requestEsmaListFocus: () => void;
  consumeEsmaListFocus: (requestId: number) => void;
};

export const useHomeNavigationIntentStore = create<HomeNavigationIntentState>((set) => ({
  pendingDailyEsmaStart: undefined,
  esmaListFocusRequestId: 0,
  pendingPaywallSource: undefined,
  pendingFreeSaveSelectId: undefined,
  requestFreeSaveSelect: (dhikrId) => set({ pendingFreeSaveSelectId: dhikrId }),
  consumeFreeSaveSelect: () => set({ pendingFreeSaveSelectId: undefined }),
  requestPaywall: (source) => set({ pendingPaywallSource: source }),
  consumePaywall: () => set({ pendingPaywallSource: undefined }),
  requestDailyEsmaStart: (item) => set({ pendingDailyEsmaStart: item }),
  consumeDailyEsmaStart: () => set({ pendingDailyEsmaStart: undefined }),
  requestEsmaListFocus: () =>
    set((state) => ({ esmaListFocusRequestId: state.esmaListFocusRequestId + 1 })),
  consumeEsmaListFocus: (requestId) =>
    set((state) =>
      state.esmaListFocusRequestId === requestId ? { esmaListFocusRequestId: 0 } : state
    )
}));
