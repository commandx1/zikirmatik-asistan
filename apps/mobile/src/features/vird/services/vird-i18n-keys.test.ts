import { describe, expect, it } from "vitest";
import { VIRD_ERROR_CODE } from "@zikirmatik/shared";
import trVird from "../../../i18n/locales/tr/vird.json";
import enVird from "../../../i18n/locales/en/vird.json";
import { resolveVirdErrorMessage } from "./vird-error-codes";

// Global setup mock'unda i18n.t(key) => key; böylece gerçek eşleme
// (vird-error-codes.ts VIRD_ERROR_MESSAGE_KEY) üzerinden anahtar okunur.
describe("vird error code i18n key coverage", () => {
  it.each(Object.values(VIRD_ERROR_CODE))("has a tr and en errors.* key for %s", (code) => {
    const key = resolveVirdErrorMessage(code, "fallback");
    expect(key).toMatch(/^vird:errors\./);
    const leaf = key.slice("vird:errors.".length);
    expect((trVird.errors as Record<string, string>)[leaf]).toBeTypeOf("string");
    expect((enVird.errors as Record<string, string>)[leaf]).toBeTypeOf("string");
  });

  it("falls back for unknown codes", () => {
    expect(resolveVirdErrorMessage("NOPE", "fallback")).toBe("fallback");
    expect(resolveVirdErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});
