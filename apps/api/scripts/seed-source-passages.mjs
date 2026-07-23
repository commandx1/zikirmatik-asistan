/* global console, process */
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { chunkPages } from './lib/chunking.mjs';
import { embed, embeddingModel, sourceHash } from './lib/embedding.mjs';

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
  const sourceArgIndex = args.indexOf('--source');
  const sourceId = sourceArgIndex !== -1 ? args[sourceArgIndex + 1] : undefined;

  if (!sourceId) {
    throw new Error('Kullanım: node seed-source-passages.mjs --extract --source <source_id>');
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
    await runExtractPhase(source);
  }

  if (seed) {
    await runSeedPhase(source);
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

async function runExtractPhase(source) {
  assertPdfToolsAvailable();

  const pdfPath = resolve(KAYNAKLAR_DIR, source.file);
  if (!existsSync(pdfPath)) {
    throw new Error(`PDF bulunamadı: ${pdfPath}`);
  }

  console.log(`[extract] ${source.source_id}: ${pdfPath}`);

  const pageCount = getPageCount(pdfPath);
  console.log(`[extract] toplam sayfa: ${pageCount}`);

  const pages = [];
  for (let pageNumber = 1; pageNumber <= pageCount; pageNumber += 1) {
    const text = extractPageText(pdfPath, pageNumber);
    pages.push({ page: pageNumber, text });
    if (pageNumber % 25 === 0 || pageNumber === pageCount) {
      console.log(`  ... ${pageNumber}/${pageCount} sayfa çıkarıldı`);
    }
  }

  const chunks = chunkPages(pages);

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

  printSummary(source, pageCount, chunks, outputPath);
}

function printSummary(source, pageCount, chunks, outputPath) {
  const lengths = chunks.map((c) => c.text.length);
  const total = lengths.reduce((a, b) => a + b, 0);
  const avg = lengths.length > 0 ? Math.round(total / lengths.length) : 0;
  const min = lengths.length > 0 ? Math.min(...lengths) : 0;
  const max = lengths.length > 0 ? Math.max(...lengths) : 0;

  console.log('');
  console.log(`[özet] kaynak: ${source.source_id}`);
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

async function runSeedPhase(source) {
  const approved = loadApprovedPassages(source);

  if (approved.length === 0) {
    console.log(
      `[seed] ${source.source_id}: onaylanmış (review="approved") pasaj yok, yapılacak bir şey kalmadı.`,
    );
    return;
  }

  console.log(
    `[seed] ${source.source_id}: ${approved.length} onaylanmış pasaj bulundu (model=${embeddingModel()}).`,
  );

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });

  let embedded = 0;
  let skippedUnchanged = 0;
  let failed = 0;

  try {
    const col = mongoose.connection.collection('source_passages');

    for (const passage of approved) {
      try {
        const hash = sourceHash(passage.text);
        const existing = await col.findOne(
          { passageId: passage.passageId },
          { projection: { embeddingSourceHash: 1 } },
        );

        if (existing && existing.embeddingSourceHash === hash) {
          skippedUnchanged += 1;
          continue;
        }

        const vector = await embed(passage.text);
        if (!vector) {
          failed += 1;
          console.warn(
            `  ! passageId=${passage.passageId} embed üretilemedi (OPENAI_API_KEY eksik olabilir), atlanıyor.`,
          );
          continue;
        }

        const now = new Date();
        await col.updateOne(
          { passageId: passage.passageId },
          {
            $set: {
              passageId: passage.passageId,
              sourceId: source.source_id,
              sourceTitle: source.title,
              type: source.type,
              sectionHeading: passage.sectionHeading ?? undefined,
              pageStart: passage.pageStart,
              pageEnd: passage.pageEnd,
              chunkIndex: passage.chunkIndex,
              text: passage.text,
              version: source.version ?? 1,
              embedding: vector,
              embeddingModel: embeddingModel(),
              embeddingSourceHash: hash,
              embeddingUpdatedAt: now,
              updatedAt: now,
            },
            $setOnInsert: { createdAt: now },
          },
          { upsert: true },
        );
        embedded += 1;

        if (embedded % 10 === 0) {
          console.log(`  ... ${embedded} pasaj embed edildi`);
        }
      } catch (error) {
        failed += 1;
        console.warn(
          `  ! passageId=${passage.passageId} işlenemedi: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log('');
    console.log(
      `[seed] özet — toplam_approved=${approved.length}, embed=${embedded}, degismeyen_atlandi=${skippedUnchanged}, hata=${failed}`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
