/* global console, process */
// source_passages koleksiyonu için Atlas Vector Search index'ini programatik
// oluşturur. ai.service.ts:944 bu index adını arar. Idempotent: varsa dokunmaz.
//   node scripts/create-source-passage-index.mjs
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const INDEX_NAME = 'source_passages_vector_index';
const NUM_DIMENSIONS = 3072; // text-embedding-3-large
const SIMILARITY = 'cosine';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const sep = trimmed.indexOf('=');
      if (sep <= 0) continue;
      const key = trimmed.slice(0, sep).trim();
      let value = trimmed.slice(sep + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    const col = mongoose.connection.collection('source_passages');

    // Mevcut search index'lerini listele (idempotent kontrol)
    let existing = [];
    try {
      existing = await col.listSearchIndexes().toArray();
    } catch (err) {
      console.warn(
        `[index] listSearchIndexes başarısız (Atlas Search desteği?): ${err.message}`,
      );
    }
    const found = existing.find((i) => i.name === INDEX_NAME);
    if (found) {
      console.log(
        `[index] '${INDEX_NAME}' zaten var (status=${found.status ?? 'bilinmiyor'}, queryable=${found.queryable ?? '?'}). Dokunulmadı.`,
      );
      return;
    }

    const definition = {
      fields: [
        {
          type: 'vector',
          path: 'embedding',
          numDimensions: NUM_DIMENSIONS,
          similarity: SIMILARITY,
        },
      ],
    };

    console.log(
      `[index] '${INDEX_NAME}' oluşturuluyor (path=embedding, dims=${NUM_DIMENSIONS}, similarity=${SIMILARITY})...`,
    );
    const name = await col.createSearchIndex({
      name: INDEX_NAME,
      type: 'vectorSearch',
      definition,
    });
    console.log(
      `[index] oluşturuldu: '${name}'. Atlas index'i build ederken 'queryable' olması birkaç dakika sürebilir.`,
    );

    // Kısa bir durum yoklaması
    try {
      const after = await col.listSearchIndexes(INDEX_NAME).toArray();
      const st = after[0];
      if (st) {
        console.log(
          `[index] durum: status=${st.status ?? '?'}, queryable=${st.queryable ?? '?'}`,
        );
      }
    } catch {
      /* yoklama best-effort */
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[index] HATA:', err.message);
  process.exit(1);
});
