import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";

/**
 * tr/*.json ve en/*.json çiftlerinin aynı iç içe key setine sahip olduğunu
 * doğrular. Bir dilde eklenip diğerinde unutulan çeviri anahtarını (örn.
 * bu görevde eklenen errors.aiUnavailable / actions.retry / clarify.hint)
 * derleme zamanında değil ama test zamanında yakalamak için.
 */

const localesDir = path.dirname(fileURLToPath(import.meta.url));
const trDir = path.join(localesDir, "tr");
const enDir = path.join(localesDir, "en");

function listJsonFiles(dir: string): string[] {
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith(".json"))
    .sort();
}

function readJson(filePath: string): unknown {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function collectKeyPaths(value: unknown, prefix = ""): string[] {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return prefix ? [prefix] : [];
  }

  return Object.entries(value as Record<string, unknown>).flatMap(([key, childValue]) =>
    collectKeyPaths(childValue, prefix ? `${prefix}.${key}` : key)
  );
}

describe("locale parity (tr/en)", () => {
  const trFiles = listJsonFiles(trDir);
  const enFiles = listJsonFiles(enDir);

  it("tr and en locale directories contain the same set of files", () => {
    expect(enFiles).toEqual(trFiles);
  });

  it.each(trFiles)("%s has identical nested key paths in tr and en", (fileName) => {
    const trJson = readJson(path.join(trDir, fileName));
    const enPath = path.join(enDir, fileName);
    expect(fs.existsSync(enPath)).toBe(true);
    const enJson = readJson(enPath);

    const trKeys = new Set(collectKeyPaths(trJson));
    const enKeys = new Set(collectKeyPaths(enJson));

    const onlyInTr = [...trKeys].filter((key) => !enKeys.has(key)).sort();
    const onlyInEn = [...enKeys].filter((key) => !trKeys.has(key)).sort();

    const diff = [
      onlyInTr.length ? `Only in tr/${fileName}: ${onlyInTr.join(", ")}` : "",
      onlyInEn.length ? `Only in en/${fileName}: ${onlyInEn.join(", ")}` : ""
    ]
      .filter(Boolean)
      .join("\n");

    expect(diff).toBe("");
  });
});
