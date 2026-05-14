import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";
import pixelmatch from "pixelmatch";

const root = process.cwd();
const parityMapPath = path.join(root, "docs/design/parity-map.json");

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function readPng(filePath) {
  const buffer = fs.readFileSync(filePath);
  return PNG.sync.read(buffer);
}

function fail(message) {
  console.error(`❌ ${message}`);
  process.exitCode = 1;
}

function ensureDir(filePath) {
  const dir = path.dirname(filePath);
  fs.mkdirSync(dir, { recursive: true });
}

const map = readJson(parityMapPath);
const defaultThreshold = map.meta?.defaultThreshold ?? 0.02;

for (const screen of map.screens) {
  const referencePath = path.join(root, screen.reference);
  const actualPath = path.join(root, screen.actual);

  if (!fs.existsSync(referencePath)) {
    fail(`[${screen.id}] Referans PNG bulunamadı: ${screen.reference}`);
    continue;
  }

  if (!fs.existsSync(actualPath)) {
    fail(`[${screen.id}] Güncel screenshot bulunamadı: ${screen.actual}`);
    continue;
  }

  const ref = readPng(referencePath);
  const act = readPng(actualPath);

  if (ref.width !== act.width || ref.height !== act.height) {
    fail(
      `[${screen.id}] Boyut uyuşmuyor. ref=${ref.width}x${ref.height}, actual=${act.width}x${act.height}`
    );
    continue;
  }

  const diff = new PNG({ width: ref.width, height: ref.height });
  const mismatchedPixels = pixelmatch(ref.data, act.data, diff.data, ref.width, ref.height, {
    threshold: 0.1
  });

  const ratio = mismatchedPixels / (ref.width * ref.height);
  const threshold = screen.threshold ?? defaultThreshold;

  if (ratio > threshold) {
    const diffPath = path.join(root, "artifacts/parity/diff", `${screen.id}.png`);
    ensureDir(diffPath);
    fs.writeFileSync(diffPath, PNG.sync.write(diff));
    fail(`[${screen.id}] Diff oranı yüksek: ${(ratio * 100).toFixed(2)}% > ${(threshold * 100).toFixed(2)}%`);
  } else {
    console.log(`✅ [${screen.id}] ${(ratio * 100).toFixed(2)}% diff ile geçti`);
  }
}

if (process.exitCode) {
  process.exit(process.exitCode);
}
