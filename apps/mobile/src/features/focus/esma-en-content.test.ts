import { describe, expect, it } from "vitest";
import { ZIKIR_ITEMS } from "../../store/dhikr-catalog-seed";
import { ESMAUL_HUSNA } from "./data";

const TURKISH_CHARS = /[çğıöşüİĞŞÇÖÜ]/;

describe("English content guard", () => {
  it("has 99 Esma entries with real English meanings", () => {
    expect(ESMAUL_HUSNA).toHaveLength(99);
    for (const { meaning } of ESMAUL_HUSNA) {
      expect(meaning.en.trim()).not.toBe("");
      expect(meaning.en).not.toBe(meaning.tr);
      expect(meaning.en).not.toMatch(TURKISH_CHARS);
      expect(meaning.en).not.toContain("**");
    }
  });

  it("has approved English Esma names (verbatim Table C)", () => {
    for (const { transliteration } of ESMAUL_HUSNA) {
      expect(transliteration.en.trim()).not.toBe("");
      expect(transliteration.en).not.toBe(transliteration.tr);
      expect(transliteration.en).not.toMatch(TURKISH_CHARS);
    }
    expect(ESMAUL_HUSNA[0]?.transliteration.en).toBe("Allah");
  });

  it("has 8 seed dhikrs with real English name, transliteration and meaning", () => {
    expect(ZIKIR_ITEMS).toHaveLength(8);
    for (const { name, transliteration, meaning } of ZIKIR_ITEMS) {
      const fields = [name, transliteration, meaning];
      for (const field of fields) {
        expect(typeof field).not.toBe("string");
      }
      const [n, tl, m] = fields as { tr: string; en: string }[];
      expect(m?.en.trim()).not.toBe("");
      expect(m?.en).not.toBe(m?.tr);
      expect(m?.en).not.toContain("**");
      for (const f of [n, tl, m]) {
        expect(f?.en).not.toMatch(TURKISH_CHARS);
      }
    }
  });
});
