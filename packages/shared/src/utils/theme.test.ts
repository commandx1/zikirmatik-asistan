import { describe, expect, it } from "vitest";
import { DEFAULT_THEME, resolveFontScale, resolveFontTokens, resolveThemeName, resolveThemeTokens } from "./theme";

describe("theme resolvers", () => {
  it("falls back to default theme when invalid name is provided", () => {
    expect(resolveThemeName("invalid")).toBe(DEFAULT_THEME);
  });

  it("returns expected token contract", () => {
    const tokens = resolveThemeTokens("gece-koyu");
    expect(tokens).toMatchObject({
      bg: expect.any(String),
      card: expect.any(String),
      textPrimary: expect.any(String),
      textMuted: expect.any(String),
      accent: expect.any(String),
      success: expect.any(String),
      border: expect.any(String)
    });
  });

  it("maps font scales with medium fallback", () => {
    expect(resolveFontScale("small")).toBeLessThan(resolveFontScale("medium"));
    expect(resolveFontScale("unknown")).toBe(resolveFontScale("medium"));
  });

  it("returns scaled font tokens", () => {
    const small = resolveFontTokens("small");
    const medium = resolveFontTokens("medium");
    const large = resolveFontTokens("large");

    expect(small.named.base).toBeLessThan(medium.named.base);
    expect(large.named.base).toBeGreaterThan(medium.named.base);
    expect(medium.px["16"]).toBe(16);
    expect(medium.leading["34"]).toBe(34);
  });
});
