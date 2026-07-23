/* global console, process */
// ai_usage_log koleksiyonundan gerçek AI token/maliyet raporu üretir (read-only).
// AiUsageService.record(...) tarafından yazılan satırları okur; ai_credit_ledger
// ile flowId üzerinden birleştirip mesaj başı gerçek maliyeti çıkarır.
//   node scripts/ai-cost-report.mjs            (son 30 gün)
//   node scripts/ai-cost-report.mjs --days 7   (son 7 gün)
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const USD_TRY = Number(process.env.AI_REPORT_USD_TRY ?? 34); // rapor için sabit kur

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

function parseDays() {
  const idx = process.argv.indexOf('--days');
  if (idx >= 0) {
    const n = Number(process.argv[idx + 1]);
    if (Number.isFinite(n) && n > 0) return n;
  }
  return 30;
}

const usd = (n) => `$${(n ?? 0).toFixed(4)}`;
const tl = (n) => `₺${((n ?? 0) * USD_TRY).toFixed(2)}`;
const pad = (s, n) => String(s).padEnd(n);
const padL = (s, n) => String(s).padStart(n);

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

  const days = parseDays();
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const { default: mongoose } = await import('mongoose');
  await mongoose.connect(mongoUri, {
    autoIndex: false,
    serverSelectionTimeoutMS: 8000,
  });

  try {
    const usageCol = mongoose.connection.collection('ai_usage_log');
    const ledgerCol = mongoose.connection.collection('ai_credit_ledger');
    const match = { createdAt: { $gte: since } };

    console.log(
      `\nAI Maliyet Raporu — son ${days} gün (>= ${since.toISOString().slice(0, 10)}), kur=₺${USD_TRY}/$`,
    );

    // 1) kind bazında
    const byKind = await usageCol
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$kind',
            calls: { $sum: 1 },
            inTok: { $sum: '$inputTokens' },
            outTok: { $sum: '$outputTokens' },
            cost: { $sum: '$estCostUsd' },
          },
        },
        { $sort: { cost: -1 } },
      ])
      .toArray();

    printTable(
      'Çağrı türüne göre',
      byKind,
      [
        { h: 'kind', w: 12, f: (r) => r._id ?? '-' },
        { h: 'çağrı', w: 8, f: (r) => padL(r.calls, 6) },
        { h: 'in tok', w: 10, f: (r) => padL(r.inTok, 9) },
        { h: 'out tok', w: 10, f: (r) => padL(r.outTok, 9) },
        { h: 'maliyet$', w: 12, f: (r) => padL(usd(r.cost), 11) },
        { h: 'maliyet₺', w: 12, f: (r) => padL(tl(r.cost), 11) },
      ],
    );

    // 2) model bazında
    const byModel = await usageCol
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: '$model',
            calls: { $sum: 1 },
            cost: { $sum: '$estCostUsd' },
          },
        },
        { $sort: { cost: -1 } },
      ])
      .toArray();

    printTable('Modele göre', byModel, [
      { h: 'model', w: 26, f: (r) => r._id ?? '-' },
      { h: 'çağrı', w: 8, f: (r) => padL(r.calls, 6) },
      { h: 'maliyet$', w: 12, f: (r) => padL(usd(r.cost), 11) },
      { h: 'maliyet₺', w: 12, f: (r) => padL(tl(r.cost), 11) },
    ]);

    // 3) günlük trend
    const byDay = await usageCol
      .aggregate([
        { $match: match },
        {
          $group: {
            _id: {
              $dateToString: { format: '%Y-%m-%d', date: '$createdAt' },
            },
            cost: { $sum: '$estCostUsd' },
            calls: { $sum: 1 },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    printTable('Günlük', byDay, [
      { h: 'gün', w: 12, f: (r) => r._id },
      { h: 'çağrı', w: 8, f: (r) => padL(r.calls, 6) },
      { h: 'maliyet$', w: 12, f: (r) => padL(usd(r.cost), 11) },
      { h: 'maliyet₺', w: 12, f: (r) => padL(tl(r.cost), 11) },
    ]);

    // 4) mesaj başı maliyet: flowId'li satırları grupla (bir mesaj = bir flow)
    const perFlow = await usageCol
      .aggregate([
        { $match: { ...match, flowId: { $type: 'string' } } },
        { $group: { _id: '$flowId', cost: { $sum: '$estCostUsd' } } },
        {
          $group: {
            _id: null,
            flows: { $sum: 1 },
            totalCost: { $sum: '$cost' },
            maxCost: { $max: '$cost' },
          },
        },
      ])
      .toArray();

    const pf = perFlow[0];
    console.log('\n=== Mesaj başı (flowId) maliyet ===');
    if (!pf || pf.flows === 0) {
      console.log('  (flowId taşıyan kayıt yok)');
    } else {
      const avg = pf.totalCost / pf.flows;
      console.log(`  mesaj (flow) sayısı : ${pf.flows}`);
      console.log(`  ortalama / mesaj    : ${usd(avg)}  (${tl(avg)})`);
      console.log(`  en pahalı mesaj     : ${usd(pf.maxCost)}  (${tl(pf.maxCost)})`);
    }

    // 4b) kullanıcı bazında maliyet (userId taşıyan satırlar)
    const byUser = await usageCol
      .aggregate([
        { $match: { ...match, userId: { $type: 'objectId' } } },
        {
          $group: {
            _id: '$userId',
            calls: { $sum: 1 },
            flows: { $addToSet: '$flowId' },
            cost: { $sum: '$estCostUsd' },
          },
        },
        { $sort: { cost: -1 } },
        { $limit: 20 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'user',
          },
        },
      ])
      .toArray();

    const labelFor = (r) => {
      const u = r.user?.[0];
      const name = u?.displayName?.trim();
      if (name && name !== 'Misafir Kullanıcı') return name;
      if (u?.email) return u.email;
      return String(r._id);
    };
    const flowCount = (r) =>
      (r.flows ?? []).filter((f) => typeof f === 'string').length;

    printTable('Kullanıcı bazında maliyet (top 20)', byUser, [
      { h: 'kullanıcı', w: 26, f: (r) => labelFor(r).slice(0, 25) },
      { h: 'çağrı', w: 8, f: (r) => padL(r.calls, 6) },
      { h: 'mesaj', w: 8, f: (r) => padL(flowCount(r), 6) },
      { h: 'maliyet$', w: 12, f: (r) => padL(usd(r.cost), 11) },
      { h: 'maliyet₺', w: 12, f: (r) => padL(tl(r.cost), 11) },
    ]);
    if (byUser.length > 0) {
      console.log(
        '  Not: userId taşımayan eski kayıtlar bu tabloda görünmez.',
      );
    }

    // 5) ledger tarafı — kredi hareketleri (gelir/ücretsiz kırılımı)
    const byReason = await ledgerCol
      .aggregate([
        { $match: { createdAt: { $gte: since } } },
        {
          $group: {
            _id: '$reason',
            events: { $sum: 1 },
            credits: { $sum: '$delta' },
          },
        },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    printTable('Kredi hareketleri (ledger)', byReason, [
      { h: 'reason', w: 24, f: (r) => r._id ?? '-' },
      { h: 'olay', w: 8, f: (r) => padL(r.events, 6) },
      { h: 'kredi Δ', w: 10, f: (r) => padL(r.credits, 9) },
    ]);
    console.log(
      '  Not: gelir yalnız TOPUP_PURCHASE kredilerinden gelir; FREE_DAILY_GRANT/',
    );
    console.log(
      '  PREMIUM_MONTHLY_GRANT sübvanse (mesaj maliyeti var, doğrudan gelir yok).',
    );

    // 5b) KÂR/ZARAR — gerçek gelir (topup) vs AI gideri
    // Paket kredi adedi → ₺ fiyat (mobil revenuecat-client.ts CREDIT_TOPUP ile birebir).
    const TOPUP_PRICE_TRY = { 10: 29.99, 30: 59.99, 75: 99.99 };
    const topupByDelta = await ledgerCol
      .aggregate([
        { $match: { createdAt: { $gte: since }, reason: 'TOPUP_PURCHASE' } },
        { $group: { _id: '$delta', count: { $sum: 1 } } },
        { $sort: { _id: 1 } },
      ])
      .toArray();

    let revenueTry = 0;
    const topupRows = topupByDelta.map((r) => {
      const price = TOPUP_PRICE_TRY[r._id] ?? 0;
      const line = price * r.count;
      revenueTry += line;
      return { ...r, price, line };
    });
    if (topupRows.length) {
      printTable('Topup geliri (paket bazında)', topupRows, [
        { h: 'kredi/paket', w: 12, f: (r) => (r.price ? r._id : `${r._id} (?)`) },
        { h: 'adet', w: 8, f: (r) => padL(r.count, 6) },
        { h: 'birim ₺', w: 10, f: (r) => padL(r.price ? r.price.toFixed(2) : '?', 9) },
        { h: 'toplam ₺', w: 12, f: (r) => padL(r.line.toFixed(2), 11) },
      ]);
    }

    const aiCostUsd = byKind.reduce((s, r) => s + (r.cost ?? 0), 0);
    const aiCostTry = aiCostUsd * USD_TRY;
    console.log('\n=== KÂR/ZARAR ===');
    console.log(`  Gerçek gelir (topup) : ₺${revenueTry.toFixed(2)}`);
    console.log(`  AI gideri (${days}g)     : ${tl(aiCostUsd)}`);
    console.log(`  Net                  : ₺${(revenueTry - aiCostTry).toFixed(2)}`);
    if (revenueTry > 0) {
      console.log(
        `  Gider/gelir oranı    : %${((aiCostTry / revenueTry) * 100).toFixed(1)}`,
      );
    } else {
      console.log('  (dönemde topup geliri yok — net yalnız giderdir)');
    }

    // 5c) BİRİM EKONOMİ — mesaj başı marj (1 mesaj = 1 kredi düşer)
    console.log('\n=== BİRİM EKONOMİ (mesaj başı, 1 mesaj = 1 kredi) ===');
    if (!pf || !pf.flows) {
      console.log('  (flowId taşıyan mesaj yok — mesaj başı maliyet hesaplanamadı)');
    } else {
      const costTry = (pf.totalCost / pf.flows) * USD_TRY;
      console.log(`  Ortalama maliyet/mesaj: ₺${costTry.toFixed(3)}`);
      const marginRows = [
        { name: 'small', credits: 10, price: 29.99 },
        { name: 'medium', credits: 30, price: 59.99 },
        { name: 'large', credits: 75, price: 99.99 },
      ].map((p) => {
        const perCredit = p.price / p.credits;
        const margin = perCredit - costTry;
        return { name: p.name, perCredit, margin, pct: (margin / perCredit) * 100 };
      });
      printTable('paket bazında marj', marginRows, [
        { h: 'paket', w: 10, f: (r) => r.name },
        { h: '₺/kredi', w: 10, f: (r) => padL(r.perCredit.toFixed(2), 9) },
        { h: 'marj ₺', w: 10, f: (r) => padL(r.margin.toFixed(2), 9) },
        { h: 'marj %', w: 8, f: (r) => padL(r.pct.toFixed(0), 6) },
      ]);
      console.log(
        '  Not: ücretsiz krediler (FREE_DAILY/PREMIUM/SIGNUP) marja değil, sübvansiyona yazılır.',
      );
    }

    // 6) toplam
    const total = byKind.reduce((s, r) => s + (r.cost ?? 0), 0);
    console.log('\n=== TOPLAM ===');
    console.log(`  AI maliyeti (${days}g): ${usd(total)}  (${tl(total)})`);
    console.log(`  günlük ort.          : ${usd(total / days)}  (${tl(total / days)})`);
    console.log('');
  } finally {
    await mongoose.disconnect();
  }
}

main().catch((err) => {
  console.error('[rapor] HATA:', err.message);
  process.exit(1);
});
