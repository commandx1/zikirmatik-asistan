import type { AiGuideRecommendation } from "./types";

export const AI_GUIDE_CURRENT_STATE = {
  label: "ASİSTAN",
} as const;

export const AI_GUIDE_INPUT_PLACEHOLDER = "Niyetini ve ihtiyacını yaz...";

export const AI_GUIDE_PROMPT_CHIPS = ["İçim sıkıldı", "Endişeliyim", "Şükretmek istiyorum"] as const;

export const AI_GUIDE_RECOMMENDATIONS: AiGuideRecommendation[] = [
  {
    id: "la-ilahe-illallah",
    chipEmoji: "💆",
    chipLabel: "Huzur & stres için",
    repeatLabel: "100 kez",
    arabic: "لَا إِلَٰهَ إِلَّا ٱللَّٰهُ",
    transliteration: "La ilahe illallah",
    meaning: "Allah'tan başka ilah yoktur",
    note: "En faziletli zikir. Kalplere huzur verir.",
    isPrimary: true
  },
  {
    id: "estagfirullah",
    chipEmoji: "🧹",
    chipLabel: "Arınma için",
    arabic: "أَسْتَغْفِرُ اللَّهَ",
    transliteration: "Estağfirullah",
    meaning: "Allah'tan bağışlanma dilerim"
  },
  {
    id: "subhanallah",
    chipEmoji: "☀️",
    chipLabel: "Cuma için",
    arabic: "سُبْحَانَ اللَّهِ",
    transliteration: "Sübhanallah",
    meaning: "Allah her türlü eksiklikten münezzehtir"
  }
];
