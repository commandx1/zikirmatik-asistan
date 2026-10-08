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
import { assertLoadDbUri } from './lib/guard.mjs';

const MONGODB_URI = process.env.MONGODB_URI;


async function checkCircle(db, C) {
  const circleId = new mongoose.Types.ObjectId(C.id);
  const circle = await db.collection('circles').findOne({ _id: circleId });
  if (!circle) throw new Error(`[load] halka bulunamadı: ${C.id}`);

  const logs = await db.collection('dhikr_logs').find({ circleId }).toArray();
  const sum = logs.reduce((acc, log) => acc + log.count, 0);
  // Her üye için tek belge (yinelenen yok) ve yalnız halka üyeleri log yazmış olmalı;
  // üye sayısı sabit değil (circle-heavy N üye ile koşar).
  const memberSet = new Set(circle.memberIds.map(String));
  const distinct = new Set(logs.map((l) => String(l.userId)));
  const errors = [];
  if (circle.totalCount !== sum) errors.push(`${C.code}: totalCount (${circle.totalCount}) !== Σ dhikr_logs.count (${sum})`);
  if (logs.length !== distinct.size) errors.push(`${C.code}: dhikr_logs belge sayısı (${logs.length}) !== katkı veren üye sayısı (${distinct.size})`);
  const outsiders = [...distinct].filter((u) => !memberSet.has(u));
  if (outsiders.length > 0) errors.push(`${C.code}: halka üyesi olmayan ${outsiders.length} kullanıcı log yazmış`);
  console.log(`[load] halka ${C.code}: totalCount=${circle.totalCount} Σ=${sum} katkı veren üye=${distinct.size}/${circle.memberIds.length} üye`);
  return errors;
}

async function main() {
  assertLoadDbUri(MONGODB_URI);
  await mongoose.connect(MONGODB_URI);
  const db = mongoose.connection.db;
  const seed = JSON.parse(
    readFileSync(process.env.SEED_FILE ?? new URL('./out/seed.json', import.meta.url), 'utf8'),
  );
  const errors = [];
  for (const C of seed.circles ?? [seed.circle]) errors.push(...(await checkCircle(db, C)));
  await mongoose.disconnect();
  if (errors.length > 0) {
    console.error('[load] verify-circle BAŞARISIZ:\n' + errors.join('\n'));
    process.exit(1);
  }
  console.log('[load] verify-circle OK');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
