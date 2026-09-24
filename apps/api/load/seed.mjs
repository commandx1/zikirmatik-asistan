// k6 koşularından ÖNCE çalışır: premium kurucu + halka + N üye sign-in +
// zikir belgeleri + aktif vird programı. Hoisted mongoose ve Node 22 fetch
// kullanır (yeni bağımlılık yok). Çıktı: load/out/seed.json.
//
// Kullanım: MONGODB_URI=... BASE_URL=http://127.0.0.1:3010 node load/seed.mjs
import mongoose from 'mongoose';
import { writeFileSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3010';
const MONGODB_URI = process.env.MONGODB_URI;
const MEMBER_COUNT = 5; // test:load:circle PROFILE=smoke (5 VU) ile birebir eşleşir.

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

async function signIn(sub) {
  const res = await fetch(`${BASE_URL}/v1/auth/provider/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      provider: 'google',
      platform: 'android',
      idToken: JSON.stringify({ sub, email: `${sub}@k6.local`, name: sub }),
      deviceId: `seed-device-${sub}`,
    }),
  });
  if (!res.ok) throw new Error(`[load] signIn(${sub}) ${res.status}`);
  const body = await res.json();
  return body.data;
}

async function api(method, path, accessToken, payload) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${accessToken}`,
    },
    body: payload ? JSON.stringify(payload) : undefined,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(
      `[load] ${method} ${path} → ${res.status}: ${JSON.stringify(body)}`,
    );
  }
  return body.data;
}

async function main() {
  assertLoadDbUri(MONGODB_URI);
  await mongoose.connect(MONGODB_URI);

  // Zikirler: apps/api/test/helpers/fixtures.ts seedDhikr ile aynı alan seti,
  // küçük olduğu için scripts/seed-dhikrs.mjs'i tekrar kullanmak yerine
  // doğrudan insert edildi.
  const dhikrSchema = new mongoose.Schema(
    {
      key: String,
      nameArabic: String,
      name: Object,
      transliteration: Object,
      meaning: Object,
      virtue: Object,
      source: Object,
      isActive: Boolean,
      isVerified: Boolean,
    },
    { collection: 'dhikrs' },
  );
  const DhikrModel =
    mongoose.models.Dhikr ?? mongoose.model('Dhikr', dhikrSchema);
  await DhikrModel.deleteMany({ key: /^k6-dhikr-/ });
  const dhikrDocs = await DhikrModel.insertMany(
    Array.from({ length: 5 }, (_, i) => {
      const key = `k6-dhikr-${i}`;
      const localized = { tr: `tr-${key}`, en: `en-${key}` };
      return {
        key,
        nameArabic: 'سبحان الله',
        name: localized,
        transliteration: localized,
        meaning: localized,
        virtue: localized,
        source: localized,
        isActive: true,
        isVerified: true,
      };
    }),
  );
  const dhikrIds = dhikrDocs.map((d) => String(d._id));

  // Kurucu: premium (halka oluşturmak premium ister — circles.service.ts).
  const founder = await signIn('load-founder');
  const userSchema = new mongoose.Schema({}, { collection: 'users', strict: false });
  const UserModel = mongoose.models.User ?? mongoose.model('User', userSchema);
  await UserModel.updateOne(
    { _id: new mongoose.Types.ObjectId(founder.userId) },
    { $set: { isPremium: true } },
  );

  const circle = await api('POST', '/v1/circles', founder.accessToken, {
    dhikrId: dhikrIds[0],
    goalCount: 10_000_000,
  });

  const members = [];
  for (let i = 0; i < MEMBER_COUNT; i += 1) {
    const sub = `load-member-${i}`;
    const member = await signIn(sub);
    await api('POST', '/v1/circles/join', member.accessToken, {
      code: circle.code,
    });
    members.push({ sub, ...member });
  }

  // Vird: kurucu için tek aktif manuel program.
  const virdProgram = await api(
    'POST',
    '/v1/vird/programs',
    founder.accessToken,
    {
      title: { tr: 'k6 Vird', en: 'k6 Vird' },
      kind: 'routine',
      startDate: new Date().toISOString().slice(0, 10),
      phases: [
        {
          fromDay: 1,
          toDay: null,
          slots: { morning: [{ dhikrId: dhikrIds[1], target: 33 }] },
        },
      ],
    },
  );
  await api(
    'POST',
    `/v1/vird/programs/${virdProgram._id}/activate`,
    founder.accessToken,
  );

  const out = {
    dhikrIds,
    circle: { id: circle.id, code: circle.code, dhikrId: dhikrIds[0] },
    members,
    vird: {
      programId: virdProgram._id,
      dhikrId: dhikrIds[1],
      slot: 'morning',
      dayIndex: 1,
    },
  };
  mkdirSync(join(__dirname, 'out'), { recursive: true });
  writeFileSync(join(__dirname, 'out/seed.json'), JSON.stringify(out, null, 2));
  console.log(
    `[load] seed tamam: ${dhikrIds.length} zikir, halka ${circle.code}, ${members.length} üye, vird ${virdProgram._id}`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
