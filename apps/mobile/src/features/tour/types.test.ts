import { describe, expect, it } from "vitest";
import { computeTabBarSpotlightBounds } from "./types";

describe("computeTabBarSpotlightBounds", () => {
  const base = {
    screenWidth: 360,
    screenHeight: 800,
    insetBottom: 20,
    statusBarOffset: 0,
    tabIndex: 1,
    tabCount: 5,
    barHeight: 60,
    bottomGap: 10,
    sideMargin: 16,
  };

  it("positions the rect at the real floating pill's top, not the screen bottom", () => {
    const bounds = computeTabBarSpotlightBounds(base);
    // pillTop = screenHeight - insetBottom - bottomGap - barHeight
    expect(bounds.y).toBe(800 - 20 - 10 - 60);
    expect(bounds.height).toBe(60);
  });

  it("accounts for the pill's side margins when computing tab x position", () => {
    const bounds = computeTabBarSpotlightBounds(base);
    const tabWidth = (360 - 16 * 2) / 5;
    expect(bounds.width).toBeCloseTo(tabWidth);
    expect(bounds.x).toBeCloseTo(16 + tabWidth);
  });

  it("shifts the rect down by the Android status bar offset so it aligns inside the translucent Modal", () => {
    const withoutOffset = computeTabBarSpotlightBounds(base);
    const withOffset = computeTabBarSpotlightBounds({ ...base, statusBarOffset: 24 });
    expect(withOffset.y).toBe(withoutOffset.y + 24);
  });
});
