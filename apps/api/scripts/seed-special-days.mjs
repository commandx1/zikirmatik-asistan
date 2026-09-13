/* global console, process */
import { runSpecialDaySeed, SPECIAL_DAYS_SEED_MIN_DATE } from './lib/special-day-seed.mjs';
import {
  SPECIAL_DAY_DATASET as MASTER_DATASET,
  buildEventDataset,
  getAvailableEventFamilies,
} from './seed-special-days-master-2026.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  const dataset = resolveDataset(args);
  if (!dataset) {
    process.exitCode = 1;
    return;
  }

  const options = {
    dryRun: args.dryRun,
    deactivateOrphans: args.deactivateOrphans,
    includeHistory: args.includeHistory,
  };

  if (args.dryRun) {
    const result = await runSpecialDaySeed(dataset, options);
    printDryRunReport(result);
    return;
  }

  await runSpecialDaySeed(dataset, options);
}

function resolveDataset(args) {
  // --dry-run tek başına verildiğinde (--all/--event yok) tüm ailelerin
  // 1447-1450 açılımını göstermek için MASTER_DATASET kullanılır.
  if (args.all || (args.dryRun && !args.event)) {
    return MASTER_DATASET;
  }

  if (!args.event) {
    printUsage();
    return null;
  }

  const dataset = buildEventDataset(args.event);
  if (!dataset) {
    console.error(`Bilinmeyen event/aile: ${args.event}`);
    printUsage();
    return null;
  }

  return dataset;
}

function parseArgs(args) {
  let event;
  let all = false;
  let dryRun = false;
  let deactivateOrphans = false;
  let includeHistory = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--all') {
      all = true;
      continue;
    }

    if (arg === '--dry-run') {
      dryRun = true;
      continue;
    }

    if (arg === '--deactivate-orphans') {
      deactivateOrphans = true;
      continue;
    }

    if (arg === '--include-history') {
      includeHistory = true;
      continue;
    }

    if (arg === '--event') {
      event = args[index + 1];
      index += 1;
      continue;
    }
  }

  return { event, all, dryRun, deactivateOrphans, includeHistory };
}

function printUsage() {
  const available = getAvailableEventFamilies()
    .map((item) => `- ${item}`)
    .join('\n');
  console.log(
    `Kullanım:\n  node scripts/seed-special-days.mjs --event <aile-anahtarı> [--dry-run] [--deactivate-orphans] [--include-history]\n  node scripts/seed-special-days.mjs --all [--dry-run] [--deactivate-orphans] [--include-history]\n  node scripts/seed-special-days.mjs --dry-run   (tüm aileler, DB'ye yazmaz)\n\n` +
      `  --deactivate-orphans  Bu çalışmada üretilmeyen ama hâlâ yönetilen bir aileye ait\n` +
      `                        (^<aile>-\\d{4}$) veya LEGACY_EVENT_KEYS listesindeki eski\n` +
      `                        eventKey'e sahip aktif kayıtları isActive:false yapar (SİLMEZ).\n` +
      `  --include-history     SPECIAL_DAYS_SEED_MIN_DATE (${SPECIAL_DAYS_SEED_MIN_DATE}) altındaki\n` +
      `                        kayıtları da üretir (varsayılan: atlanır).\n\n` +
      `Mevcut aileler (eventFamily):\n${available}`,
  );
}

function printDryRunReport({ expanded, skipped, belowMinDate, dhikrItems, orphans }) {
  const byFamily = new Map();
  for (const doc of expanded) {
    const family = doc.eventFamily ?? doc.eventKey;
    if (!byFamily.has(family)) byFamily.set(family, []);
    byFamily.get(family).push(doc);
  }

  console.log('=== ÖZEL GÜN DRY-RUN RAPORU (DB\'YE YAZILMADI) ===');
  console.log(`Şablon sayısı (dhikrItems): ${dhikrItems.length}`);
  console.log(`Üretilen kayıt sayısı: ${expanded.length}`);
  console.log(`Atlanan (ay başlangıcı bilinmiyor): ${skipped.length}`);
  console.log(`Min tarih altı (${SPECIAL_DAYS_SEED_MIN_DATE} öncesi, atlanan): ${belowMinDate?.length ?? 0}`);
  console.log('');

  for (const [family, docs] of [...byFamily.entries()].sort((a, b) => a[0].localeCompare(b[0]))) {
    console.log(`--- ${family} (${docs.length} kayıt) ---`);
    for (const doc of docs) {
      const nameTr = typeof doc.name === 'object' ? doc.name?.tr : doc.name;
      const dayIndexTxt = doc.dayIndex !== undefined ? ` dayIndex=${doc.dayIndex}` : '';
      console.log(`  ${doc.eventKey}${dayIndexTxt}  ${doc.date}  (${doc.hijriDate})  ${nameTr}`);
    }
  }

  if (skipped.length > 0) {
    console.log('');
    console.log('--- ATLANANLAR (ay başlangıcı null) ---');
    for (const s of skipped) {
      console.log(`  ${s.eventFamily} hicri ${s.hijriYear}: ${s.name} — ${s.reason}`);
    }
  }

  if (belowMinDate && belowMinDate.length > 0) {
    console.log('');
    console.log(`--- MİN TARİH ALTI (${SPECIAL_DAYS_SEED_MIN_DATE} öncesi, --include-history ile üretilir) ---`);
    for (const doc of belowMinDate) {
      const nameTr = typeof doc.name === 'object' ? doc.name?.tr : doc.name;
      console.log(`  ${doc.eventKey}  ${doc.date}  ${nameTr}`);
    }
  }

  if (orphans && orphans.length > 0) {
    console.log('');
    console.log('--- DEVRE DIŞI BIRAKILACAK (--deactivate-orphans ile isActive:false, SİLİNMEZ) ---');
    for (const doc of orphans) {
      const nameTr = typeof doc.name === 'object' ? doc.name?.tr : doc.name;
      console.log(`  ${doc.eventKey}  ${doc.date}  ${nameTr}`);
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});

/*
pnpm --filter api seed:special-days -- --all
pnpm --filter api seed:special-days -- --dry-run
*/
