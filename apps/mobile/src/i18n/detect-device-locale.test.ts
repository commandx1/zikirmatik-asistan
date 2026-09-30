import { afterEach, describe, expect, it, vi } from "vitest";

// Global setup mock'u ../i18n'i keser; burada gerçek modülü, sahte
// expo-localization ile test ediyoruz.
const localization = vi.hoisted(() => ({ languageCode: "en" as string | null }));
vi.mock("expo-localization", () => ({
  getLocales: () => [{ languageCode: localization.languageCode }]
}));

async function detect(languageCode: string | null) {
  localization.languageCode = languageCode;
  const { detectDeviceLocale } = await vi.importActual<typeof import("./index")>("./index");
  return detectDeviceLocale();
}

afterEach(() => vi.resetModules());

describe("detectDeviceLocale", () => {
  it.each([
    ["de", "en"],
    ["tr", "tr"],
    ["en", "en"],
    [null, "en"]
  ])("%s -> %s", async (code, expected) => {
    expect(await detect(code)).toBe(expected);
  });
});
