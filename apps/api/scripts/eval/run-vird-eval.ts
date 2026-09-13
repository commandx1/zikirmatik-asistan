/**
 * AI Vird Programı eval runner — GERÇEK `VirdProgramAgentService.run()`'ı
 * Nest DI konteynerinden alıp golden dataset
 * (`datasets/vird-intents.json`) üzerinde çalıştırır ve
 * `reports/vird-<ISO>.json` üretir.
 *
 * LLM-free YAPISAL kontroller yapar (kind eşleşmesi, faz sayısı aralığı,
 * istenen dilimlerin kapsanması, etiket isabeti) — henüz bir LLM hakem
 * (judge) katmanı YOKTUR (bkz. docs/vird-programi.md "Eval" notu; diğer
 * runner'ların `lib/judge.ts`'i bilerek burada genişletilmedi).
 *
 * `--dry-run` HİÇBİR Mongo/AI SDK çağrısı YAPMAZ — bkz. run-rehber-eval.ts
 * dosya başı yorumu (aynı bootstrapEvalContext güvencesi burada da geçerli).
 *
 * Kullanım:
 *   pnpm --filter api eval:vird -- --dry-run
 *   pnpm --filter api eval:vird -- --limit 5
 *   AI_EVAL_USER_ID=<objectId> pnpm --filter api eval:vird
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from './lib/args';
import {
  describeError,
  gitSha,
  newRunId,
  validateEvalUserId,
} from './lib/util';
import { runPool } from './lib/pool';
import { bootstrapEvalContext } from './lib/bootstrap';
import {
  summarizeVird,
  type VirdCaseResult,
  type VirdOutcomeKind,
} from '../../src/modules/ai/eval/metrics';
import { AiRuntimeService } from '../../src/modules/ai/ai-runtime.service';
import type { VirdSlotKey } from '../../src/modules/vird/vird.types';

type DatasetItem = {
  id: string;
  freeText: string;
  locale: 'tr' | 'en';
  category: string;
  durationDays: 7 | 14 | 30;
  slots: VirdSlotKey[];
  expect: {
    kind: 'program' | 'offTopic' | 'any';
    phasesBetween?: [number, number];
    slotsCovered?: VirdSlotKey[];
    tagsAny?: string[];
  };
};

type VirdReportCase = {
  id: string;
  category: string;
  freeText: string;
  locale: string;
  durationDays: number;
  slots: string[];
  outcomeKind: VirdOutcomeKind;
  expectKind: string;
  kindMatch: boolean;
  phaseCount?: number;
  phaseCountOk?: boolean;
  slotsCoveredOk?: boolean;
  tagsAnyHit?: boolean;
  title?: string;
  summary?: string;
  latencyMs: number;
  error?: string;
};

const REPORTS_DIR = join(__dirname, 'reports');

function loadDataset(): DatasetItem[] {
  const raw = readFileSync(
    join(__dirname, 'datasets', 'vird-intents.json'),
    'utf8',
  );
  return JSON.parse(raw) as DatasetItem[];
}

function filterDataset(
  dataset: DatasetItem[],
  args: ReturnType<typeof parseArgs>,
): DatasetItem[] {
  let result = dataset;
  if (args.locale) {
    result = result.filter((item) => item.locale === args.locale);
  }
  if (args.ids) {
    const idSet = new Set(args.ids);
    result = result.filter((item) => idSet.has(item.id));
  }
  if (args.limit) {
    result = result.slice(0, args.limit);
  }
  return result;
}

function printDryRunSummary(
  fullDataset: DatasetItem[],
  selected: DatasetItem[],
): void {
  const byCategory: Record<string, number> = {};
  const byExpectKind: Record<string, number> = {};
  for (const item of selected) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byExpectKind[item.expect.kind] = (byExpectKind[item.expect.kind] ?? 0) + 1;
  }

  console.log('=== AI Vird Programı Eval — DRY RUN ===');
  console.log(`Toplam dataset: ${fullDataset.length} vaka`);
  console.log(`Çalıştırılacak (filtreli): ${selected.length} vaka`);
  console.log('Kategoriye göre:', byCategory);
  console.log('Beklenen sonuç türüne göre:', byExpectKind);
  console.log('\nÖrnek vakalar:');
  for (const item of selected.slice(0, 5)) {
    console.log(
      `  [${item.id}] (${item.category}) "${item.freeText.slice(0, 60)}" ` +
        `durationDays=${item.durationDays} slots=[${item.slots.join(',')}] → expect=${item.expect.kind}`,
    );
  }
  console.log(
    "\nGerçek çalıştırma için AI_EVAL_USER_ID ortam değişkenini set edip --dry-run'ı kaldırın.",
  );
}

/** Faz sayısı [min,max] (dahil) aralığında mı. */
function isPhaseCountOk(
  phaseCount: number,
  range: [number, number] | undefined,
): boolean | undefined {
  if (!range) return undefined;
  const [min, max] = range;
  return phaseCount >= min && phaseCount <= max;
}

/** İstenen dilimlerin HEPSİ en az bir fazda kullanılmış mı. */
function isSlotsCoveredOk(
  phases: Array<{ slots: Partial<Record<VirdSlotKey, unknown[]>> }>,
  wanted: VirdSlotKey[] | undefined,
): boolean | undefined {
  if (!wanted) return undefined;
  const usedSlots = new Set<VirdSlotKey>();
  for (const phase of phases) {
    for (const [slotKey, items] of Object.entries(phase.slots)) {
      if (items && items.length > 0) {
        usedSlots.add(slotKey as VirdSlotKey);
      }
    }
  }
  return wanted.every((slot) => usedSlots.has(slot));
}

/** `expect.tagsAny`den herhangi biri, programdaki HERHANGİ bir zikrin etiketlerinde geçiyor mu. */
function isTagsAnyHit(
  phases: Array<{
    slots: Partial<Record<VirdSlotKey, Array<{ dhikr: { tags: string[] } }>>>;
  }>,
  wanted: string[] | undefined,
): boolean | undefined {
  if (!wanted) return undefined;
  const wantedSet = new Set(wanted);
  for (const phase of phases) {
    for (const items of Object.values(phase.slots)) {
      for (const item of items ?? []) {
        if (item.dhikr.tags.some((tag) => wantedSet.has(tag))) {
          return true;
        }
      }
    }
  }
  return false;
}

async function main(): Promise<void> {
  const args = parseArgs(process.argv.slice(2));
  const fullDataset = loadDataset();
  const dataset = filterDataset(fullDataset, args);

  if (args.dryRun) {
    printDryRunSummary(fullDataset, dataset);
    return;
  }

  if (dataset.length === 0) {
    console.error('Filtre sonrası çalıştırılacak vaka kalmadı.');
    process.exitCode = 1;
    return;
  }

  const userId = validateEvalUserId(process.env.AI_EVAL_USER_ID);
  const runId = newRunId();
  const startedAt = new Date().toISOString();
  console.log(
    `\n=== AI Vird Programı Eval çalıştırılıyor (runId=${runId}) ===`,
  );
  console.log(`${dataset.length} vaka, concurrency=${args.concurrency}\n`);

  const { app, virdAgent, usageLogModel } = await bootstrapEvalContext();
  const runtime = app.get(AiRuntimeService);

  const results: VirdCaseResult[] = [];
  const reportCases: VirdReportCase[] = [];

  await runPool(dataset, args.concurrency, async (item) => {
    const flowId = `eval-${runId}-${item.id}`;
    const started = Date.now();

    try {
      const outcome = await virdAgent.run({
        freeText: item.freeText,
        durationDays: item.durationDays,
        slots: item.slots,
        recentDhikrIds: [],
        locale: item.locale,
        flowId,
        userId,
      });
      const latencyMs = Date.now() - started;

      const outcomeKind: VirdOutcomeKind = outcome.kind;
      const kindMatch =
        item.expect.kind === 'any' || item.expect.kind === outcomeKind;

      let phaseCount: number | undefined;
      let phaseCountOk: boolean | undefined;
      let slotsCoveredOk: boolean | undefined;
      let tagsAnyHit: boolean | undefined;

      if (outcome.kind === 'program') {
        phaseCount = outcome.phases.length;
        phaseCountOk = isPhaseCountOk(phaseCount, item.expect.phasesBetween);
        slotsCoveredOk = isSlotsCoveredOk(
          outcome.phases,
          item.expect.slotsCovered,
        );
        tagsAnyHit = isTagsAnyHit(outcome.phases, item.expect.tagsAny);
      }

      results.push({
        id: item.id,
        category: item.category,
        outcomeKind,
        expectKind: item.expect.kind,
        kindMatch,
        phaseCountOk,
        slotsCoveredOk,
        tagsAnyHit,
        latencyMs,
      });
      reportCases.push({
        id: item.id,
        category: item.category,
        freeText: item.freeText,
        locale: item.locale,
        durationDays: item.durationDays,
        slots: item.slots,
        outcomeKind,
        expectKind: item.expect.kind,
        kindMatch,
        phaseCount,
        phaseCountOk,
        slotsCoveredOk,
        tagsAnyHit,
        title: outcome.kind === 'program' ? outcome.title : undefined,
        summary: outcome.kind === 'program' ? outcome.summary : undefined,
        latencyMs,
      });

      const mark = kindMatch ? '✓' : '✗';
      console.log(
        `  [${item.id}] ${mark} ${outcomeKind} (${latencyMs}ms)` +
          (phaseCount !== undefined ? ` phases=${phaseCount}` : ''),
      );
    } catch (error) {
      const latencyMs = Date.now() - started;
      const message = describeError(error);
      results.push({
        id: item.id,
        category: item.category,
        outcomeKind: 'error',
        expectKind: item.expect.kind,
        kindMatch: false,
        latencyMs,
        error: message,
      });
      reportCases.push({
        id: item.id,
        category: item.category,
        freeText: item.freeText,
        locale: item.locale,
        durationDays: item.durationDays,
        slots: item.slots,
        outcomeKind: 'error',
        expectKind: item.expect.kind,
        kindMatch: false,
        latencyMs,
        error: message,
      });
      console.log(`  [${item.id}] ✗ ERROR: ${message} (${latencyMs}ms)`);
    }
  });

  const usageRows = await usageLogModel
    .find({
      flowId: {
        $regex: `^eval-${runId.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}-`,
      },
    })
    .select('estCostUsd')
    .lean()
    .exec();
  const pipelineCostUsd = usageRows.reduce(
    (sum, row) => sum + (row.estCostUsd ?? 0),
    0,
  );

  const summary = summarizeVird(results);
  const finishedAt = new Date().toISOString();

  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = finishedAt.replace(/[:.]/g, '-');
  const jsonPath = join(REPORTS_DIR, `vird-${stamp}.json`);
  writeFileSync(
    jsonPath,
    JSON.stringify(
      {
        meta: {
          runId,
          startedAt,
          finishedAt,
          gitSha: gitSha(),
          model: runtime.modelName('program'),
          datasetSize: fullDataset.length,
          casesRun: dataset.length,
          pipelineCostUsd,
        },
        summary,
        cases: reportCases,
      },
      null,
      2,
    ),
    'utf8',
  );

  console.log('\n=== ÖZET ===');
  console.log(
    `kindMatchRate=${(summary.kindMatchRate * 100).toFixed(0)}%  phaseCountOkRate=${(summary.phaseCountOkRate * 100).toFixed(0)}%  slotsCoveredOkRate=${(summary.slotsCoveredOkRate * 100).toFixed(0)}%  tagsAnyHitRate=${(summary.tagsAnyHitRate * 100).toFixed(0)}%  errorRate=${(summary.errorRate * 100).toFixed(0)}%`,
  );
  console.log(
    `latency p50=${summary.latencyP50.toFixed(0)}ms p95=${summary.latencyP95.toFixed(0)}ms`,
  );
  console.log(`pipeline maliyeti: $${pipelineCostUsd.toFixed(4)}`);
  console.log(`\nJSON rapor: ${jsonPath}`);

  await app.close();
}

main().catch((error) => {
  console.error('[eval:vird] HATA:', describeError(error));
  process.exitCode = 1;
});
