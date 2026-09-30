import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * en/*.json içinde Türkçe'ye özgü harf içeren değer kalmadığını doğrular
 * (İngilizce kullanıcıya Türkçe metin sızmasın). widget.json i18n/index.ts'e
 * kayıtlı olmasa da (widget'ın headless yolu okur) dahildir.
 */
const enDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "en");
const TURKISH_CHARS = /[çğıöşüİĞŞÇÖÜ]/;

// "dosya:anahtar.yolu" -> neden izinli.
const ALLOW_LIST: Record<string, string> = {
  // Dil seçicide her dil kendi adıyla gösterilir (endonym).
  "profile.json:language.turkish": "Turkish language endonym: Türkçe"
};

function collectStrings(value: unknown, prefix = ""): Array<[string, string]> {
  if (typeof value === "string") return [[prefix, value]];
  if (value === null || typeof value !== "object") return [];
  return Object.entries(value).flatMap(([key, child]) =>
    collectStrings(child, prefix ? `${prefix}.${key}` : key)
  );
}

describe("en locale has no Turkish leaks", () => {
  it("no string value contains a Turkish-specific character", () => {
    const leaks: string[] = [];
    for (const file of fs.readdirSync(enDir).filter((f) => f.endsWith(".json"))) {
      const json: unknown = JSON.parse(fs.readFileSync(path.join(enDir, file), "utf8"));
      for (const [keyPath, value] of collectStrings(json)) {
        if (TURKISH_CHARS.test(value) && !(`${file}:${keyPath}` in ALLOW_LIST)) {
          leaks.push(`${file}:${keyPath} = ${value}`);
        }
      }
    }
    expect(leaks).toEqual([]);
  });
});
