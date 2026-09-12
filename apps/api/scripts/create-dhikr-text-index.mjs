/* global console, process */
// `dhikrs` koleksiyonu için standart MongoDB $text index'ini programatik
// oluşturur (Atlas Search DEĞİL). RetrievalService'in hibrit arama modu
// (AI_HYBRID_SEARCH=1) zikir bacağında bu index'i $text sorgusunda kullanır
// — bkz. retrieval.service.ts `runDhikrTextSearch` ve docs/ai-mimari.md §6.
//
// Neden $text ve neden Atlas Search değil: cluster'ın Atlas Search (FTS)
// index kotası dolu (bkz. docs/ai-mimari.md §6 "Kapasite kısıtı") — 2
// $vectorSearch index'i zaten kotanın çoğunu kullanıyor ve
// `dhikr_text_index` (Atlas Search) oluşturma denemesi "The maximum number
// of FTS indexes has been reached" hatası veriyordu. Standart Mongo $text
// index'i Atlas Search kotasından tamamen bağımsızdır.
//
// Index tanımı ayrıca dhikr.schema.ts içinde de DhikrSchema.index(...) ile
// belirtilir; app autoIndex:true ile açılışta da oluşturabilir (bkz.
// app.module.ts). Bu script, prod'da/CI'da index'in HER ZAMAN var olduğunu
// garanti etmek için idempotent bir yol sağlar.
//
//   node scripts/create-dhikr-text-index.mjs
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const INDEX_NAME = 'dhikr_text_idx';
const INDEX_SPEC = {
  'name.tr': 'text',
  'transliteration.tr': 'text',
  'meaning.tr': 'text',
  'virtue.tr': 'text',
  tags: 'text',
  suitableFor: 'text',
  categories: 'text',
};
const INDEX_OPTIONS = {
  name: INDEX_NAME,
  default_language: 'turkish',
  weights: {
    'name.tr': 10,
    'transliteration.tr': 8,
    tags: 5,
    suitableFor: 5,
    categories: 3,
    'meaning.tr': 2,
    'virtue.tr': 1,
  },
};

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
    const col = mongoose.connection.collection('dhikrs');

    const existing = await col.indexes();
    const found = existing.find((i) => i.name === INDEX_NAME);
    const otherTextIndex = existing.find(
      (i) => i.name !== INDEX_NAME && i.textIndexVersion !== undefined,
    );

    if (otherTextIndex) {
      console.warn(
        `[index] dhikrs koleksiyonunda BAŞKA bir text index bulundu: '${otherTextIndex.name}'. ` +
          `Mongo koleksiyon başına yalnızca BİR text index'e izin verir — önce onu düşürün.`,
      );
    }

    if (found) {
      console.log(
        `[index] '${INDEX_NAME}' zaten var. Dokunulmadı.\n` +
          JSON.stringify(found, null, 2),
      );
    } else {
      console.log(`[index] '${INDEX_NAME}' (dhikrs) oluşturuluyor (type=text)...`);
      const name = await col.createIndex(INDEX_SPEC, INDEX_OPTIONS);
      console.log(`[index] oluşturuldu: '${name}'.`);
    }

    console.log('[index] dhikrs koleksiyonunun tüm index\'leri:');
    const all = await col.indexes();
    console.log(JSON.stringify(all, null, 2));
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[index] HATA:', err.message);
  process.exit(1);
});
