import { describe, expect, it } from "vitest";
import { withAlpha } from "./color";

describe("withAlpha", () => {
  it("converts a 6-digit hex to rgba", () => {
    expect(withAlpha("#C8972A", 0.5)).toBe("rgba(200, 151, 42, 0.5)");
  });

  it("accepts an 8-digit hex (ignoring its own alpha channel) and clamps alpha to [0,1]", () => {
    expect(withAlpha("#C8972AFF", 1.5)).toBe("rgba(200, 151, 42, 1)");
    expect(withAlpha("#C8972AFF", -1)).toBe("rgba(200, 151, 42, 0)");
  });

  it("returns the input unchanged for an unsupported length", () => {
    expect(withAlpha("#FFF", 0.5)).toBe("#FFF");
  });
});
