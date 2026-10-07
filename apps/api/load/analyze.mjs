// Bir koşunun çıktısını (out/<run>/{summary.json,monitor.jsonl,meta.json}) aşama
// bazlı tabloya çevirir ve out/<run>/analysis.json yazar.
// Kullanım: node load/analyze.mjs out/<run>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const dir = process.argv[2];
const meta = JSON.parse(readFileSync(join(dir, 'meta.json'), 'utf8'));
const summary = JSON.parse(readFileSync(join(dir, 'summary.json'), 'utf8'));
const samples = readFileSync(join(dir, 'monitor.jsonl'), 'utf8')
  .split('\n')
  .filter(Boolean)
  .map((l) => JSON.parse(l));
const m = summary.metrics;
const val = (name, key) => m[name]?.[key] ?? m[name]?.values?.[key];

// Aşamalar: STAGES="25:10s,25:80s,..." ; yoksa tek pencere (tüm koşu).
const stages = (meta.stages ?? '')
  .split(',')
  .filter(Boolean)
  .map((s) => {
    const [target, d] = s.split(':');
    return { target: Number(target), seconds: parseInt(d, 10) };
  });
let acc = 0;
let prev = 0;
const windows = [];
if (stages.length === 0) {
  windows.push({ idx: null, vus: meta.vus, start: meta.start, end: meta.end });
} else {
  stages.forEach((s, i) => {
    const start = meta.start + acc * 1000;
    acc += s.seconds;
    const isHold = s.target === prev && s.target > 0;
    if (isHold) windows.push({ idx: i, vus: s.target, start, end: meta.start + acc * 1000 });
    prev = s.target;
  });
}

function rates(from, to) {
  const out = { insert: 0, query: 0, update: 0, delete: 0, getmore: 0, command: 0, n: 0 };
  const cpu = [];
  const mem = [];
  for (let i = 1; i < samples.length; i += 1) {
    const a = samples[i - 1];
    const b = samples[i];
    if (b.t < from || b.t > to) continue;
    const dt = (b.t - a.t) / 1000;
    for (const k of ['insert', 'query', 'update', 'delete', 'getmore', 'command']) out[k] += (b.ops[k] - a.ops[k]) / dt;
    out.n += 1;
  }
  for (const s of samples) {
    if (s.t < from || s.t > to) continue;
    if (s.cpuPct !== undefined) cpu.push(s.cpuPct);
    if (s.memMiB !== undefined) mem.push(s.memMiB);
  }
  const n = Math.max(out.n, 1);
  for (const k of ['insert', 'query', 'update', 'delete', 'getmore', 'command']) out[k] /= n;
  const avg = (a) => (a.length ? a.reduce((x, y) => x + y, 0) / a.length : null);
  return {
    ops: out,
    opsTotal: ['insert', 'query', 'update', 'delete', 'getmore', 'command'].reduce((s, k) => s + out[k], 0),
    cpuAvg: avg(cpu),
    cpuMax: cpu.length ? Math.max(...cpu) : null,
    memAvg: avg(mem),
    memMax: mem.length ? Math.max(...mem) : null,
  };
}

const rows = windows.map((w) => {
  const sfx = w.idx === null ? '' : `{stage:s${w.idx}}`;
  const secs = (w.end - w.start) / 1000;
  const reqs = val(`http_reqs${sfx}`, 'count') ?? 0;
  const r = rates(w.start + 10_000, w.end);
  return {
    vus: w.vus,
    seconds: secs,
    reqs,
    rps: reqs / secs,
    p50: val(`http_req_duration${sfx}`, 'med'),
    p95: val(`http_req_duration${sfx}`, 'p(95)'),
    p99: val(`http_req_duration${sfx}`, 'p(99)'),
    errPct: (val(`http_req_failed${sfx}`, 'rate') ?? 0) * 100,
    ...r,
  };
});

// 1 dakikalık kovalar (soak eğilimi için).
const buckets = [];
const t0 = meta.start;
for (let b = 0; t0 + b * 60_000 < meta.end; b += 1) {
  const r = rates(t0 + b * 60_000, t0 + (b + 1) * 60_000);
  buckets.push({ min: b + 1, cpuAvg: r.cpuAvg, memAvg: r.memAvg, memMax: r.memMax, opsTotal: r.opsTotal });
}

const endpoints = {};
for (const k of Object.keys(m)) {
  const mm = /^http_req_duration\{ep:(.+)\}$/.exec(k);
  if (mm) endpoints[mm[1]] = { p50: val(k, 'med'), p95: val(k, 'p(95)'), p99: val(k, 'p(99)'), avg: val(k, 'avg') };
}
const last = samples.at(-1) ?? {};
const analysis = {
  meta,
  rows,
  buckets,
  endpoints,
  overall: {
    reqs: val('http_reqs', 'count'),
    rps: val('http_reqs', 'rate'),
    p50: val('http_req_duration', 'med'),
    p95: val('http_req_duration', 'p(95)'),
    p99: val('http_req_duration', 'p(99)'),
    errPct: (val('http_req_failed', 'rate') ?? 0) * 100,
    iterations: val('iterations', 'count'),
    tokenRefreshes: val('token_refreshes', 'count') ?? 0,
    aiOk: val('ai_ok', 'count') ?? 0,
    aiNoCredit: val('ai_no_credit', 'count') ?? 0,
    aiOther: val('ai_other_status', 'count') ?? 0,
    checks: val('checks', 'rate'),
    droppedIterations: val('dropped_iterations', 'count') ?? 0,
  },
  oom: samples.some((s) => s.oom),
  restarts: last.restarts ?? null,
};
writeFileSync(join(dir, 'analysis.json'), JSON.stringify(analysis, null, 2));

const f = (x, d = 1) => (x === null || x === undefined ? '-' : Number(x).toFixed(d));
console.log(`\n== ${meta.name} ==  (aşama pencereleri; ilk 10 sn atlandı)`);
console.log('VU | req/s | p50 | p95 | p99 | hata% | CPU ort/maks | Bellek maks MiB | Mongo ops/s (toplam | cmd hariç)');
for (const r of rows) {
  console.log(
    `${r.vus} | ${f(r.rps)} | ${f(r.p50, 0)} | ${f(r.p95, 0)} | ${f(r.p99, 0)} | ${f(r.errPct, 2)} | ${f(r.cpuAvg, 0)}/${f(r.cpuMax, 0)} | ${f(r.memMax, 0)} | ${f(r.opsTotal)} | ${f(r.opsTotal - r.ops.command)}`,
  );
}
console.log(JSON.stringify(analysis.overall));
console.log(`oom=${analysis.oom} restarts=${analysis.restarts}`);
