/* global console, process */
/**
 * `dhikrs` koleksiyonunu apps/api/scripts/data/sourceDataset.mjs içindeki
 * SOURCE_DATASETS'ten, yalnızca stabil `key` alanı üzerinden upsert eder.
 * Legacy nameTurkish tabanlı eşleştirme yoktur (DB'de hiç eski format kaydı
 * kalmayacak şekilde tamamen sıfırlanmış olacağı için buna gerek yok).
 *
 * Embedding alanlarına dokunmaz — o iş `seed:embeddings` (backfill-dhikr-
 * embeddings.mjs) betiğine ait.
 *
 * Kullanım:
 *   node scripts/seed-dhikrs.mjs --dry-run   # hiçbir yazma yapmadan özet basar
 *   node scripts/seed-dhikrs.mjs             # gerçek upsert
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
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

function uniq(items) {
  return [...new Set((items ?? []).filter(Boolean))];
}

/**
 * Tüm dataset'lerdeki dhikrItems'ı düzleştirip, hangi dataset'ten geldiğini
 * de işaretler (raporlama için).
 */
function collectItems(datasets) {
  const flat = [];
  for (const dataset of datasets) {
    if (!Array.isArray(dataset.dhikrItems)) continue;
    for (const item of dataset.dhikrItems) {
      flat.push({ item, datasetKey: dataset.key, datasetLabel: dataset.label });
    }
  }
  return flat;
}

/**
 * Her kaydı upsert için hazırlar ve doğrular. Geçersiz kayıtlar (key eksik,
 * name.tr boş) `invalid` listesine düşer ve seed'e dahil edilmez.
 */
function validateItems(flatItems) {
  const valid = [];
  const invalid = [];
  const keyCounts = new Map();

  for (const entry of flatItems) {
    const { item, datasetKey } = entry;
    const key = typeof item.key === 'string' ? item.key.trim() : '';
    const nameTr = typeof item.name?.tr === 'string' ? item.name.tr.trim() : '';

    if (!key) {
      invalid.push({ datasetKey, key: item.key ?? '(yok)', reason: 'key eksik' });
      continue;
    }
    if (!nameTr) {
      invalid.push({ datasetKey, key, reason: 'name.tr boş/eksik' });
      continue;
    }

    keyCounts.set(key, (keyCounts.get(key) ?? 0) + 1);
    valid.push(entry);
  }

  const duplicateKeys = [...keyCounts.entries()]
    .filter(([, count]) => count > 1)
    .map(([key, count]) => ({ key, count }));

  return { valid, invalid, duplicateKeys };
}

function buildDoc(item) {
  const now = new Date();
  return {
    key: item.key,
    nameArabic: item.nameArabic,
    name: item.name,
    transliteration: item.transliteration,
    meaning: item.meaning,
    virtue: item.virtue,
    source: item.source,
    tags: uniq(item.tags),
    categories: uniq(item.categories),
    timeOfDay: item.timeOfDay ?? 'any',
    recommendedCount: item.recommendedCount ?? 33,
    suitableFor: uniq(item.suitableFor),
    isVerified: true,
    isActive: true,
    updatedAt: now,
  };
}

function printSummary({ flatItems, valid, invalid, duplicateKeys, perDataset }) {
  console.log('\n── Dataset bazında öğe sayıları ──');
  for (const [datasetKey, count] of perDataset) {
    console.log(`  ${datasetKey}: ${count}`);
  }

  console.log(`\nToplam öğe: ${flatItems.length}`);
  console.log(`Geçerli: ${valid.length}`);
  console.log(`Geçersiz (atlanacak): ${invalid.length}`);

  if (invalid.length > 0) {
    console.log('\n── Geçersiz kayıtlar ──');
    for (const entry of invalid) {
      console.log(`  [${entry.datasetKey}] key=${entry.key} → ${entry.reason}`);
    }
  }

  if (duplicateKeys.length > 0) {
    console.log('\n── Dataset\'ler arası tekrar eden key\'ler ──');
    console.log(
      '  (Bunlar hata değildir; aynı key birden çok dataset\'te geçiyorsa upsert son gelen değerle günceller.)',
    );
    for (const entry of duplicateKeys) {
      console.log(`  ${entry.key} × ${entry.count}`);
    }
  } else {
    console.log('\nDataset\'ler arası tekrar eden key yok.');
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const dryRun = process.argv.includes('--dry-run');

  const flatItems = collectItems(SOURCE_DATASETS);
  const perDataset = new Map();
  for (const entry of flatItems) {
    perDataset.set(entry.datasetKey, (perDataset.get(entry.datasetKey) ?? 0) + 1);
  }

  const { valid, invalid, duplicateKeys } = validateItems(flatItems);

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');

  let connected = false;
  try {
    await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
    connected = true;
  } catch (error) {
    console.error(
      `MongoDB'ye bağlanılamadı: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error('Hiçbir yazma/okuma yapılmadı.');
    process.exitCode = 1;
    return;
  }

  try {
    const dhikrsCol = mongoose.connection.collection('dhikrs');
    const validKeys = valid.map((entry) => entry.item.key);
    const existingDocs = await dhikrsCol
      .find({ key: { $in: validKeys } }, { projection: { _id: 1, key: 1 } })
      .toArray();
    const existingKeySet = new Set(existingDocs.map((doc) => doc.key));

    const wouldInsert = validKeys.filter((key) => !existingKeySet.has(key)).length;
    const wouldUpdate = validKeys.filter((key) => existingKeySet.has(key)).length;

    if (dryRun) {
      printSummary({ flatItems, valid, invalid, duplicateKeys, perDataset });
      console.log(`\n── Yazma önizlemesi (--dry-run, hiçbir şey yazılmadı) ──`);
      console.log(`  Eklenecek (insert): ${wouldInsert}`);
      console.log(`  Güncellenecek (update): ${wouldUpdate}`);
      console.log(
        `\nGerçek seed için: node scripts/seed-dhikrs.mjs  (veya: pnpm --filter api seed:dhikrs)`,
      );
      return;
    }

    let created = 0;
    let updated = 0;
    let failed = 0;

    for (const entry of valid) {
      const { item } = entry;
      try {
        const doc = buildDoc(item);
        const now = new Date();
        const result = await dhikrsCol.updateOne(
          { key: item.key },
          { $set: doc, $setOnInsert: { createdAt: now } },
          { upsert: true },
        );
        if (result.upsertedCount > 0) {
          created += 1;
        } else if (result.modifiedCount > 0 || result.matchedCount > 0) {
          updated += 1;
        }
      } catch (error) {
        failed += 1;
        console.warn(
          `  ! key=${item.key} upsert başarısız: ${
            error instanceof Error ? error.message : String(error)
          }`,
        );
      }
    }

    printSummary({ flatItems, valid, invalid, duplicateKeys, perDataset });
    console.log(
      `\nSeed tamamlandı. created=${created}, updated=${updated}, failed=${failed}, toplam_deneme=${valid.length}`,
    );
  } finally {
    if (connected) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
