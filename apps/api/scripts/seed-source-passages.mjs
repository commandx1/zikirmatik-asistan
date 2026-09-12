/* global console, process */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import { fileURLToPath } from 'node:url';
import { chunkPages, countArabicScriptChars, stripArabicScript } from './lib/chunking.mjs';
import {
  EMBEDDING_TEXT_VERSION,
  buildPassageEmbeddingText,
  embeddingModel,
  embedMany,
  getEmbeddingUsageSummary,
  sourceHash,
  toVectorBinary,
} from './lib/embedding.mjs';

// OpenAI embeddings.create() çağrısı başına gönderilecek maksimum girdi.
const EMBED_BATCH_SIZE = 64;
// Mongo bulkWrite başına yazılacak maksimum kayıt (M0 küme op limitlerine
// takılmamak için).
const WRITE_BATCH_SIZE = 50;
// Ardışık yazma batch'leri arasındaki bekleme (ms).
const WRITE_BATCH_SLEEP_MS = 250;

const __dirname = dirname(fileURLToPath(import.meta.url));
const KAYNAKLAR_DIR = resolve(__dirname, '../../../docs/kaynaklar');
const MANIFEST_PATH = resolve(KAYNAKLAR_DIR, 'manifest.json');

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }

    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) {
        continue;
      }
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) {
        continue;
      }
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const args = process.argv.slice(2);
  const extract = args.includes('--extract');
  const seed = args.includes('--seed');
  const stripArabic = args.includes('--strip-arabic');
  const headingColon = args.includes('--heading-colon');
  const force = args.includes('--force');
  const dryRun = args.includes('--dry-run');
  const sourceArgIndex = args.indexOf('--source');
  const sourceId = sourceArgIndex !== -1 ? args[sourceArgIndex + 1] : undefined;

  if (!sourceId) {
    throw new Error(
      'Kullanım: node seed-source-passages.mjs --extract --source <source_id> [--strip-arabic] [--heading-colon] | --seed --source <source_id>',
    );
  }

  if (!extract && !seed) {
    throw new Error('En az bir mod belirtilmeli: --extract veya --seed');
  }

  const manifest = loadManifest();
  const source = manifest.sources.find((entry) => entry.source_id === sourceId);
  if (!source) {
    throw new Error(
      `manifest.json içinde "${sourceId}" bulunamadı. Mevcut kaynaklar: ${manifest.sources
        .map((s) => s.source_id)
        .join(', ')}`,
    );
  }

  if (extract) {
    await runExtractPhase(source, { stripArabic, headingColon });
  }

  if (seed) {
    await runSeedPhase(source, { force, dryRun });
  }
}

function loadManifest() {
  if (!existsSync(MANIFEST_PATH)) {
    throw new Error(`manifest.json bulunamadı: ${MANIFEST_PATH}`);
  }
  const raw = readFileSync(MANIFEST_PATH, 'utf8');
  return JSON.parse(raw);
}

function assertPdfToolsAvailable() {
  for (const tool of ['pdftotext', 'pdfinfo']) {
    try {
      execFileSync(tool, ['-v'], { stdio: 'ignore' });
    } catch (error) {
      if (error && error.code === 'ENOENT') {
        throw new Error(
          `"${tool}" bulunamadı (poppler-utils gerekli). Kurulum için: brew install poppler`,
        );
      }
      // pdftotext/pdfinfo -v exits non-zero on some poppler builds but still prints
      // version info to stderr; treat anything other than ENOENT as "available".
    }
  }
}

function getPageCount(pdfPath) {
  const output = execFileSync('pdfinfo', [pdfPath], { encoding: 'utf8' });
  const match = output.match(/^Pages:\s*(\d+)/m);
  if (!match) {
    throw new Error(`pdfinfo çıktısından sayfa sayısı okunamadı: ${pdfPath}`);
  }
  return Number.parseInt(match[1], 10);
}

function extractPageText(pdfPath, pageNumber) {
  return execFileSync(
    'pdftotext',
    ['-layout', '-f', String(pageNumber), '-l', String(pageNumber), pdfPath, '-'],
    { encoding: 'utf8', maxBuffer: 1024 * 1024 * 32 },
  );
}

function passageId(sourceId, chunkIndex) {
  return createHash('sha1').update(`${sourceId}:${chunkIndex}`).digest('hex');
}

async function runExtractPhase(source, { stripArabic = false, headingColon = false } = {}) {
  assertPdfToolsAvailable();

  const pdfPath = resolve(KAYNAKLAR_DIR, source.file);
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF bulunamadı: ${pdfPath}`);
  }

  console.log(`[extract] ${source.source_id}: ${pdfPath}`);
  if (stripArabic) {
    console.log('[extract] --strip-arabic aktif: sayfa metni chunk\'lamadan önce temizlenecek.');
  }
  if (headingColon) {
    console.log(
      '[extract] --heading-colon aktif: sonunda tek ":" olan BÜYÜK HARF/Title Case satırlar da başlık (sectionHeading) sayılacak, ":" kaldırılacak.',
    );
  }

  const pageCount = getPageCount(pdfPath);
  console.log(`[extract] toplam sayfa: ${pageCount}`);

  const pages = [];
  let arabicCharsRemoved = 0;
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    let text = extractPageText(pdfPath, pageNumber);
    if (stripArabic) {
      arabicCharsRemoved += countArabicScriptChars(text);
      text = stripArabicScript(text);
    }
    pages.push({ page: pageNumber, text });
    if (pageNumber % 25 === 0 || pageNumber === pageCount) {
      console.log(`  ... ${pageNumber}/${pageCount} sayfa çıkarıldı`);
    }
  }

  const chunks = chunkPages(pages, { headingColon });

  const outputPath = resolve(KAYNAKLAR_DIR, `${source.source_id}.passages.jsonl`);
  const lines = chunks.map((chunk) => {
    const record = {
      passageId: passageId(source.source_id, chunk.chunkIndex),
      sourceId: source.source_id,
      type: source.type,
      sectionHeading: chunk.sectionHeading,
      pageStart: chunk.pageStart,
      pageEnd: chunk.pageEnd,
      chunkIndex: chunk.chunkIndex,
      review: 'pending',
      text: chunk.text,
    };
    return JSON.stringify(record);
  });
  writeFileSync(outputPath, lines.join('\n') + (lines.length > 0 ? '\n' : ''), 'utf8');

  printSummary(source, pageCount, chunks, outputPath, { stripArabic, arabicCharsRemoved, headingColon });
}

function printSummary(
  source,
  pageCount,
  chunks,
  outputPath,
  { stripArabic = false, arabicCharsRemoved = 0, headingColon = false } = {},
) {
  const lengths = chunks.map((c) => c.text.length);
  const total = lengths.reduce((a, b) => a + b, 0);
  const avg = lengths.length > 0 ? Math.round(total / lengths.length) : 0;
  const min = lengths.length > 0 ? Math.min(...lengths) : 0;
  const max = lengths.length > 0 ? Math.max(...lengths) : 0;

  console.log('');
  console.log(`[özet] kaynak: ${source.source_id}`);
  console.log(
    `[özet] arapça temizleme: ${stripArabic ? `açık (temizlenen arapça karakter: ${arabicCharsRemoved})` : 'kapalı'}`,
  );
  console.log(`[özet] heading-colon: ${headingColon ? 'açık' : 'kapalı'}`);
  console.log(`[özet] toplam sayfa: ${pageCount}`);
  console.log(`[özet] toplam chunk: ${chunks.length}`);
  console.log(`[özet] ortalama chunk uzunluğu: ${avg} karakter`);
  console.log(`[özet] min/max chunk uzunluğu: ${min} / ${max}`);
  console.log(`[özet] çıktı: ${outputPath}`);
  console.log('');
  console.log('[önizleme] ilk 2 chunk:');
  for (const chunk of chunks.slice(0, 2)) {
    console.log('---');
    console.log(
      `chunkIndex=${chunk.chunkIndex} pageStart=${chunk.pageStart} pageEnd=${chunk.pageEnd} sectionHeading=${JSON.stringify(
        chunk.sectionHeading,
      )} length=${chunk.text.length}`,
    );
    console.log(chunk.text.slice(0, 400));
  }
}

function loadApprovedPassages(source) {
  const jsonlPath = resolve(KAYNAKLAR_DIR, `${source.source_id}.passages.jsonl`);
  if (!existsSync(jsonlPath)) {
    throw new Error(`Passage dosyası bulunamadı: ${jsonlPath} (önce --extract çalıştırılmalı)`);
  }

  const raw = readFileSync(jsonlPath, 'utf8');
  const records = raw
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0)
    .map((line) => JSON.parse(line));

  return records.filter((record) => record.review === 'approved');
}

async function runSeedPhase(source, { force = false, dryRun = false } = {}) {
  const approved = loadApprovedPassages(source);

  if (approved.length === 0) {
    console.log(
      `[seed] ${source.source_id}: onaylanmış (review="approved") pasaj yok, yapılacak bir şey kalmadı.`,
    );
    return;
  }

  console.log(
    `[seed] ${source.source_id}: ${approved.length} onaylanmış pasaj bulundu (model=${embeddingModel()}, force=${force}, dry-run=${dryRun}).`,
  );

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }
  if (!dryRun && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY bulunamadı; embedding üretilemez.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });

  const startedAt = Date.now();

  try {
    const col = mongoose.connection.collection('source_passages');

    // Mevcut hash/embedding durumunu tek sorguda çek (passage başına
    // findOne yerine) — M0 kümesinde gereksiz round-trip'i azaltır.
    const existingDocs = await col
      .find(
        { passageId: { $in: approved.map((passage) => passage.passageId) } },
        { projection: { passageId: 1, embeddingSourceHash: 1, embedding: 1, embeddingTextVersion: 1 } },
      )
      .toArray();
    const existingByPassageId = new Map(
      existingDocs.map((doc) => [doc.passageId, doc]),
    );

    // Her pasaj için embedding girdi metnini (başlık + bölüm + metin) kur,
    // hash'i hesapla ve yeniden embed gerekip gerekmediğine karar ver.
    const candidates = approved.map((passage) => {
      const composedText = buildPassageEmbeddingText({
        sourceTitle: source.title,
        sectionHeading: passage.sectionHeading,
        text: passage.text,
      });
      const hash = sourceHash(composedText);
      const existing = existingByPassageId.get(passage.passageId);

      const needsReembed =
        force ||
        !existing ||
        existing.embeddingSourceHash !== hash ||
        Array.isArray(existing.embedding) ||
        existing.embeddingTextVersion !== EMBEDDING_TEXT_VERSION;

      return { passage, composedText, hash, needsReembed };
    });

    const toEmbed = candidates.filter((c) => c.needsReembed);
    const unchanged = candidates.length - toEmbed.length;

    console.log(
      `[seed] onaylı=${approved.length}, güncellenecek=${toEmbed.length}, değişmeyen=${unchanged}.`,
    );

    if (dryRun) {
      console.log('[seed] --dry-run: yazma yapılmadı, yalnızca sayımlar gösterildi.');
      return;
    }

    let embedded = 0;
    let failed = 0;

    for (let start = 0; start < toEmbed.length; start += EMBED_BATCH_SIZE) {
      const batch = toEmbed.slice(start, start + EMBED_BATCH_SIZE);
      const vectors = await embedMany(
        batch.map((item) => item.composedText),
        { batchSize: EMBED_BATCH_SIZE },
      );

      const now = new Date();
      const writeOps = [];
      batch.forEach((item, index) => {
        const vector = vectors[index];
        if (!vector) {
          failed += 1;
          console.warn(
            `  ! passageId=${item.passage.passageId} embed üretilemedi, atlanıyor.`,
          );
          return;
        }

        writeOps.push({
          updateOne: {
            filter: { passageId: item.passage.passageId },
            update: {
              $set: {
                passageId: item.passage.passageId,
                sourceId: source.source_id,
                sourceTitle: source.title,
                type: source.type,
                sectionHeading: item.passage.sectionHeading ?? undefined,
                pageStart: item.passage.pageStart,
                pageEnd: item.passage.pageEnd,
                chunkIndex: item.passage.chunkIndex,
                text: item.passage.text,
                version: source.version ?? 1,
                embedding: toVectorBinary(vector),
                embeddingModel: embeddingModel(),
                embeddingSourceHash: item.hash,
                embeddingTextVersion: EMBEDDING_TEXT_VERSION,
                embeddingUpdatedAt: now,
                updatedAt: now,
              },
              $setOnInsert: { createdAt: now },
            },
            upsert: true,
          },
        });
      });

      for (let writeStart = 0; writeStart < writeOps.length; writeStart += WRITE_BATCH_SIZE) {
        const writeBatch = writeOps.slice(writeStart, writeStart + WRITE_BATCH_SIZE);
        if (writeBatch.length === 0) {
          continue;
        }
        await col.bulkWrite(writeBatch, { ordered: false });
        embedded += writeBatch.length;
        console.log(`  ... ${embedded}/${toEmbed.length} pasaj embed edildi`);
        await sleep(WRITE_BATCH_SLEEP_MS);
      }
    }

    const usage = getEmbeddingUsageSummary();
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

    console.log('');
    console.log(
      `[seed] özet — toplam_approved=${approved.length}, embed=${embedded}, degismeyen_atlandi=${unchanged}, hata=${failed}`,
    );
    console.log(
      `[seed] istek=${usage.requests}, girdi_token=${usage.inputTokens}, tahmini_maliyet_usd=${usage.estCostUsd.toFixed(4)}, süre=${elapsedSec}sn`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
