/* global process, console */
/**
 * dhikrs.timeOfDay onarımı (2026-09-14 olayı).
 *
 * `seed-special-days.mjs --all` zikirleri `timeOfDay` normalize edilmeden
 * yazdı ('any', 'morning', ['sabah','aksam'] ...). Şema enum dizisi bekler
 * (morning|afternoon|evening|night|any); AI aday satırı `timeOfDay.join`
 * çağırdığı için AI öneri ve AI vird programı akışları 503'e düştü.
 *
 * Bu betik her zikrin mevcut değerini `normalizeTimeOfDay` ile dönüştürür.
 * Varsayılan KURU çalışmadır (DB'ye yazmaz). Yazmak için `--apply`.
 * `--apply` önce tüm {_id, key, timeOfDay} değerlerini
 * scripts/.backups/dhikrs-timeOfDay-<zaman>.json dosyasına yedekler; her
 * güncelleme yalnız okunan değer hâlâ duruyorsa uygulanır (arada başka bir
 * yazım olduysa o kayda dokunmaz). İdempotent: ikinci çalıştırmada 0 değişiklik.
 *
 * Kullanım (apps/api dizininden):
 *   node scripts/repair-dhikr-time-of-day.mjs          # kuru çalışma, plan
 *   node scripts/repair-dhikr-time-of-day.mjs --apply  # yedek + onarım
 */
import 'dotenv/config';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { MongoClient } from 'mongodb';
import { normalizeTimeOfDay } from './lib/time-of-day.mjs';

const TIME_OF_DAY_ENUM = ['morning', 'afternoon', 'evening', 'night', 'any'];
const apply = process.argv.includes('--apply');
const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error('MONGODB_URI tanımlı değil (apps/api/.env).');
  process.exit(1);
}

const client = new MongoClient(uri);

try {
  await client.connect();
  const collection = client.db().collection('dhikrs');
  const docs = await collection
    .find({}, { projection: { key: 1, timeOfDay: 1 } })
    .toArray();

  const ops = [];
  const transforms = new Map();
  const invalid = [];

  for (const doc of docs) {
    let normalized;
    try {
      normalized = normalizeTimeOfDay(doc.timeOfDay);
    } catch (error) {
      invalid.push({ key: doc.key, timeOfDay: doc.timeOfDay, error: error.message });
      continue;
    }

    const alreadyOk =
      Array.isArray(doc.timeOfDay) &&
      JSON.stringify(doc.timeOfDay) === JSON.stringify(normalized);
    if (alreadyOk) {
      continue;
    }

    const label = `${JSON.stringify(doc.timeOfDay)} -> ${JSON.stringify(normalized)}`;
    transforms.set(label, (transforms.get(label) ?? 0) + 1);
    ops.push({
      updateOne: {
        filter: { _id: doc._id, timeOfDay: doc.timeOfDay },
        update: { $set: { timeOfDay: normalized } },
      },
    });
  }

  console.log(`DB: ${client.db().databaseName} · zikir: ${docs.length} · düzeltilecek: ${ops.length} · geçersiz: ${invalid.length}`);
  for (const [label, count] of [...transforms].sort((a, b) => b[1] - a[1])) {
    console.log(`  ${String(count).padStart(4)}  ${label}`);
  }
  if (invalid.length > 0) {
    console.log('Normalize edilemeyen kayıtlar (dokunulmayacak):');
    for (const item of invalid) {
      console.log(`  ${item.key}: ${JSON.stringify(item.timeOfDay)} (${item.error})`);
    }
  }

  if (!apply) {
    console.log('\nKuru çalışma: DB değişmedi. Uygulamak için: node scripts/repair-dhikr-time-of-day.mjs --apply');
  } else if (ops.length === 0) {
    console.log('\nDüzeltilecek kayıt yok.');
  } else {
    const scriptDir = dirname(fileURLToPath(import.meta.url));
    const backupDir = join(scriptDir, '.backups');
    mkdirSync(backupDir, { recursive: true });
    const backupPath = join(
      backupDir,
      `dhikrs-timeOfDay-${new Date().toISOString().replace(/[:.]/g, '-')}.json`,
    );
    writeFileSync(
      backupPath,
      JSON.stringify(docs.map((d) => ({ _id: String(d._id), key: d.key, timeOfDay: d.timeOfDay })), null, 1),
    );
    console.log(`\nYedek: ${backupPath}`);

    const result = await collection.bulkWrite(ops, { ordered: false });
    console.log(`Uygulandı: eşleşen=${result.matchedCount}, değişen=${result.modifiedCount}`);
  }

  const nonArray = await collection.countDocuments({
    $expr: { $not: { $isArray: '$timeOfDay' } },
  });
  const outsideEnum = await collection.countDocuments({
    timeOfDay: { $elemMatch: { $nin: TIME_OF_DAY_ENUM } },
  });
  console.log(`Durum: dizi olmayan=${nonArray}, enum dışı değer içeren=${outsideEnum}`);
  if (apply && (nonArray > 0 || outsideEnum > 0)) {
    process.exitCode = 1;
  }
} finally {
  await client.close();
}
