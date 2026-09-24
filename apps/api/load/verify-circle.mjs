// k6 SCENARIO=circle koşusundan SONRA çalışır: her üye tek dhikr_logs
// belgesi üretir (dedupe: userId+dhikrId+date+circleId upsert — bkz.
// dhikr-logs.service.ts), her belgenin count'u o üyenin gönderdiği SON
// (en yüksek $max) değerdir. circles.totalCount bu $max'ların toplamı
// olmalı. k6 VU'ları izole çalıştığından k6 tarafında paylaşılan bir
// "beklenen toplam" tutmak yerine — Mongo zaten kaynağın kendisi olduğu
// için — doğrulama doğrudan Mongo üzerinden yapılır (circle-expected.json
// gereksiz).
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';

const MONGODB_URI = process.env.MONGODB_URI;

function assertLoadDbUri(uri) {
  if (!uri) throw new Error('[load] MONGODB_URI tanımsız.');
  const url = new URL(uri);
  const dbName = url.pathname.replace(/^\//, '');
  if (
    (url.hostname !== '127.0.0.1' && url.hostname !== 'localhost') ||
    !(dbName.startsWith('zikir_load') || dbName.startsWith('zikir_e2e'))
  ) {
    throw new Error(
      `[load] Güvenlik: ${url.hostname}/${dbName} yerel zikir_load*/zikir_e2e* DB değil — reddedildi.`,
    );
  }
}

async function main() {
  assertLoadDbUri(MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;

  const seed = JSON.parse(
    readFileSync(new URL('./out/seed.json', import.meta.url), 'utf8'),
  );
  const circleId = new mongoose.Types.ObjectId(seed.circle.id);

  const circle = await db.collection('circles').findOne({ _id: circleId });
  if (!circle) throw new Error(`[load] halka bulunamadı: ${seed.circle.id}`);

  const logs = await db
    .collection('dhikr_logs')
    .find({ circleId })
    .toArray();
  const sum = logs.reduce((acc, log) => acc + log.count, 0);
  const expectedMembers = seed.members.length;

  const errors = [];
  if (circle.totalCount !== sum) {
    errors.push(
      `totalCount (${circle.totalCount}) !== Σ dhikr_logs.count (${sum})`,
    );
  }
  if (logs.length !== expectedMembers) {
    errors.push(
      `dhikr_logs belge sayısı (${logs.length}) !== üye sayısı (${expectedMembers})`,
    );
  }

  await mongoose.disconnect();

  if (errors.length > 0) {
    console.error('[load] verify-circle BAŞARISIZ:\n' + errors.join('\n'));
    process.exit(1);
  }

  console.log(
    `[load] verify-circle OK: totalCount=${circle.totalCount} Σ=${sum} belge=${logs.length}/${expectedMembers}`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
