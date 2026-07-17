import type { AiRecommendation, Dhikr, SpecialDay } from "../types/domain";

export const DHIKR_MOCKS: Dhikr[] = [
  {
    id: "dhikr-astagfirullah",
    nameArabic: "أَسْتَغْفِرُ اللَّهَ",
    name: { tr: "Estağfirullah", en: "Astaghfirullah" },
    transliteration: { tr: "Estağfirullah", en: "Astaghfirullah" },
    meaning: {
      tr: "Allah'tan bağışlanma dilerim",
      en: "I seek forgiveness from Allah"
    },
    source: { tr: "Buhari, 6307", en: "Sahih al-Bukhari, 6307" },
    tags: ["stres", "arınma"],
    recommendedCount: 100
  },
  {
    id: "dhikr-subhanallah",
    nameArabic: "سُبْحَانَ اللّٰهِ",
    name: { tr: "Sübhanallah", en: "Subhanallah" },
    transliteration: { tr: "Sübhanallah", en: "Subhanallah" },
    meaning: {
      tr: "Allah her türlü eksiklikten uzaktır",
      en: "Glory be to Allah, free of all imperfection"
    },
    source: { tr: "Müslim, 2694", en: "Sahih Muslim, 2694" },
    tags: ["huzur", "şükür"],
    recommendedCount: 33
  }
];

export const AI_RECOMMENDATION_MOCKS: AiRecommendation[] = [
  {
    id: "rec-1",
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
