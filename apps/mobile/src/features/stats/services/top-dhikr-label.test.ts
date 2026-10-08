import { describe, expect, it } from "vitest";
import { resolveTopDhikrLabel } from "./top-dhikr-label";

describe("resolveTopDhikrLabel (A-21)", () => {
  const item = { label: "Subhanallah", nameI18n: { tr: "Sübhanallah", en: "Glory be to Allah" } };

  it("uses nameI18n[locale] when present", () => {
    expect(resolveTopDhikrLabel(item, "tr")).toBe("Sübhanallah");
    expect(resolveTopDhikrLabel(item, "en")).toBe("Glory be to Allah");
  });

  it("falls back to label when nameI18n is missing or the locale entry is empty", () => {
    expect(resolveTopDhikrLabel({ label: "Eski" }, "en")).toBe("Eski");
    expect(resolveTopDhikrLabel({ label: "Eski", nameI18n: { tr: "x", en: "" } }, "en")).toBe("Eski");
  });
});
