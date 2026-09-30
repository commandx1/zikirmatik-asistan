/**
 * DB'deki 99 Esmaül Hüsna zikrinin transliteration.en (ve ad = harfleştirme
 * ise name.en) alanını, scripts/data/esmaulHusnaTemel.mjs'teki onaylı
 * yazımlara `key` üzerinden eşitler. Başka HİÇBİR alana dokunmaz
 * (Türkçe alanlar, embedding, fazilet vs.).
 *
 * Varsayılan DRY-RUN: yalnız farkları listeler, DB'ye yazmaz.
 * Yazmak için `--apply`. İdempotent: ikinci çalıştırma 0 değişiklik bildirir.
 *
 * Kullanım:
 *   MONGODB_URI='<uri>' node scripts/align-esma-en-transliterations.mjs           # kuru çalışma
 *   MONGODB_URI='<uri>' node scripts/align-esma-en-transliterations.mjs --apply   # gerçek güncelleme
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { esmaulHusnaTemel } from './data/esmaulHusnaTemel.mjs';
import { diffEsmaEn } from './lib/esma-en-diff.mjs';

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

async function main() {
  loadEnvFiles(['.env', '.env.local']);
  const apply = process.argv.includes('--apply');
  const targets = esmaulHusnaTemel.dhikrItems;

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
  try {
    const { host, name } = mongoose.connection;
    console.log(`Bağlanıldı: DB=${name} host=${host} (${apply ? 'APPLY' : 'DRY-RUN'})`);

    const col = mongoose.connection.collection('dhikrs');
    const docs = await col
      .find(
        { key: { $in: targets.map((t) => t.key) } },
        { projection: { key: 1, name: 1, transliteration: 1 } },
      )
      .toArray();
    const byKey = new Map(docs.map((d) => [d.key, d]));

    let changed = 0;
    let unchanged = 0;
    let missing = 0;
    console.log('key | şimdiki transliteration.en / name.en | yeni');
    for (const target of targets) {
      const doc = byKey.get(target.key);
      if (!doc) {
        missing += 1;
        console.log(`  ${target.key}: atlandı (DB'de yok)`);
        continue;
      }
      const set = diffEsmaEn(doc, target);
      if (!set) {
        unchanged += 1;
        continue;
      }
      changed += 1;
      const cur = `${doc.transliteration?.en ?? ''} / ${doc.name?.en ?? ''}`;
      const next = `${set['transliteration.en'] ?? doc.transliteration?.en ?? ''} / ${set['name.en'] ?? doc.name?.en ?? ''}`;
      console.log(`  ${target.key} | ${cur} | ${next}`);
      if (apply) {
        await col.updateOne({ key: target.key }, { $set: { ...set, updatedAt: new Date() } });
      }
    }

    console.log(`\nÖzet: değişecek=${changed}, değişmeyen=${unchanged}, DB'de yok=${missing}`);
    if (!apply) {
      console.log(
        'Kuru çalışma: DB değişmedi. Uygulamak için: node scripts/align-esma-en-transliterations.mjs --apply',
      );
    }
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
