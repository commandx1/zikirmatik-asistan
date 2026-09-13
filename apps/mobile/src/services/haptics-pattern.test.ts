import { describe, expect, it } from "vitest";
import { resolveHapticsPattern } from "./haptics-pattern";

// No mocking needed here — haptics-pattern.ts is deliberately dependency-free
// (no expo-haptics import), which is exactly what this file guards against
// regressing (see the comment in haptics-pattern.ts for why that matters:
// pulling expo-haptics into a store breaks under plain Node test runs).
describe("resolveHapticsPattern", () => {
  it("passes through a valid stored pattern", () => {
    expect(resolveHapticsPattern("hafif")).toBe("hafif");
    expect(resolveHapticsPattern("tesbih")).toBe("tesbih");
    expect(resolveHapticsPattern("off")).toBe("off");
    expect(resolveHapticsPattern("orta")).toBe("orta");
  });

  it("falls back to 'orta' when the pattern is missing/invalid and haptics isn't explicitly disabled", () => {
    expect(resolveHapticsPattern(undefined, undefined)).toBe("orta");
    expect(resolveHapticsPattern(null, true)).toBe("orta");
    expect(resolveHapticsPattern("bogus", true)).toBe("orta");
    expect(resolveHapticsPattern(undefined)).toBe("orta");
  });

  it("falls back to 'off' when the pattern is missing/invalid and legacy hapticsEnabled is false", () => {
    expect(resolveHapticsPattern(undefined, false)).toBe("off");
    expect(resolveHapticsPattern("bogus", false)).toBe("off");
    expect(resolveHapticsPattern(null, false)).toBe("off");
  });
});
