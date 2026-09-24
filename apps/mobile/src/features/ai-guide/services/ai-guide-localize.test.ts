import { describe, expect, it } from "vitest";
import { resolveRecommendation } from "./ai-guide-localize";
import type { AiGuideRecommendationRaw } from "../types";

const t = (key: string) => key;

const raw: AiGuideRecommendationRaw = {
  id: "d1",
  name: { tr: "Sabır", en: "Patience" },
  arabic: "صبر",
  transliteration: { tr: "", en: "" },
  meaning: { tr: "Anlam", en: "Meaning" },
  source: "Buhârî",
  recommendedCount: 33
};

describe("resolveRecommendation", () => {
  it("resolves localized fields for the active locale and marks the first item primary", () => {
    const result = resolveRecommendation(raw, 0, "en", t);
    expect(result).toMatchObject({
      id: "d1",
      title: "Patience",
      meaning: "Meaning",
      source: "Buhârî",
      virtue: undefined,
      chipEmoji: "💆",
      chipLabel: "ai-guide:recommendation.chipLabelPrimary",
      repeatLabel: "ai-guide:recommendation.repeatLabelPrimary",
      isPrimary: true,
      recommendedCount: 33
    });
  });

  it("falls back to the name when transliteration is empty", () => {
    expect(resolveRecommendation(raw, 0, "tr", t).transliteration).toBe("Sabır");
  });

  it("uses secondary labels for non-first items", () => {
    const result = resolveRecommendation(raw, 1, "tr", t);
    expect(result.chipLabel).toBe("ai-guide:recommendation.chipLabelSecondary");
    expect(result.repeatLabel).toBeUndefined();
    expect(result.isPrimary).toBe(false);
  });
});
