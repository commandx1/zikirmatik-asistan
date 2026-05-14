import { runSpecialDaySeed } from './lib/special-day-seed.mjs';
import {
  SPECIAL_DAY_DATASET as MASTER_DATASET,
  buildEventDataset,
  getAvailableEventKeys,
} from './seed-special-days-master-2026.mjs';

async function main() {
  const args = parseArgs(process.argv.slice(2));

  if (args.all) {
    await runSpecialDaySeed(MASTER_DATASET);
    return;
  }

  if (!args.event) {
    printUsage();
    process.exitCode = 1;
    return;
  }

  const dataset = buildEventDataset(args.event);
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
  const available = getAvailableEventKeys()
    .map((item) => `- ${item}`)
    .join('\n');
  console.log(
    `Kullanım:\n  node scripts/seed-special-days.mjs --event <event-key>\n  node scripts/seed-special-days.mjs --all\n\nMevcut event keyler:\n${available}`,
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
