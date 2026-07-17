import { describe, expect, it, vi } from "vitest";
import { buildAiGuideHistoryItems, resolveVisibleAiGuideHistory } from "./ai-guide-history-service";
import type { AiGuideHistoryItem } from "../types";

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string) => {
      if (key === "ai-guide:recommendation.chipLabelPrimary") return "Senin için birincil öneri";
      if (key === "ai-guide:recommendation.chipLabelSecondary") return "Asistan önerisi";
      if (key === "ai-guide:recommendation.repeatLabelPrimary") return "Öncelikli";
      if (key === "ai-guide:genericPrompt") return "Genel öneri";
      return key;
    },
    changeLanguage: vi.fn()
  },
  detectDeviceLocale: () => "tr"
}));

const history: AiGuideHistoryItem[] = [
  { id: "1", prompt: "Sabır", createdAt: "2026-06-03T10:00:00.000Z", recommendations: [] },
  { id: "2", prompt: "Huzur", createdAt: "2026-06-02T10:00:00.000Z", recommendations: [] },
  { id: "3", prompt: "Şükür", createdAt: "2026-06-01T10:00:00.000Z", recommendations: [] }
];

describe("ai-guide-history-service", () => {
  it("shows only the latest two history items by default", () => {
    expect(resolveVisibleAiGuideHistory(history, false).map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("shows every history item when expanded", () => {
    expect(resolveVisibleAiGuideHistory(history, true).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });

  it("maps assistant note, source, virtue, and all recommendations from backend history", () => {
    const items = buildAiGuideHistoryItems(
      [
        {
          _id: "rec-a",
          userId: "user-a",
          freeText: "borç sıkıntısı",
          assistantNote: "Bu öneriler borç ve iç sıkışması bağlamına göre hazırlandı.",
          recommendedDhikrIds: ["dhikr-a", "dhikr-b", "dhikr-c"],
          createdAt: "2026-06-03T10:00:00.000Z"
        }
      ],
      [
        {
          _id: "dhikr-a",
          name: { tr: "Dua A", en: "Dua A" },
          nameArabic: "الدعاء أ",
          transliteration: { tr: "Dua A", en: "Dua A" },
          meaning: { tr: "Anlam A", en: "Anlam A" },
          virtue: { tr: "Fazilet A", en: "Fazilet A" },
          source: { tr: "Tirmizi, Deavat", en: "Tirmizi, Deavat" },
          recommendedCount: 33
        },
        {
          _id: "dhikr-b",
          name: { tr: "Dua B", en: "Dua B" },
          nameArabic: "الدعاء ب",
          transliteration: { tr: "Dua B", en: "Dua B" },
          meaning: { tr: "Anlam B", en: "Anlam B" },
          virtue: { tr: "Fazilet B", en: "Fazilet B" },
          source: { tr: "Buhari, Deavat", en: "Buhari, Deavat" },
          recommendedCount: 100
        },
        {
          _id: "dhikr-c",
          name: { tr: "Dua C", en: "Dua C" },
          nameArabic: "الدعاء ج",
          transliteration: { tr: "Dua C", en: "Dua C" },
          meaning: { tr: "Anlam C", en: "Anlam C" },
          virtue: { tr: "Fazilet C", en: "Fazilet C" },
          source: { tr: "Müslim, Zikir", en: "Müslim, Zikir" },
          recommendedCount: 7
        }
      ]
    );

    expect(items).toHaveLength(1);
    expect(items[0]?.assistantNote).toBe("Bu öneriler borç ve iç sıkışması bağlamına göre hazırlandı.");
    expect(items[0]?.recommendations).toHaveLength(3);
    expect(items[0]?.recommendations[0]).toMatchObject({
      id: "dhikr-a",
      isPrimary: true,
      repeatLabel: "Öncelikli",
      virtue: "Fazilet A",
      source: "Tirmizi, Deavat",
      recommendedCount: 33
    });
    expect(items[0]?.recommendations[1]?.repeatLabel).toBeUndefined();
  });
});
