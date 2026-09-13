import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";

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
