// seed.mjs'ten SONRA: tek halka üye tavanına (200) takılır; büyük N için ek
// halkalar (her biri kendi premium kurucusuyla) açar ve seed.json'a `circles` yazar.
// Kullanım: MONGODB_URI=... node load/seed-circles.mjs [ek_halka_sayısı=7]
import mongoose from 'mongoose';
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { assertLoadDbUri } from './lib/guard.mjs';

const BASE_URL = process.env.BASE_URL ?? 'http://127.0.0.1:3010';
const file = process.env.SEED_FILE ?? fileURLToPath(new URL('./out/seed.json', import.meta.url));
const extra = Number(process.argv[2] ?? 7);

async function post(path, token, payload) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(payload),
  });
  const body = await res.json();
  if (!res.ok) throw new Error(`${path} ${res.status} ${JSON.stringify(body)}`);
  return body.data;
}

assertLoadDbUri(process.env.MONGODB_URI);
await mongoose.connect(process.env.MONGODB_URI);
const seed = JSON.parse(readFileSync(file, 'utf8'));
const circles = [seed.circle];
for (let i = 0; i < extra; i += 1) {
  const sub = `load-founder-${i + 2}`;
  const f = await post('/v1/auth/provider/verify', null, {
    provider: 'google',
    platform: 'android',
    idToken: JSON.stringify({ sub, email: `${sub}@k6.local`, name: sub }),
    deviceId: `seed-device-${sub}`,
  });
  await mongoose.connection.db.collection('users').updateOne({ _id: new mongoose.Types.ObjectId(f.userId) }, { $set: { isPremium: true } });
  const c = await post('/v1/circles', f.accessToken, { dhikrId: seed.dhikrIds[0], goalCount: 10_000_000 });
  circles.push({ id: c.id, code: c.code, dhikrId: seed.dhikrIds[0] });
}
writeFileSync(file, JSON.stringify({ ...seed, circles }, null, 2));
console.log(`[load] ${circles.length} halka hazır`);
await mongoose.disconnect();
