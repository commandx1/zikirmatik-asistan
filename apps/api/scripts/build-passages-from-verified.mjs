/* global console, process */
/**
 * Görsel olarak doğrulanmış sayfa metinlerinden passages.jsonl üretir.
 *
 * Taranmış (metin katmanı olmayan) PDF'lerde pdftotext çalışmadığı için bu üç
 * kaynağın metni sayfa görüntülerinden tek tek okunarak `verified/<source>/pNNN.txt`
 * dosyalarına yazıldı. Bu betik o dosyaları seed-source-passages.mjs ile aynı
 * chunker'dan geçirip aynı şemada jsonl üretir; passageId hesabı da birebir aynıdır
 * (sha1("sourceId:chunkIndex")), böylece mevcut seed/upsert akışı bozulmaz.
 *
 * Kullanım:
 *   node build-passages-from-verified.mjs --source <source_id> --verified-dir <dizin> [--dry-run]
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkPages } from './lib/chunking.mjs';

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAYNAKLAR_DIR = resolve(__dirname, '../../../docs/kaynaklar');
const MANIFEST_PATH = resolve(KAYNAKLAR_DIR, 'manifest.json');

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\uFB50-\uFDFF\uFE70-\uFEFF]/;

function passageId(sourceId, chunkIndex) {
  return createHash('sha1').update(`${sourceId}:${chunkIndex}`).digest('hex');
}

function parseArgs(argv) {
  const args = argv.slice(2);
  const read = (flag) => {
    const index = args.indexOf(flag);
    return index !== -1 ? args[index + 1] : undefined;
  };
  return {
    sourceId: read('--source'),
    verifiedDir: read('--verified-dir'),
    dryRun: args.includes('--dry-run'),
  };
}

function loadVerifiedPages(verifiedDir) {
  const files = readdirSync(verifiedDir)
    .filter((name) => /^p\d{3}\.txt$/.test(name))
    .sort();

  if (files.length === 0) {
    throw new Error(`Doğrulanmış sayfa dosyası bulunamadı: ${verifiedDir}`);
  }

  const pages = files.map((name) => ({
    page: Number.parseInt(name.slice(1, 4), 10),
    text: readFileSync(resolve(verifiedDir, name), 'utf8'),
  }));

  const expected = pages.length;
  const missing = [];
  for (let page = 1; page <= pages[pages.length - 1].page; page += 1) {
    if (!pages.some((entry) => entry.page === page)) {
      missing.push(page);
    }
  }

  return { pages, expected, missing };
}

function qaReport(sourceId, pages, chunks) {
  const emptyPages = pages.filter((page) => page.text.trim().length === 0).map((page) => page.page);
  const arabicPages = pages.filter((page) => ARABIC_RANGE.test(page.text)).map((page) => page.page);
  const unreadable = pages
    .filter((page) => page.text.includes('[?]'))
    .map((page) => page.page);

  console.log('');
  console.log(`[qa] ${sourceId}`);
  console.log(`[qa] boş sayfa (${emptyPages.length}): ${emptyPages.join(', ') || '-'}`);
  console.log(`[qa] arapça harf sızmış sayfa (${arabicPages.length}): ${arabicPages.join(', ') || '-'}`);
  console.log(`[qa] "[?]" okunamayan işareti (${unreadable.length}): ${unreadable.join(', ') || '-'}`);
  console.log(`[qa] üretilen chunk: ${chunks.length}`);
}

function diffAgainstExisting(sourceId, chunks) {
  const existingPath = resolve(KAYNAKLAR_DIR, `${sourceId}.passages.jsonl`);
  if (!existsSync(existingPath)) {
    return;
  }

  const existing = readFileSync(existingPath, 'utf8')
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line));

  const oldChars = existing.reduce((sum, record) => sum + record.text.length, 0);
  const newChars = chunks.reduce((sum, chunk) => sum + chunk.text.length, 0);
  const delta = newChars - oldChars;
  const pct = oldChars > 0 ? ((delta / oldChars) * 100).toFixed(1) : '0.0';

  console.log(
    `[fark] pasaj: ${existing.length} -> ${chunks.length} | karakter: ${oldChars} -> ${newChars} (${
      delta >= 0 ? '+' : ''
    }${delta}, %${pct})`,
  );
}

function main() {
  const { sourceId, verifiedDir, dryRun } = parseArgs(process.argv);

  if (!sourceId || !verifiedDir) {
    throw new Error(
      'Kullanım: node build-passages-from-verified.mjs --source <source_id> --verified-dir <dizin> [--dry-run]',
    );
  }

  const manifest = JSON.parse(readFileSync(MANIFEST_PATH, 'utf8'));
  const source = manifest.sources.find((entry) => entry.source_id === sourceId);
  if (!source) {
    throw new Error(`manifest.json içinde "${sourceId}" bulunamadı.`);
  }

  const { pages, missing } = loadVerifiedPages(resolve(verifiedDir));
  if (missing.length > 0) {
    throw new Error(
      `Eksik doğrulanmış sayfa var, üretim durduruldu: ${missing.join(', ')}. ` +
        'Hiçbir sayfa atlanmamalı.',
    );
  }

  console.log(`[üret] ${sourceId}: ${pages.length} doğrulanmış sayfa okundu.`);

  const chunks = chunkPages(pages);
  qaReport(sourceId, pages, chunks);
  diffAgainstExisting(sourceId, chunks);

  if (dryRun) {
    console.log('[üret] --dry-run: dosya yazılmadı.');
    return;
  }

  const outputPath = resolve(KAYNAKLAR_DIR, `${sourceId}.passages.jsonl`);
  const lines = chunks.map((chunk) =>
    JSON.stringify({
      passageId: passageId(sourceId, chunk.chunkIndex),
      sourceId,
      type: source.type,
      sectionHeading: chunk.sectionHeading,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chunkIndex: chunk.chunkIndex,
      review: 'approved',
      text: chunk.text,
    }),
  );
  writeFileSync(outputPath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf8');
  console.log(`[üret] yazıldı: ${outputPath}`);
}

main();
