import { describe, expect, it } from "vitest";
import { buildAiGuideHistoryItems, resolveVisibleAiGuideHistory } from "./ai-guide-history-service";
import type { AiGuideHistoryItem } from "../types";

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
          nameTurkish: "Dua A",
          nameArabic: "الدعاء أ",
          transliteration: "Dua A",
          meaning: "Anlam A",
          virtue: "Fazilet A",
          source: "Tirmizi, Deavat",
          recommendedCount: 33
        },
        {
          _id: "dhikr-b",
          nameTurkish: "Dua B",
          nameArabic: "الدعاء ب",
          transliteration: "Dua B",
          meaning: "Anlam B",
          virtue: "Fazilet B",
          source: "Buhari, Deavat",
          recommendedCount: 100
        },
        {
          _id: "dhikr-c",
          nameTurkish: "Dua C",
          nameArabic: "الدعاء ج",
          transliteration: "Dua C",
          meaning: "Anlam C",
          virtue: "Fazilet C",
          source: "Müslim, Zikir",
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
