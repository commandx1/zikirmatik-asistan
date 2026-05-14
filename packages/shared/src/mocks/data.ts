import type { AiRecommendation, Dhikr, SpecialDay } from "../types/domain";

export const DHIKR_MOCKS: Dhikr[] = [
  {
    id: "dhikr-astagfirullah",
    nameArabic: "أَسْتَغْفِرُ اللَّهَ",
    nameTurkish: "Estağfirullah",
    transliteration: "Astaghfirullah",
    meaning: "Allah'tan bağışlanma dilerim",
    source: "Buhari, 6307",
    tags: ["stres", "arınma"],
    recommendedCount: 100
  },
  {
    id: "dhikr-subhanallah",
    nameArabic: "سُبْحَانَ اللّٰهِ",
    nameTurkish: "Sübhanallah",
    transliteration: "Subhanallah",
    meaning: "Allah her türlü eksiklikten uzaktır",
    source: "Müslim, 2694",
    tags: ["huzur", "şükür"],
    recommendedCount: 33
  }
];

export const AI_RECOMMENDATION_MOCKS: AiRecommendation[] = [
  {
    id: "rec-1",
    mood: "stresli",
    reason: "Kısa ve ritmik tekrar ile zihni sakinleştirir.",
    dhikrId: "dhikr-astagfirullah",
    confidence: 0.91
  }
];

export const SPECIAL_DAY_MOCKS: SpecialDay[] = [
  {
    id: "kandil-1",
    title: "Mevlid Kandili",
    startsAtIso: "2026-09-14T20:00:00.000Z",
    category: "kandil",
    featuredDhikrIds: ["dhikr-subhanallah"]
  }
];
