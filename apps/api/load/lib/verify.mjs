// verify-*.mjs ortak iskeleti: guard + bağlantı + PASS/FAIL çıktısı.
import mongoose from 'mongoose';
import { assertLoadDbUri } from './guard.mjs';

export async function runVerifier(name, fn) {
  assertLoadDbUri(process.env.MONGODB_URI);
  await mongoose.connect(process.env.MONGODB_URI);
  const failures = [];
  const info = [];
  try {
    await fn(mongoose.connection.db, { fail: (m) => failures.push(m), info: (m) => info.push(m) });
  } finally {
    await mongoose.disconnect();
  }
  for (const line of info) console.log(`[load] ${name}: ${line}`);
  if (failures.length > 0) {
    console.error(`[load] ${name} FAIL (${failures.length}):\n  ` + failures.slice(0, 20).join('\n  '));
    process.exit(1);
  }
  console.log(`[load] ${name} PASS`);
}

// Yük kullanıcıları: e-posta @k6.local (arka plan @bg.local hariç).
export async function k6UserIds(db) {
  const users = await db.collection('users').find({ email: /@k6\.local$/ }, { projection: { _id: 1 } }).toArray();
  return users.map((u) => u._id);
}
