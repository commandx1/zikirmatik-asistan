/* global console, process */
/**
 * DB'deki dhikrs kayıtlarının name.tr / name.en / tags alanlarını,
 * apps/api/scripts/data/sourceDataset.mjs'teki güncel değerlere `key`
 * üzerinden yansıtır. Başka HİÇBİR alana dokunmaz (embedding, virtue,
 * source, timeOfDay vs. bu betiğin işi değil).
 *
 * Varsayılan DRY-RUN: yalnız farkları listeler, DB'ye yazmaz.
 * Yazmak için `--apply`.
 *
 * Kullanım:
 *   node scripts/rename-dhikr-titles.mjs           # kuru çalışma
 *   node scripts/rename-dhikr-titles.mjs --apply   # gerçek güncelleme
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
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
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

function warningsFor(nameTr) {
  const warnings = [];
  if (/[âîûÂÎÛ]/.test(nameTr)) warnings.push('şapkalı harf');
  if (nameTr.length > 50) warnings.push('50 karakterden uzun');
  if (/[×—]/.test(nameTr)) warnings.push('× veya — içeriyor');
  return warnings;
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);
  const apply = process.argv.includes('--apply');

  // 1) Dataset'lerdeki dhikrItems'ı key -> {name, tags} map'ine topla.
  const sourceByKey = new Map();
  for (const dataset of SOURCE_DATASETS) {
    if (!Array.isArray(dataset.dhikrItems)) continue;
    for (const item of dataset.dhikrItems) {
      const key = typeof item.key === 'string' ? item.key.trim() : '';
      if (!key) continue;
      if (sourceByKey.has(key)) {
        console.warn(`  ! key=${key} birden fazla dataset'te geçiyor, ilki kullanılıyor`);
        continue;
      }
      sourceByKey.set(key, { name: item.name, tags: item.tags ?? [] });
    }
  }

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
  try {
    const { host, name } = mongoose.connection;
    console.log(`Bağlanıldı: DB=${name} host=${host} (${apply ? 'APPLY' : 'DRY-RUN'})`);

    const dhikrsCol = mongoose.connection.collection('dhikrs');
    const keys = [...sourceByKey.keys()];
    const existingDocs = await dhikrsCol
      .find({ key: { $in: keys } }, { projection: { _id: 1, key: 1, name: 1, tags: 1 } })
      .toArray();
    const existingByKey = new Map(existingDocs.map((doc) => [doc.key, doc]));

    let changed = 0;
    let unchanged = 0;
    let missing = 0;
    let warnCount = 0;

    for (const [key, source] of sourceByKey) {
      const doc = existingByKey.get(key);
      if (!doc) {
        missing += 1;
        console.log(`  ${key}: atlandı (DB'de yok)`);
        continue;
      }

      const set = {};
      if ((doc.name?.tr ?? '') !== (source.name?.tr ?? '')) {
        set['name.tr'] = source.name?.tr ?? '';
      }
      if ((doc.name?.en ?? '') !== (source.name?.en ?? '')) {
        set['name.en'] = source.name?.en ?? '';
      }
      if (JSON.stringify(doc.tags ?? []) !== JSON.stringify(source.tags ?? [])) {
        set.tags = source.tags ?? [];
      }

      if (Object.keys(set).length === 0) {
        unchanged += 1;
        continue;
      }

      // Uyarı yalnız başlığı değişen kayıtlar için; henüz ele alınmamış
      // dalgaların eski başlıkları çıktıyı boğmasın.
      const warnings = 'name.tr' in set ? warningsFor(set['name.tr']) : [];
      if (warnings.length > 0) {
        warnCount += 1;
        console.log(`  ! ${key}: uyarı (${warnings.join(', ')})`);
      }

      changed += 1;
      if ('name.tr' in set) console.log(`  ${key}: TR "${doc.name?.tr ?? ''}" → "${set['name.tr']}"`);
      if ('name.en' in set) console.log(`  ${key}: EN "${doc.name?.en ?? ''}" → "${set['name.en']}"`);
      if ('tags' in set) console.log(`  ${key}: tags ${JSON.stringify(doc.tags ?? [])} → ${JSON.stringify(set.tags)}`);

      if (apply) {
        await dhikrsCol.updateOne({ key }, { $set: { ...set, updatedAt: new Date() } });
      }
    }

    console.log(
      `\nÖzet: değişecek=${changed}, değişmeyen=${unchanged}, DB'de yok=${missing}, uyarı=${warnCount}`,
    );
    if (!apply) {
      console.log('Kuru çalışma: DB değişmedi. Uygulamak için: node scripts/rename-dhikr-titles.mjs --apply');
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
