import { describe, expect, it } from "vitest";
import { shouldShowTemplatePremiumBadge } from "./template-badge";

describe("shouldShowTemplatePremiumBadge (MOB-VRD-25)", () => {
  it("classic (free) templates have no badge", () => {
    expect(shouldShowTemplatePremiumBadge({ isPremium: false })).toBe(false);
  });

  it("Ramazan/Esma/Kandil journeys (isPremium) show the badge", () => {
    expect(shouldShowTemplatePremiumBadge({ isPremium: true })).toBe(true);
  });
});
