/* global console, process */
// source_passages koleksiyonu için Atlas Search (full-text) index'ini
// programatik oluşturur. RetrievalService'in hibrit arama modu
// (AI_HYBRID_SEARCH=1) bu index'i $search aşamasında kullanır — yoksa/
// queryable değilse hibrit arama sessizce vektör-only'e düşer (bkz.
// retrieval.service.ts).
//
// NOT — zikir kataloğu (dhikrs) için ARTIK Atlas Search KULLANILMIYOR:
// cluster'ın FTS index kotası dolu (2 $vectorSearch index'i + bu
// source_passages index'i kotanın tamamını dolduruyor). Zikir bacağı
// standart Mongo $text index'ine (`dhikr_text_idx`) geçirildi — bkz.
// `scripts/create-dhikr-text-index.mjs` ve docs/ai-mimari.md §6. Eski Atlas
// Search tanımı (DHIKR_INDEX) burada yalnızca bir kota slotu açılırsa diye
// `--include-dhikr-atlas` bayrağının ARDINDA saklanır; varsayılan çalıştırma
// bunu HİÇ denemez.
//
//   node scripts/create-text-search-indexes.mjs
//   node scripts/create-text-search-indexes.mjs --wait   (queryable olana kadar bekler)
//   node scripts/create-text-search-indexes.mjs --include-dhikr-atlas   (eski Atlas dhikr index'ini de dener)
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { setTimeout as sleep } from 'node:timers/promises';

const ANALYZER = 'lucene.turkish';

const SOURCE_PASSAGES_INDEX = {
  collection: 'source_passages',
  name: 'source_passages_text_index',
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        text: { type: 'string', analyzer: ANALYZER },
        sectionHeading: { type: 'string', analyzer: ANALYZER },
        sourceTitle: { type: 'string', analyzer: ANALYZER },
        sourceId: { type: 'token' },
      },
    },
  },
};

// tr/en LocalizedText alt-şemaları için { document: { fields: { tr: {...} } } }
// eşlemesi — yalnızca tr alanı indexlenir (korpus/sorgular Türkçe, bkz.
// searchDhikrsByText).
function localizedTextField() {
  return {
    type: 'document',
    fields: {
      tr: { type: 'string', analyzer: ANALYZER },
    },
  };
}

const DHIKR_INDEX = {
  collection: 'dhikrs',
  name: 'dhikr_text_index',
  definition: {
    mappings: {
      dynamic: false,
      fields: {
        name: localizedTextField(),
        transliteration: localizedTextField(),
        meaning: localizedTextField(),
        virtue: localizedTextField(),
        tags: { type: 'string', analyzer: ANALYZER },
        suitableFor: { type: 'string', analyzer: ANALYZER },
        categories: { type: 'string', analyzer: ANALYZER },
        isActive: { type: 'boolean' },
        isVerified: { type: 'boolean' },
      },
    },
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


async function ensureIndex(mongoose, spec, { wait }) {
  const col = mongoose.connection.collection(spec.collection);

  let existing = [];
  try {
    existing = await col.listSearchIndexes().toArray();
  } catch (err) {
    console.warn(
      `[index] ${spec.collection}: listSearchIndexes başarısız (Atlas Search desteği?): ${err.message}`,
    );
  }

  let found = existing.find((i) => i.name === spec.name);
  if (found) {
    console.log(
      `[index] '${spec.name}' zaten var (status=${found.status ?? 'bilinmiyor'}, queryable=${found.queryable ?? '?'}). Dokunulmadı.`,
    );
  } else {
    console.log(
      `[index] '${spec.name}' (${spec.collection}) oluşturuluyor (type=search, analyzer=${ANALYZER})...`,
    );
    const name = await col.createSearchIndex({
      name: spec.name,
      type: 'search',
      definition: spec.definition,
    });
    console.log(
      `[index] oluşturuldu: '${name}'. Atlas index'i build ederken 'queryable' olması birkaç dakika sürebilir.`,
    );
  }

  if (!wait) {
    try {
      const after = await col.listSearchIndexes(spec.name).toArray();
      const st = after[0];
      if (st) {
        console.log(
          `[index] '${spec.name}' durum: status=${st.status ?? '?'}, queryable=${st.queryable ?? '?'}`,
        );
      }
    } catch {
      /* yoklama best-effort */
    }
    return;
  }

  console.log(`[index] '${spec.name}' queryable olana kadar bekleniyor...`);
  const deadline = Date.now() + 5 * 60 * 1000; // en fazla 5 dakika bekle
  while (Date.now() < deadline) {
    const after = await col.listSearchIndexes(spec.name).toArray();
    const st = after[0];
    if (st?.queryable) {
      console.log(`[index] '${spec.name}' queryable (status=${st.status}).`);
      return;
    }
    console.log(
      `[index] '${spec.name}' henüz queryable değil (status=${st?.status ?? '?'}), 10s sonra tekrar denenecek...`,
    );
    await sleep(10000);
  }
  console.warn(
    `[index] '${spec.name}' 5 dakika içinde queryable olmadı — Atlas konsolundan durumu kontrol edin.`,
  );
}

async function main() {
  const wait = process.argv.includes('--wait');
  const includeDhikrAtlas = process.argv.includes('--include-dhikr-atlas');

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
    await ensureIndex(mongoose, SOURCE_PASSAGES_INDEX, { wait });
    if (includeDhikrAtlas) {
      console.log(
        "[index] --include-dhikr-atlas verildi — eski Atlas Search dhikr index'i deneniyor " +
          '(varsayılan olarak DENENMEZ; zikir bacağı artık $text kullanıyor, bkz. create-dhikr-text-index.mjs).',
      );
      await ensureIndex(mongoose, DHIKR_INDEX, { wait });
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[index] HATA:', err.message);
  process.exit(1);
});
