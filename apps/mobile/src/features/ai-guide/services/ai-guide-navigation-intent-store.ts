import { create } from "zustand";

export type AiGuideSpecialDayIntent = {
  /** AI Rehber girdi alanına önceden yazılacak metin. */
  freeText: string;
  /**
   * Ekranda gösterilen özel gün adı. Backend'e `timeContext.specialDayName`
   * olarak gider ve fallback-recommender bunu zikirlerin `suitableFor`
   * değerleriyle karşılaştırır — bu yüzden seed'de etiketlenen adın birebir
   * aynısı olmalı.
   */
  specialDayName: string;
};

type AiGuideNavigationIntentState = {
  pendingSpecialDayIntent?: AiGuideSpecialDayIntent;
  requestSpecialDayIntent: (intent: AiGuideSpecialDayIntent) => void;
  consumeSpecialDayIntent: () => void;
};

export const useAiGuideNavigationIntentStore = create<AiGuideNavigationIntentState>((set) => ({
  pendingSpecialDayIntent: undefined,
  requestSpecialDayIntent: (intent) => set({ pendingSpecialDayIntent: intent }),
  consumeSpecialDayIntent: () => set({ pendingSpecialDayIntent: undefined })
}));
