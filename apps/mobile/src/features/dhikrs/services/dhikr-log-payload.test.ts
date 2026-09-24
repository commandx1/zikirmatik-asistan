import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildDhikrLogPayload, resolveDhikrLogSource } from "./dhikr-log-payload";

const OBJECT_ID = "65a1b2c3d4e5f60718293a4b";

describe("buildDhikrLogPayload", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date(2026, 8, 24, 10, 0, 0));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("katalog (ObjectId) zikri dhikrId ile, varsayılan manual kaynakla gönderir", () => {
    const payload = buildDhikrLogPayload(
      { id: OBJECT_ID, target: 33, arabic: "سبحان الله", isFavorite: true },
      { userId: "u1", displayName: "Sübhanallah", count: 33, isCompleted: true }
    );

    expect(Object.entries(payload)).toEqual([
      ["userId", "u1"],
      ["dhikrId", OBJECT_ID],
      ["count", 33],
      ["targetCount", 33],
      ["date", "2026-09-24"],
      ["source", "manual"],
      ["isCompleted", true],
      ["isFavorite", true]
    ]);
  });

  it("kişisel zikri customDhikr* alanlarıyla ve AI bağlamıyla gönderir", () => {
    const payload = buildDhikrLogPayload(
      { id: "custom-1", target: 0, arabic: undefined, isFavorite: false },
      {
        userId: "u1",
        displayName: "Benim zikrim",
        count: 7,
        isCompleted: false,
        sourceContext: { source: "ai", aiRecommendationId: "r1", aiPrompt: "p", aiAssistantNote: "n" }
      }
    );

    expect(Object.entries(payload)).toEqual([
      ["userId", "u1"],
      ["customDhikrId", "custom-1"],
      ["customDhikrName", "Benim zikrim"],
      ["customDhikrArabic", undefined],
      ["count", 7],
      ["targetCount", 0],
      ["date", "2026-09-24"],
      ["source", "ai"],
      ["aiRecommendationId", "r1"],
      ["aiPrompt", "p"],
      ["aiAssistantNote", "n"],
      ["isCompleted", false],
      ["isFavorite", false]
    ]);
  });
});

describe("resolveDhikrLogSource", () => {
  const ai = { dhikrId: "d1", recommendationId: "r1", prompt: "p", assistantNote: "n" };

  it("AI bağlamı aynı zikre aitse ai kaynağı döner (özel günün önüne geçer)", () => {
    expect(resolveDhikrLogSource("d1", ai, "special-day")).toEqual({
      source: "ai",
      aiRecommendationId: "r1",
      aiPrompt: "p",
      aiAssistantNote: "n"
    });
  });

  it("başka zikrin AI bağlamı yok sayılır; özel gün yoksa manual", () => {
    expect(resolveDhikrLogSource("d2", ai, "special-day")).toEqual({ source: "special-day" });
    expect(resolveDhikrLogSource("d2", ai, undefined)).toEqual({ source: "manual" });
    expect(resolveDhikrLogSource("d2", undefined, undefined)).toEqual({ source: "manual" });
  });
});
