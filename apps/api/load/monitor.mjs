// Yük koşusu sırasında her SAMPLE_MS (varsayılan 5 sn) örnek alır:
//  - Mongo db.serverStatus().opcounters (insert/query/update/delete/getmore/command),
//  - API kaynak kullanımı: docker stats (CONTAINER) veya yerel süreç (PID, ps).
// Çıktı JSONL: OUT dosyasına her satır bir örnek. SIGTERM ile durur.
// Kullanım: MONGODB_URI=... CONTAINER=load-api-load-1 OUT=out/run/monitor.jsonl node load/monitor.mjs
import mongoose from 'mongoose';
import { appendFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { assertLoadDbUri } from './lib/guard.mjs';

const run = promisify(execFile);
const { MONGODB_URI, CONTAINER, PID, OUT } = process.env;
const SAMPLE_MS = Number(process.env.SAMPLE_MS ?? 5000);
assertLoadDbUri(MONGODB_URI);
if (!OUT) throw new Error('OUT gerekli');
mkdirSync(dirname(OUT), { recursive: true });
writeFileSync(OUT, '');

const client = new mongoose.mongo.MongoClient(MONGODB_URI);
await client.connect();
const admin = client.db('admin');

async function resources() {
  try {
    if (CONTAINER) {
      const [{ stdout }, { stdout: insp }] = await Promise.all([
        run('docker', ['stats', '--no-stream', '--format', '{{.CPUPerc}}|{{.MemUsage}}', CONTAINER]),
        run('docker', ['inspect', '-f', '{{.State.OOMKilled}}|{{.RestartCount}}|{{.State.Running}}', CONTAINER]),
      ]);
      const [cpu, mem] = stdout.trim().split('|');
      const [memUsed] = mem.split(' / ');
      const toMiB = (s) => (s.endsWith('GiB') ? parseFloat(s) * 1024 : s.endsWith('KiB') ? parseFloat(s) / 1024 : parseFloat(s));
      const [oom, restarts, running] = insp.trim().split('|');
      return { cpuPct: parseFloat(cpu), memMiB: toMiB(memUsed), oom: oom === 'true', restarts: Number(restarts), running: running === 'true' };
    }
    if (PID) {
      const { stdout } = await run('ps', ['-o', '%cpu=,rss=', '-p', PID]);
      const [cpu, rss] = stdout.trim().split(/\s+/);
      return { cpuPct: parseFloat(cpu), memMiB: parseInt(rss, 10) / 1024 };
    }
  } catch (e) {
    return { err: String(e.message).slice(0, 80) };
  }
  return {};
}

let stop = false;
process.on('SIGTERM', () => (stop = true));
process.on('SIGINT', () => (stop = true));

while (!stop) {
  const t0 = Date.now();
  const [ss, res] = await Promise.all([admin.command({ serverStatus: 1 }), resources()]);
  appendFileSync(
    OUT,
    JSON.stringify({
      t: Date.now(),
      ops: ss.opcounters,
      conns: ss.connections?.current,
      ...res,
    }) + '\n',
  );
  await new Promise((r) => setTimeout(r, Math.max(0, SAMPLE_MS - (Date.now() - t0))));
}
await client.close();
