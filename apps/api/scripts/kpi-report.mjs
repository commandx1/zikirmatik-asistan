// devices + app_events koleksiyonlarından haftalık install kohortu (D1/D7/D30
// retention) ve activation→purchase funnel raporu üretir (read-only).
//   node scripts/kpi-report.mjs                (son 8 hafta)
//   node scripts/kpi-report.mjs --weeks 4
//   node scripts/kpi-report.mjs --json
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { computeCohorts, isoWeekStart } from './lib/kpi-report.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) continue;
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const sep = trimmed.indexOf('=');
      if (sep <= 0) continue;
      const key = trimmed.slice(0, sep).trim();
      let value = trimmed.slice(sep + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) process.env[key] = value;
    }
  }
}

// app_events koleksiyonu 180 günlük TTL ile siliniyor (~25.7 hafta) — daha
// eski haftalar için app_opened tabanlı retention zaten ölçülemez, bu yüzden
// pencere burada sabit tavana kırpılır.
const MAX_WEEKS = 25;

function parseWeeks() {
  const idx = process.argv.indexOf('--weeks');
  if (idx >= 0) {
    const n = Number(process.argv[idx + 1]);
    if (Number.isFinite(n) && n > 0) {
      if (n > MAX_WEEKS) {
        console.log(`[rapor] --weeks ${n} > ${MAX_WEEKS} (app_events TTL 180g); ${MAX_WEEKS} haftaya kırpıldı.`);
        return MAX_WEEKS;
      }
      return n;
    }
  }
  return 8;
}

const wantsJson = process.argv.includes('--json');

const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);
const pct = (n) => (n === null ? '—' : `%${n.toFixed(1)}`);

function printTable(title, rows, cols) {
  console.log(`\n=== ${title} ===`);
  if (rows.length === 0) {
    console.log('  (kayıt yok)');
    return;
  }
  const header = cols.map((c) => pad(c.h, c.w)).join('  ');
  console.log('  ' + header);
  console.log('  ' + '-'.repeat(header.length));
  for (const r of rows) {
    console.log('  ' + cols.map((c) => pad(c.f(r), c.w)).join('  '));
  }
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);
  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    throw new Error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
  }

  const weeks = parseWeeks();
  const now = new Date();
  const since = new Date(isoWeekStart(now).getTime() - (weeks - 1) * 7 * 24 * 60 * 60 * 1000);

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    const devicesCol = mongoose.connection.collection('devices');
    const eventsCol = mongoose.connection.collection('app_events');

    // 1) Kohort + retention
    const devices = await devicesCol
      .find({ createdAt: { $gte: since } }, { projection: { deviceId: 1, platform: 1, createdAt: 1, lastSeenAt: 1 } })
      .toArray();
    const deviceIds = devices.map((d) => d.deviceId);

    const opens = await eventsCol
      .aggregate([
        { $match: { deviceId: { $in: deviceIds }, name: 'app_opened' } },
        { $group: { _id: '$deviceId', ts: { $push: '$createdAt' } } },
      ])
      .toArray();
    const opensByDevice = new Map(opens.map((o) => [o._id, o.ts]));

    const cohorts = computeCohorts(devices, opensByDevice, now);

    // 2) Funnel (aynı pencere: bu döneme install olan cihazlar)
    const funnelEventNames = ['dhikr_completed', 'paywall_viewed', 'purchase_completed'];
    const funnelAgg = await eventsCol
      .aggregate([
        { $match: { deviceId: { $in: deviceIds }, name: { $in: [...funnelEventNames, 'vird_activated', 'circle_created', 'circle_joined'] } } },
        { $group: { _id: '$name', devices: { $addToSet: '$deviceId' } } },
      ])
      .toArray();
    const devicesWith = (name) => funnelAgg.find((r) => r._id === name)?.devices.length ?? 0;

    const installs = devices.length;
    const funnel = {
      installs,
      dhikr_completed: devicesWith('dhikr_completed'),
      paywall_viewed: devicesWith('paywall_viewed'),
      purchase_completed: devicesWith('purchase_completed'),
      vird_activated: devicesWith('vird_activated'),
      circle: new Set([
        ...(funnelAgg.find((r) => r._id === 'circle_created')?.devices ?? []),
        ...(funnelAgg.find((r) => r._id === 'circle_joined')?.devices ?? []),
      ]).size,
    };

    // 3) Özet — install-ağırlıklı Genel D7 (yüzdelerin ağırlıksız ortalaması
    // DEĞİL: erken/küçük kohortları orantısız yükseltir).
    const measurableD7 = cohorts.filter((c) => c.d7 !== null);
    const installsWeightedD7 = measurableD7.reduce((s, c) => s + c.installs, 0);
    const avgD7 =
      installsWeightedD7 > 0
        ? (measurableD7.reduce((s, c) => s + c.retainedD7, 0) / installsWeightedD7) * 100
        : null;
    const paywallToPurchase =
      funnel.paywall_viewed > 0 ? (funnel.purchase_completed / funnel.paywall_viewed) * 100 : null;

    if (wantsJson) {
      console.log(JSON.stringify({ weeks, since: since.toISOString(), cohorts, funnel, summary: { avgD7, paywallToPurchase } }, null, 2));
      return;
    }

    console.log(`\nKPI Raporu — son ${weeks} hafta (>= ${since.toISOString().slice(0, 10)})`);
    console.log('  Not: haftalar UTC Pazartesi kovaları; "install" = ilk başarılı cihaz kaydı;');
    console.log('  iOS\'ta yeniden yükleme yeni bir deviceId üretir; app_events TTL 180g;');
    console.log('  retention = lastSeenAt VEYA app_opened olayı (birleşim).');

    printTable('Haftalık install kohortu (D1/D7/D30 retention)', cohorts, [
      { h: 'hafta', w: 12, f: (r) => r.week },
      { h: 'install', w: 8, f: (r) => padL(r.installs, 7) },
      { h: 'android', w: 8, f: (r) => padL(r.android, 7) },
      { h: 'ios', w: 6, f: (r) => padL(r.ios, 5) },
      { h: 'D1', w: 8, f: (r) => padL(pct(r.d1), 7) },
      { h: 'D7', w: 8, f: (r) => padL(pct(r.d7), 7) },
      { h: 'D30', w: 8, f: (r) => padL(pct(r.d30), 7) },
    ]);

    const funnelRows = [
      { step: 'installs', count: funnel.installs },
      { step: '≥1 dhikr_completed', count: funnel.dhikr_completed },
      { step: '≥1 paywall_viewed', count: funnel.paywall_viewed },
      { step: '≥1 purchase_completed', count: funnel.purchase_completed },
      { step: 'vird_activated', count: funnel.vird_activated },
      { step: 'circle_created + circle_joined', count: funnel.circle },
    ];
    printTable('Activation → purchase funnel', funnelRows, [
      { h: 'adım', w: 30, f: (r) => r.step },
      { h: 'cihaz', w: 8, f: (r) => padL(r.count, 6) },
      { h: '% install', w: 10, f: (r) => padL(installs ? `%${((r.count / installs) * 100).toFixed(1)}` : '—', 9) },
    ]);

    console.log('\n=== ÖZET ===');
    console.log(`  Genel D7 (ölçülebilir kohortlar) : ${avgD7 === null ? '—' : pct(avgD7)}`);
    console.log(`  paywall → purchase dönüşümü      : ${paywallToPurchase === null ? '—' : pct(paywallToPurchase)}`);
    console.log('');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[rapor] HATA:', err.message);
  process.exit(1);
});
