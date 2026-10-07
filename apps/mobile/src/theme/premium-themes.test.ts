import { describe, expect, it } from "vitest";
import { THEME_LABELS } from "./labels";
import { FREE_DEFAULT_THEME, PREMIUM_THEME_NAMES, resolveAllowedTheme } from "./premium-themes";

describe("resolveAllowedTheme (A-07 + M-13)", () => {
  it("the free default is itself free", () => {
    expect(PREMIUM_THEME_NAMES.has(FREE_DEFAULT_THEME)).toBe(false);
  });

  it("every premium theme reverts to the free default when not premium", () => {
    for (const name of PREMIUM_THEME_NAMES) {
      expect(resolveAllowedTheme(name, false)).toBe(FREE_DEFAULT_THEME);
      expect(resolveAllowedTheme(name, true)).toBe(name);
    }
  });

  it("free themes are never touched", () => {
    for (const name of Object.keys(THEME_LABELS) as (keyof typeof THEME_LABELS)[]) {
      if (!PREMIUM_THEME_NAMES.has(name)) expect(resolveAllowedTheme(name, false)).toBe(name);
    }
  });

  it("premium set only contains known themes", () => {
    for (const name of PREMIUM_THEME_NAMES) expect(name in THEME_LABELS).toBe(true);
  });
});
