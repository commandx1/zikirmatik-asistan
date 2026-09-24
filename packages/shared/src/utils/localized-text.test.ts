import { describe, expect, it } from "vitest";
import { resolveLocalizedText } from "./localized-text";

describe("resolveLocalizedText", () => {
  it("returns a plain string as-is", () => {
    expect(resolveLocalizedText("Elhamdulillah", "en")).toBe("Elhamdulillah");
  });

  it("picks the requested locale from a LocalizedText object", () => {
    expect(resolveLocalizedText({ tr: "Elhamdülillah", en: "Praise be to Allah" }, "en")).toBe("Praise be to Allah");
    expect(resolveLocalizedText({ tr: "Elhamdülillah", en: "Praise be to Allah" }, "tr")).toBe("Elhamdülillah");
  });

  it("falls back to tr, then en, when the requested locale's field is absent (legacy data)", () => {
    const legacy = { tr: "Elhamdülillah" } as unknown as { tr: string; en: string };
    expect(resolveLocalizedText(legacy, "en")).toBe("Elhamdülillah");
  });
});
