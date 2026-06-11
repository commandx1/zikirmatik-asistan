/* global console, process */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { buildEmbeddingFields, embeddingModel } from './lib/embedding.mjs';

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const force = process.argv.includes('--force');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }
  if (!process.env.OPENAI_API_KEY?.trim()) {
    throw new Error('OPENAI_API_KEY bulunamadı; embedding üretilemez.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false });

  try {
    const dhikrs = mongoose.connection.collection('dhikrs');
    const cursor = dhikrs.find(
      {},
      {
        projection: {
          nameTurkish: 1,
          virtue: 1,
          tags: 1,
          categories: 1,
          suitableFor: 1,
          embeddingSourceHash: 1,
        },
      },
    );

    let processed = 0;
    let embedded = 0;
    let skipped = 0;
    let failed = 0;

    console.log(`Embedding backfill başladı (model=${embeddingModel()}, force=${force}).`);

    for await (const doc of cursor) {
      processed += 1;
      try {
        const currentHash = force ? undefined : doc.embeddingSourceHash;
        const fields = await buildEmbeddingFields(doc, currentHash);

        if (!fields) {
          skipped += 1;
          continue;
        }

        await dhikrs.updateOne({ _id: doc._id }, { $set: fields });
        embedded += 1;

        if (embedded % 25 === 0) {
          console.log(`  ... ${embedded} embedding güncellendi`);
        }
      } catch (error) {
        failed += 1;
        console.warn(
          `  ! ${doc.nameTurkish ?? doc._id} için embedding başarısız: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    console.log(
      `Backfill tamamlandı. toplam=${processed}, embed=${embedded}, atlanan=${skipped}, hata=${failed}`,
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
