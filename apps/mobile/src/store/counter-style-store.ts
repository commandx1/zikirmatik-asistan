import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

// Ana sayaç görselinin stilini ve (tesbih modu seçiliyken) malzeme/ses
// tercihini tutar. Kasıtlı olarak sunucu senkronu YOK (bkz. theme-store'daki
// syncUserAppearance deseni) — salt cihaz-yerel bir görünüm tercihi.
// Premium kontrolü de burada YOK: seçim her zaman serbesttir, kilit yalnızca
// render sırasında (home-view'da PremiumLockOverlay ile) uygulanır.
export type CounterStyle = "halka" | "tesbih";
export type TesbihMaterial = "kehribar" | "oltu-tasi" | "zeytin-cekirdegi" | "gumus";
// UI'ı bu görevin kapsamında değil (alan hazır dursun) — ileride tane
// çekme/tur sesleri için kullanılacak.
export type CounterSoundPack = "off" | "tik" | "ahsap";

type CounterStyleState = {
  counterStyle: CounterStyle;
  material: TesbihMaterial;
  soundPack: CounterSoundPack;
  setCounterStyle: (counterStyle: CounterStyle) => void;
  setMaterial: (material: TesbihMaterial) => void;
  setSoundPack: (soundPack: CounterSoundPack) => void;
};

export const useCounterStyleStore = create<CounterStyleState>()(
  persist(
    (set) => ({
      counterStyle: "halka",
      material: "kehribar",
      soundPack: "off",
      setCounterStyle: (counterStyle) => set({ counterStyle }),
      setMaterial: (material) => set({ material }),
      setSoundPack: (soundPack) => set({ soundPack })
    }),
    {
      name: "counter-style-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        counterStyle: state.counterStyle,
        material: state.material,
        soundPack: state.soundPack
      })
    }
  )
);
