import { runSpecialDaySeed } from './lib/special-day-seed.mjs';
import { SPECIAL_DAY_DATASET as KURBAN_2026 } from './seed-kurban-bayrami-2026.mjs';
import { SPECIAL_DAY_DATASET as ZILHICCE_2026 } from './seed-zilhicce-ilk-on-2026.mjs';
import { SPECIAL_DAY_DATASET as MEVLID_2026 } from './seed-mevlid-kandili-2026.mjs';

const DATASETS = [KURBAN_2026, ZILHICCE_2026, MEVLID_2026];
const DATASET_MAP = new Map(DATASETS.map((dataset) => [dataset.key, dataset]));

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    for (const dataset of DATASETS) {
      await runSpecialDaySeed(dataset);
    }
    return;
  }

  if (!args.event) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const dataset = DATASET_MAP.get(args.event);
  if (!dataset) {
    console.error(`Bilinmeyen event key: ${args.event}`);
    printUsage();
    process.exitCode = 1;
    return;
  }

  await runSpecialDaySeed(dataset);
}

function parseArgs(args) {
  let event;
  let all = false;

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index];

    if (arg === '--all') {
      all = true;
      continue;
    }

    if (arg === '--event') {
      event = args[index + 1];
      index += 1;
      continue;
    }
  }

  return { event, all };
}

function printUsage() {
  const available = DATASETS.map((item) => `- ${item.key}`).join('\n');
  console.log(
    `Kullanım:\n  node scripts/seed-special-days.mjs --event <event-key>\n  node scripts/seed-special-days.mjs --all\n\nMevcut event keyler:\n${available}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
