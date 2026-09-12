/* global console, process */
/**
 * READ-ONLY audit: `dhikrs` koleksiyonundaki `recommendedCount` değerlerini
 * scripts/data/sourceDataset.mjs (SOURCE_DATASETS) içindeki beklenen
 * değerlerle karşılaştırır.
 *
 * Amaç: geçmişte selectRecommendation akışında `recommendedCount` alanına
 * yanlışlıkla uygulanan `$inc` operasyonlarının (artık düzeltilen bug —
 * bkz. src/modules/ai/ai.service.ts `selectRecommendation`) veriyi şişirip
 * şişirmediğini tespit etmek. Bu betik HİÇBİR YAZMA YAPMAZ; sadece okur ve
 * raporlar. --apply/--fix gibi bir seçenek YOKTUR ve eklenmeyecektir.
 *
 * Kullanım:
 *   node scripts/audit-recommended-count.mjs
 *   node scripts/audit-recommended-count.mjs --json   # tam mismatch listesini JSON olarak basar
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { SOURCE_DATASETS } from './data/sourceDataset.mjs';

function loadEnvFiles(paths) {
  for (const path of paths) {
    const absolutePath = resolve(process.cwd(), path);
    if (!existsSync(absolutePath)) {
      continue;
    }
    const content = readFileSync(absolutePath, 'utf8');
    for (const line of content.split(/\r?\n/)) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const separatorIndex = trimmed.indexOf('=');
      if (separatorIndex <= 0) continue;
      const key = trimmed.slice(0, separatorIndex).trim();
      let value = trimmed.slice(separatorIndex + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }
      if (process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  }
}

/**
 * seed-dhikrs.mjs ile birebir aynı düzleştirme/varsayılan mantığı:
 * her dataset.dhikrItems öğesini key → recommendedCount (yoksa 33) eşler.
 * Aynı key birden çok dataset'te geçiyorsa (seed script'te de olduğu gibi)
 * son gelen değer geçerli sayılır — upsert davranışını birebir taklit eder.
 */
function buildExpectedMap(datasets) {
  const expected = new Map();
  const everUsedValues = new Set();

  for (const dataset of datasets) {
    if (!Array.isArray(dataset.dhikrItems)) continue;
    for (const item of dataset.dhikrItems) {
      const key = typeof item.key === 'string' ? item.key.trim() : '';
      if (!key) continue;
      const recommendedCount = item.recommendedCount ?? 33;
      expected.set(key, { recommendedCount, nameTr: item.name?.tr ?? '' });
      everUsedValues.add(recommendedCount);
    }
  }
  // 33 her zaman "kullanılmış" sayılır — default değer, dataset'te açıkça
  // yazılmasa bile buildDoc() bunu üretir.
  everUsedValues.add(33);

  return { expected, everUsedValues };
}

function parseArgs() {
  return {
    json: process.argv.includes('--json'),
  };
}

async function main() {
  loadEnvFiles(['.env', '.env.local']);

  const { json } = parseArgs();

  const mongoUri = process.env.MONGODB_URI?.trim();
  if (!mongoUri) {
    console.error('MONGODB_URI bulunamadı. apps/api/.env dosyasını kontrol et.');
    console.error('Hiçbir okuma yapılmadı. Betik durduruldu.');
    process.exitCode = 1;
    return;
  }

  const { expected, everUsedValues } = buildExpectedMap(SOURCE_DATASETS);

  const { default: mongoose } = await import('mongoose');

  let connected = false;
  try {
    await mongoose.connect(mongoUri, { autoIndex: false, serverSelectionTimeoutMS: 8000 });
    connected = true;
  } catch (error) {
    console.error(
      `MongoDB'ye bağlanılamadı: ${error instanceof Error ? error.message : String(error)}`,
    );
    console.error('Hiçbir okuma yapılmadı. Betik durduruldu.');
    process.exitCode = 1;
    return;
  }

  try {
    const dhikrsCol = mongoose.connection.collection('dhikrs');

    // Yalnızca gerekli alanları projeksiyonla oku — read-only.
    const docs = await dhikrsCol
      .find(
        {},
        {
          projection: {
            _id: 1,
            key: 1,
            'name.tr': 1,
            recommendedCount: 1,
            selectionCount: 1,
          },
        },
      )
      .toArray();

    const totalDocs = docs.length;
    const docsWithoutKey = docs.filter((d) => !d.key || typeof d.key !== 'string').length;

    const mismatches = [];
    const notInSeedValues = [];
    let sumDelta = 0;
    let comparable = 0;

    for (const doc of docs) {
      const key = typeof doc.key === 'string' ? doc.key.trim() : '';
      if (!key) continue; // key'siz kayıtlar seed ile karşılaştırılamaz (elle eklenmiş olabilir)

      const exp = expected.get(key);
      if (!exp) continue; // dataset'te artık bulunmayan / kaldırılmış key

      comparable += 1;
      const actual = typeof doc.recommendedCount === 'number' ? doc.recommendedCount : undefined;
      const expectedValue = exp.recommendedCount;

      if (actual === undefined || actual !== expectedValue) {
        const delta = (actual ?? 0) - expectedValue;
        sumDelta += delta;
        mismatches.push({
          key,
          nameTr: doc.name?.tr ?? exp.nameTr ?? '',
          expected: expectedValue,
          actual,
          delta,
          selectionCount: doc.selectionCount ?? 0,
        });
      }

      if (actual !== undefined && !everUsedValues.has(actual)) {
        notInSeedValues.push({
          key,
          nameTr: doc.name?.tr ?? exp.nameTr ?? '',
          actual,
          expected: expectedValue,
        });
      }
    }

    mismatches.sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta));
    notInSeedValues.sort((a, b) => b.actual - a.actual);

    console.log('\n=== recommendedCount Audit (READ-ONLY) ===');
    console.log(`Toplam dhikrs dokümanı        : ${totalDocs}`);
    console.log(`key alanı olmayan dokümanlar   : ${docsWithoutKey}`);
    console.log(`Seed'de karşılığı olan (key eşleşen) : ${comparable}`);
    console.log(`Uyuşmayan (recommendedCount !== expected) : ${mismatches.length}`);
    console.log(`Delta toplamı (actual - expected, tüm uyuşmazlıklar) : ${sumDelta}`);
    console.log(
      `Seed'de HİÇBİR ZAMAN kullanılmamış bir değere sahip dokümanlar (şişme belirtisi) : ${notInSeedValues.length}`,
    );

    console.log('\n── En büyük 30 fark (|delta| azalan) ──');
    if (mismatches.length === 0) {
      console.log('  (uyuşmazlık yok)');
    } else {
      console.log(
        '  key'.padEnd(34) +
          'name.tr'.padEnd(32) +
          'expected'.padStart(10) +
          'actual'.padStart(10) +
          'delta'.padStart(10),
      );
      for (const m of mismatches.slice(0, 30)) {
        console.log(
          '  ' +
            String(m.key).padEnd(32) +
            String(m.nameTr).slice(0, 30).padEnd(32) +
            String(m.expected).padStart(10) +
            String(m.actual ?? '(yok)').padStart(10) +
            String(m.delta).padStart(10),
        );
      }
    }

    console.log('\n── Seed\'de hiç kullanılmamış değerler (ilk 30) ──');
    if (notInSeedValues.length === 0) {
      console.log('  (yok — tüm actual değerler seed\'de en az bir yerde kullanılmış)');
    } else {
      for (const n of notInSeedValues.slice(0, 30)) {
        console.log(`  key=${n.key.padEnd(30)} actual=${n.actual}  (bu dataset için expected=${n.expected})`);
      }
    }

    if (json) {
      console.log('\n=== JSON (tam mismatch listesi) ===');
      console.log(
        JSON.stringify(
          {
            totalDocs,
            docsWithoutKey,
            comparable,
            mismatchCount: mismatches.length,
            sumDelta,
            notInSeedValuesCount: notInSeedValues.length,
            mismatches,
            notInSeedValues,
          },
          null,
          2,
        ),
      );
    }

    console.log('\n(Bu betik salt okunurdur; hiçbir yazma yapılmadı.)');
  } finally {
    if (connected) {
      await mongoose.disconnect();
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
