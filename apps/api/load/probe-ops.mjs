// Uç nokta başına maliyet: ardışık N istek sırasında Mongo opcounters farkı (istek
// başına işlem) ve konteyner CPU süresi (cgroup cpu.stat, istek başına ms).
// Kullanım: MONGODB_URI=... BASE_URL=http://127.0.0.1:3010 CONTAINER=load-api-load-1 node load/probe-ops.mjs
import mongoose from 'mongoose';
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { assertLoadDbUri } from './lib/guard.mjs';

const BASE = process.env.BASE_URL ?? 'http://127.0.0.1:3010';
const N = Number(process.env.N ?? 100);
const CONTAINER = process.env.CONTAINER;
assertLoadDbUri(process.env.MONGODB_URI);
const client = new mongoose.mongo.MongoClient(process.env.MONGODB_URI);
await client.connect();
const seed = JSON.parse(readFileSync(process.env.SEED_FILE ?? new URL('./out/seed.json', import.meta.url), 'utf8'));
const today = new Date().toISOString().slice(0, 10);
const KEYS = ['insert', 'query', 'update', 'delete', 'getmore', 'command'];

const ops = async () => (await client.db('admin').command({ serverStatus: 1 })).opcounters;
const cpuUs = () =>
  CONTAINER
    ? Number(/usage_usec (\d+)/.exec(execFileSync('docker', ['exec', CONTAINER, 'cat', '/sys/fs/cgroup/cpu.stat']).toString())[1])
    : 0;

async function req(method, path, token, body) {
  const r = await fetch(BASE + path, {
    method,
    headers: { 'content-type': 'application/json', ...(token ? { authorization: `Bearer ${token}` } : {}), 'x-client-timezone': 'Europe/Istanbul' },
    body: body ? JSON.stringify(body) : undefined,
  });
  return { status: r.status, json: await r.json().catch(() => ({})) };
}
async function signIn(sub) {
  const r = await req('POST', '/v1/auth/provider/verify', null, {
    provider: 'google', platform: 'android',
    idToken: JSON.stringify({ sub, email: `${sub}@k6.local`, name: sub }), deviceId: `k6-device-${sub}`,
  });
  return r.json.data;
}

// Boşta taban (command: heartbeat vb.) — 10 sn.
const b0 = await ops(); const bt = Date.now();
await new Promise((r) => setTimeout(r, 10_000));
const b1 = await ops();
const idle = Object.fromEntries(KEYS.map((k) => [k, (b1[k] - b0[k]) / ((Date.now() - bt) / 1000)]));

const me = await signIn(`probe-${Date.now()}`);
const t = me.accessToken;
// HISTORY=N: kullanıcıya N günlük geçmiş log ekler (seri hesabı geçmişle büyür mü?).
if (Number(process.env.HISTORY) > 0) {
  const col = client.db(new URL(process.env.MONGODB_URI).pathname.slice(1)).collection('dhikr_logs');
  const uid = new mongoose.Types.ObjectId(me.userId);
  await col.insertMany(Array.from({ length: Number(process.env.HISTORY) }, (_, i) => ({
    userId: uid, dhikrId: new mongoose.Types.ObjectId(seed.dhikrIds[i % 5]), count: 33, targetCount: 33,
    sessionDuration: 0, source: 'manual', isCompleted: true, isFavorite: false,
    date: new Date(Date.now() - (i + 3) * 86_400_000).toISOString().slice(0, 10), createdAt: new Date(),
  })));
}
let cnt = 0;
// Vird programı (vird log + today için).
const prog = (await req('POST', '/v1/vird/programs', t, {
  title: { tr: 'p', en: 'p' }, kind: 'routine', startDate: today,
  phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId: seed.dhikrIds[1], target: 33 }] } }],
})).json.data;
await req('POST', `/v1/vird/programs/${prog._id}/activate`, t);
await req('POST', '/v1/circles/join', t, { code: seed.circle.code });

const cases = [
  ['GET app-config', () => req('GET', '/app-config')],
  ['GET users/:id', () => req('GET', `/v1/users/${me.userId}`, t)],
  ['GET special-days/home', () => req('GET', '/v1/special-days/home', t)],
  ['GET streaks/:id', () => req('GET', `/v1/streaks/${me.userId}`, t)],
  ['GET stats/summary', () => req('GET', '/v1/stats/summary', t)],
  ['GET ai/credits', () => req('GET', '/v1/ai/credits', t)],
  ['GET vird/today', () => req('GET', '/v1/vird/today', t)],
  ['POST devices/register', () => req('POST', '/v1/devices/register', t, { deviceId: `probe-dev-${me.userId}`, platform: 'android', locale: 'tr', timezone: 'Europe/Istanbul' })],
  ['POST dhikr-logs', () => req('POST', '/v1/dhikr-logs', t, { dhikrId: seed.dhikrIds[2], count: (cnt += 7), targetCount: 33, date: today })],
  ['POST dhikr-logs vird', () => req('POST', '/v1/dhikr-logs', t, { dhikrId: seed.dhikrIds[1], virdProgramId: prog._id, virdSlot: 'morning', virdDayIndex: 1, count: (cnt += 1), targetCount: 33, date: today })],
  ['POST dhikr-logs circle', () => req('POST', '/v1/dhikr-logs', t, { dhikrId: seed.circle.dhikrId, circleId: seed.circle.id, source: 'circle', count: (cnt += 1), targetCount: 10000000, date: today })],
  ['GET circles/:id', () => req('GET', `/v1/circles/${seed.circle.id}`, t)],
];
const rows = [];
async function measure(name, fn, n) {
  const o0 = await ops(); const c0 = cpuUs(); const t0 = Date.now();
  let bad = 0;
  for (let i = 0; i < n; i += 1) {
    const r = await fn(i);
    if (r.status >= 400 && r.status !== 403) bad += 1;
  }
  const dt = (Date.now() - t0) / 1000;
  const o1 = await ops(); const c1 = cpuUs();
  const per = Object.fromEntries(KEYS.map((k) => [k, (o1[k] - o0[k] - idle[k] * dt - (k === 'command' ? 1 : 0)) / n]));
  const total = KEYS.reduce((s, k) => s + per[k], 0);
  rows.push({ name, n, bad, opsPerReq: total, ...per, cpuMsPerReq: CONTAINER ? (c1 - c0) / 1000 / n : null, wallMsPerReq: (dt * 1000) / n });
}
const only = process.env.ONLY;
for (const [name, fn] of cases) if (!only || name === only) await measure(name, fn, N);
// Oturum açma: her istek yeni kullanıcı.
let u = 0;
if (!only) {
await measure('POST auth/verify (yeni kullanıcı)', () => signIn(`probe-new-${Date.now()}-${u++}`).then(() => ({ status: 200 })), 30);
// AI: yeni kullanıcı başına 1 öneri; oturum açma maliyeti ayrıca çıkarılmadan raporlanır (not düşülür).
await measure('POST auth/verify + ai/recommendations', async () => {
  const s = await signIn(`probe-ai-${Date.now()}-${u++}`);
  return req('POST', '/v1/ai/recommendations', s.accessToken, { userId: s.userId, freeText: 'huzur', flowId: crypto.randomUUID() });
}, 20);
}
const d = (x) => (x === null ? '-' : x.toFixed(2));
console.log('uç nokta | işlem/istek (toplam) | insert query update delete getmore command | CPU ms/istek | duvar ms/istek | hata');
for (const r of rows) console.log(`${r.name} | ${d(r.opsPerReq)} | ${KEYS.map((k) => d(r[k])).join(' ')} | ${d(r.cpuMsPerReq)} | ${d(r.wallMsPerReq)} | ${r.bad}`);
console.log('idle taban ops/s:', JSON.stringify(idle));
await client.close();
