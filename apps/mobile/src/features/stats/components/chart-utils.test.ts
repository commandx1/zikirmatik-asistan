import { describe, expect, it } from "vitest";
import trStats from "../../../i18n/locales/tr/stats.json";
import enStats from "../../../i18n/locales/en/stats.json";
import { SOURCE_ORDER } from "./chart-utils";

describe("kaynak dağılımı (A-14): Halka", () => {
  it("SOURCE_ORDER 'circle' içerir ve her anahtarın tr + en etiketi var", () => {
    expect(SOURCE_ORDER).toContain("circle");
    for (const key of SOURCE_ORDER) {
      expect((trStats.sourceLabels as Record<string, string>)[key]).toBeTypeOf("string");
      expect((enStats.sourceLabels as Record<string, string>)[key]).toBeTypeOf("string");
    }
    expect(trStats.sourceLabels.circle).toBe("Halka");
    expect(enStats.sourceLabels.circle).toBe("Circle");
  });
});
