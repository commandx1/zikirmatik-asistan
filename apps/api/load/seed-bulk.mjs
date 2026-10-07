// Arka plan veri hacmi (prod'a yakın indeks derinliği için): BG_USERS kullanıcı,
// kullanıcı başına ~BG_LOGS_PER_USER zikir logu ve BG_SPECIAL_DAYS özel gün.
// seed.mjs'ten SONRA çalışır (seed.json'daki dhikrIds'i kullanır). Doğrulayıcılar
// bg kullanıcılarını (@bg.local) dışarıda bırakır.
// Kullanım: MONGODB_URI=mongodb://127.0.0.1:27018/zikir_load?directConnection=true node load/seed-bulk.mjs
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { assertLoadDbUri } from './lib/guard.mjs';

const USERS = Number(process.env.BG_USERS ?? 5000);
const LOGS = Number(process.env.BG_LOGS_PER_USER ?? 20);
const SPECIAL = Number(process.env.BG_SPECIAL_DAYS ?? 120);
const dayKey = (offset) =>
  new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

async function insertChunks(col, docs) {
  for (let i = 0; i < docs.length; i += 5000) {
    await col.insertMany(docs.slice(i, i + 5000), { ordered: false });
  }
}

async function main() {
  assertLoadDbUri(process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);
  const db = mongoose.connection.db;
  const seed = JSON.parse(readFileSync(process.env.SEED_FILE ?? new URL('./out/seed.json', import.meta.url), 'utf8'));
  const dhikrIds = seed.dhikrIds.map((id) => new mongoose.Types.ObjectId(id));

  await db.collection('users').deleteMany({ email: /@bg\.local$/ });
  const now = new Date();
  const users = Array.from({ length: USERS }, (_, i) => ({
    _id: new mongoose.Types.ObjectId(),
    email: `bg-${i}@bg.local`,
    displayName: `bg ${i}`,
    authProvider: 'google',
    isPremium: false,
    createdAt: now,
    updatedAt: now,
  }));
  await insertChunks(db.collection('users'), users);

  const logs = [];
  for (const u of users) {
    for (let d = 0; d < LOGS; d += 1) {
      logs.push({
        userId: u._id,
        dhikrId: dhikrIds[d % dhikrIds.length],
        count: 33 + d,
        targetCount: 33,
        sessionDuration: 0,
        source: 'manual',
        isCompleted: true,
        isFavorite: false,
        date: dayKey(-(d + 2)),
        createdAt: now,
      });
    }
  }
  await insertChunks(db.collection('dhikr_logs'), logs);

  await db.collection('special_days').deleteMany({ eventKey: /^bg-/ });
  const text = (n) => 'Özel gün anlatımı. '.repeat(n);
  const special = Array.from({ length: SPECIAL }, (_, i) => ({
    name: { tr: `bg gün ${i}`, en: `bg day ${i}` },
    type: 'özel gün',
    date: dayKey(1 + Math.floor((i * 365) / SPECIAL)),
    hijriDate: '1 Muharrem 1448',
    eventKey: `bg-${i}`,
    priority: 0,
    isActive: true,
    description: { tr: text(10), en: text(10) },
    article: { tr: text(150), en: text(150) },
    practices: Array.from({ length: 4 }, () => ({
      title: { tr: 'Tavsiye', en: 'Tip' },
      description: { tr: text(15), en: text(15) },
    })),
    hasSpecialFlow: false,
    notifyBeforeMinutes: [1440, 60],
    createdAt: now,
    updatedAt: now,
  }));
  await insertChunks(db.collection('special_days'), special);
  console.log(`[load] bulk seed: ${USERS} kullanıcı, ${logs.length} log, ${SPECIAL} özel gün`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
