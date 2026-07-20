/* global console, process */
// Tek seferlik onarım: mobil register akışındaki hidrasyon yarışı, cihaz
// kayıtlarının `prefs.friday` / `prefs.specialDays` alanlarını yanlışlıkla
// `false`'a çekiyordu (store hidrasyonu bitmeden default `false` değerleri
// backend'e gönderiliyordu). Kategori bazlı kullanıcı toggle'ı yok — bu iki
// pref profildeki tek "Bildirimler" master toggle'ı ile birlikte hareket
// eder ve ürün kararı gereği daima açık başlar. Bu script tüm cihazlarda
// iki pref'i tekrar `true` yapar.
//
// Kullanım:
//   cd apps/api
//   node scripts/repair-device-prefs.mjs          # dry-run (sadece sayım)
//   node scripts/repair-device-prefs.mjs --apply  # gerçekten yazar
//
// MONGODB_URI, apps/api/.env / .env.local dosyasından veya ortamdan okunur.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function parseEnv(content) {
  const parsed = {};
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    parsed[key] = value;
  }
  return parsed;
}

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const entries = parseEnv(readFileSync(absolutePath, 'utf8'));
    for (const [key, value] of Object.entries(entries)) {
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const apply = process.argv.includes('--apply');
  const { default: mongoose } = await import('mongoose');

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  await mongoose.connect(mongoUri, { autoIndex: false });

  try {
    const devices = mongoose.connection.collection('devices');

    const filter = {
      $or: [
        { 'prefs.friday': { $ne: true } },
        { 'prefs.specialDays': { $ne: true } },
      ],
    };

    const total = await devices.countDocuments({});
    const affected = await devices.countDocuments(filter);
    console.log(`Toplam cihaz: ${total}`);
    console.log(`prefs.friday/specialDays != true olan cihaz: ${affected}`);

    if (!apply) {
      console.log('Dry-run — hiçbir şey yazılmadı. Uygulamak için: --apply');
      return;
    }

    const result = await devices.updateMany(filter, {
      $set: { 'prefs.friday': true, 'prefs.specialDays': true },
    });
    console.log(`Güncellenen cihaz: ${result.modifiedCount}`);
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
