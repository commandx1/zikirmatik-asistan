/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';
import {
  EMBEDDING_TEXT_VERSION,
  buildSourceText,
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

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const force = process.argv.includes('--force');
  const dryRun = process.argv.includes('--dry-run');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }
  if (!dryRun && !process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY bulunamadı; embedding üretilemez.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false });

  const startedAt = Date.now();

  try {
    const dhikrs = mongoose.connection.collection('dhikrs');
    const cursor = dhikrs.find(
      {},
      {
        projection: {
          name: 1,
          transliteration: 1,
          virtue: 1,
          tags: 1,
          categories: 1,
          suitableFor: 1,
          meaning: 1,
          embedding: 1,
          embeddingSourceHash: 1,
          embeddingTextVersion: 1,
        },
      },
    );

    console.log(
      `Embedding backfill başladı (model=${embeddingModel()}, force=${force}, dry-run=${dryRun}).`,
    );

    let processed = 0;
    let toEmbedCount = 0;
    let skipped = 0;

    // Yeniden embed edilecek dokümanlar: { _id, text, hash }
    const pending = [];

    for await (const doc of cursor) {
      processed += 1;
      const text = buildSourceText(doc);
      const hash = sourceHash(text);

      const needsReembed =
        force ||
        hash !== doc.embeddingSourceHash ||
        Array.isArray(doc.embedding) ||
        doc.embeddingTextVersion !== EMBEDDING_TEXT_VERSION;

      if (!needsReembed) {
        skipped += 1;
        continue;
      }

      toEmbedCount += 1;
      pending.push({ _id: doc._id, text, hash });
    }

    console.log(
      `Taranan=${processed}, güncellenecek=${toEmbedCount}, atlanan=${skipped}.`,
    );

    if (dryRun) {
      console.log('--dry-run: yazma yapılmadı, yalnızca sayımlar gösterildi.');
      return;
    }

    let embedded = 0;
    let failed = 0;

    for (let start = 0; start < pending.length; start += EMBED_BATCH_SIZE) {
      const batch = pending.slice(start, start + EMBED_BATCH_SIZE);
      const vectors = await embedMany(
        batch.map((item) => item.text),
        { batchSize: EMBED_BATCH_SIZE },
      );

      const writeOps = [];
      const now = new Date();
      batch.forEach((item, index) => {
        const vector = vectors[index];
        if (!vector) {
          failed += 1;
          console.warn(`  ! _id=${item._id} için embedding üretilemedi.`);
          return;
        }

        writeOps.push({
          updateOne: {
            filter: { _id: item._id },
            update: {
              $set: {
                embedding: toVectorBinary(vector),
                embeddingSourceHash: item.hash,
                embeddingModel: embeddingModel(),
                embeddingTextVersion: EMBEDDING_TEXT_VERSION,
                embeddingUpdatedAt: now,
              },
            },
          },
        });
      });

      for (let writeStart = 0; writeStart < writeOps.length; writeStart += WRITE_BATCH_SIZE) {
        const writeBatch = writeOps.slice(writeStart, writeStart + WRITE_BATCH_SIZE);
        if (writeBatch.length === 0) {
          continue;
        }
        await dhikrs.bulkWrite(writeBatch, { ordered: false });
        embedded += writeBatch.length;
        console.log(`  ... ${embedded}/${toEmbedCount} embedding güncellendi`);
        await sleep(WRITE_BATCH_SLEEP_MS);
      }
    }

    const usage = getEmbeddingUsageSummary();
    const elapsedSec = ((Date.now() - startedAt) / 1000).toFixed(1);

    console.log('');
    console.log(
      `Backfill tamamlandı. taranan=${processed}, güncellenen=${embedded}, atlanan=${skipped}, hata=${failed}`,
    );
    console.log(
      `İstek=${usage.requests}, girdi_token=${usage.inputTokens}, tahmini_maliyet_usd=${usage.estCostUsd.toFixed(4)}, süre=${elapsedSec}sn`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
