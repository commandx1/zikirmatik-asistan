import { describe, expect, it } from "vitest";
import { resolvePersonalDhikrName } from "./personal-dhikr-label";

describe("resolvePersonalDhikrName (A-21)", () => {
  it("uses the name when present", () => {
    expect(resolvePersonalDhikrName({ name: " Sabah " }, "Zikir")).toBe("Sabah");
  });
  it.each([null, undefined, "", "   "])("name %j falls back to transliteration, then the localized label", (name) => {
    expect(resolvePersonalDhikrName({ name, transliteration: " Subhanallah " }, "Zikir")).toBe("Subhanallah");
    expect(resolvePersonalDhikrName({ name }, "Zikir")).toBe("Zikir");
  });
});
