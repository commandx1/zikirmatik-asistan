/**
 * AI Rehber eval runner — GERÇEK `RecommendationAgentService.run()`'ı Nest
 * DI konteynerinden alıp golden dataset (`datasets/rehber-intents.json`)
 * üzerinde çalıştırır, isteğe bağlı olarak bir LLM hakem ile skorlar ve
 * `reports/rehber-<ISO>.json` + `.md` üretir.
 *
 * `--dry-run` HİÇBİR Mongo/AI SDK çağrısı YAPMAZ: `bootstrapEvalContext()`
 * (Nest DI'ı gerçekten ayağa kaldırıp Mongo'ya bağlanan fonksiyon) yalnızca
 * `--dry-run` OLMAYAN dalda çağrılır. Modüllerin (bu dosyanın tepesindeki)
 * statik import edilmesi güvenlidir — `AppModule`/`ConfigModule.forRoot`/
 * `MongooseModule.forRootAsync` yalnızca DynamicModule TANIMI döner, gerçek
 * bağlantı/validasyon `NestFactory.createApplicationContext()` çağrılana
 * kadar (yani `bootstrapEvalContext()` içinde) gerçekleşmez.
 *
 * Kullanım (bkz. README.md):
 *   pnpm --filter api eval:rehber -- --dry-run
 *   pnpm --filter api eval:rehber -- --limit 5 --no-judge
 *   AI_EVAL_USER_ID=<objectId> pnpm --filter api eval:rehber
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from './lib/args';
import {
  describeError,
  deriveTimeOfDay,
  escapeRegExp,
  gitSha,
  newRunId,
  pickLocaleText,
  validateEvalUserId,
} from './lib/util';
import { runPool } from './lib/pool';
import { bootstrapEvalContext } from './lib/bootstrap';
import { judgeRehber } from './lib/judge';
import {
  writeReport,
  type RehberReportCase,
  type RehberReportItem,
  type ReportMeta,
} from './lib/report';
import {
  summarizeRehber,
  type RehberCaseResult,
} from '../../src/modules/ai/eval/metrics';
import { AiRuntimeService } from '../../src/modules/ai/ai-runtime.service';
import { estimateCostUsd } from '../../src/modules/ai/ai-pricing.constants';

type DatasetItem = {
  id: string;
  freeText: string;
  locale: 'tr' | 'en';
  category: string;
  expect: {
    kind: 'recommendations' | 'offTopic' | 'clarification' | 'any';
    tagsAny?: string[];
  };
};

function loadDataset(): DatasetItem[] {
  const raw = readFileSync(
    join(__dirname, 'datasets', 'rehber-intents.json'),
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
  const byLocale: Record<string, number> = {};
  const byExpectKind: Record<string, number> = {};
  for (const item of selected) {
    byCategory[item.category] = (byCategory[item.category] ?? 0) + 1;
    byLocale[item.locale] = (byLocale[item.locale] ?? 0) + 1;
    byExpectKind[item.expect.kind] = (byExpectKind[item.expect.kind] ?? 0) + 1;
  }

  console.log('=== AI Rehber Eval — DRY RUN ===');
  console.log(`Toplam dataset: ${fullDataset.length} vaka`);
  console.log(`Çalıştırılacak (filtreli): ${selected.length} vaka`);
  console.log('Kategoriye göre:', byCategory);
  console.log("Locale'e göre:", byLocale);
  console.log('Beklenen sonuç türüne göre:', byExpectKind);
  console.log('\nÖrnek vakalar:');
  for (const item of selected.slice(0, 5)) {
    console.log(
      `  [${item.id}] (${item.category}/${item.locale}) "${item.freeText.slice(0, 60)}" → expect=${item.expect.kind}`,
    );
  }
  console.log(
    "\nGerçek çalıştırma için AI_EVAL_USER_ID ortam değişkenini set edip --dry-run'ı kaldırın (bkz. README.md).",
  );
}

/** formatCandidateLine (ai/prompts.ts) ile aynı sıra/kısaltma mantığı — judge girdisi için. */
function renderSelectedItemLine(
  dhikr: {
    name: { tr: string; en: string };
    timeOfDay: string | string[];
    tags: string[];
    suitableFor: string[];
    virtue: { tr: string; en: string };
    meaning: { tr: string; en: string };
  },
  locale: 'tr' | 'en',
): string {
  const trimTo = (value: string, max: number) => {
    const trimmed = value?.trim() ?? '';
    return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
  };
  return [
    pickLocaleText(dhikr.name, locale),
    Array.isArray(dhikr.timeOfDay) ? dhikr.timeOfDay.join('/') : dhikr.timeOfDay,
    dhikr.tags.join(', '),
    dhikr.suitableFor.join(', '),
    trimTo(pickLocaleText(dhikr.virtue, locale), 300),
    trimTo(pickLocaleText(dhikr.meaning, locale), 200),
  ].join(' | ');
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
  const judgeEnabled = !args.noJudge;
  const judgeModel = process.env.AI_EVAL_JUDGE_MODEL?.trim() || 'gpt-5';

  const runId = newRunId();
  const startedAt = new Date().toISOString();
  console.log(`\n=== AI Rehber Eval çalıştırılıyor (runId=${runId}) ===`);
  console.log(
    `${dataset.length} vaka, concurrency=${args.concurrency}, judge=${judgeEnabled ? judgeModel : 'kapalı'}\n`,
  );

  const { app, agent, usageLogModel } = await bootstrapEvalContext();
  const runtime = app.get(AiRuntimeService);

  const results: RehberCaseResult[] = [];
  const reportCases: RehberReportCase[] = [];
  const judgeUsages: Array<{ inputTokens?: number; outputTokens?: number }> =
    [];

  await runPool(dataset, args.concurrency, async (item) => {
    const flowId = `eval-${runId}-${item.id}`;
    const started = Date.now();

    try {
      const outcome = await agent.run({
        freeText: item.freeText,
        timeOfDay: deriveTimeOfDay(),
        recentDhikrIds: [],
        maxRecommendations: 3,
        locale: item.locale,
        flowId,
        userId,
      });
      const latencyMs = Date.now() - started;

      const outcomeKind =
        outcome.kind === 'selected' ? 'recommendations' : outcome.kind;
      const kindMatch =
        item.expect.kind === 'any' || item.expect.kind === outcomeKind;

      let tagsAnyHit: boolean | undefined;
      let items: RehberReportItem[] = [];
      let summary: string | undefined;
      let clarificationQuestion: string | undefined;
      let judge: RehberReportCase['judge'];

      if (outcome.kind === 'selected') {
        summary = outcome.summary;
        items = outcome.items.map((entry) => ({
          name: pickLocaleText(entry.dhikr.name, item.locale),
          tags: entry.dhikr.tags,
          reason: entry.reason,
        }));

        if (item.expect.tagsAny) {
          const wanted = new Set(item.expect.tagsAny);
          tagsAnyHit = outcome.items.some((entry) =>
            entry.dhikr.tags.some((tag) => wanted.has(tag)),
          );
        }

        if (judgeEnabled) {
          try {
            const refItems = outcome.items.map((entry, idx) => ({
              ref: `S${idx + 1}`,
              line: renderSelectedItemLine(entry.dhikr, item.locale),
              reason: entry.reason,
            }));
            const judged = await judgeRehber({
              freeText: item.freeText,
              timeOfDay: deriveTimeOfDay(),
              summary: outcome.summary,
              items: refItems,
            });
            judgeUsages.push(judged.usage);
            judge = {
              overall: judged.output.overall,
              summaryTone: judged.output.summaryTone,
              verdict: judged.output.verdict,
              items: judged.output.items,
            };
          } catch (judgeError) {
            console.warn(
              `  [${item.id}] judge başarısız: ${describeError(judgeError)}`,
            );
          }
        }
      } else if (outcome.kind === 'clarification') {
        clarificationQuestion = outcome.question;
      }

      results.push({
        id: item.id,
        category: item.category,
        outcomeKind,
        expectKind: item.expect.kind,
        kindMatch,
        tagsAnyHit,
        latencyMs,
        judge: judge && {
          overall: judge.overall,
          verdict: judge.verdict as 'pass' | 'weak' | 'fail',
        },
      });
      reportCases.push({
        id: item.id,
        category: item.category,
        freeText: item.freeText,
        locale: item.locale,
        outcomeKind,
        expectKind: item.expect.kind,
        kindMatch,
        tagsAnyHit,
        summary,
        items,
        clarificationQuestion,
        latencyMs,
        judge,
      });

      const mark = kindMatch ? '✓' : '✗';
      console.log(
        `  [${item.id}] ${mark} ${outcomeKind} (${latencyMs}ms)${judge ? ` judge=${judge.verdict}` : ''}`,
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
        outcomeKind: 'error',
        expectKind: item.expect.kind,
        kindMatch: false,
        latencyMs,
        error: message,
      });
      console.log(`  [${item.id}] ✗ ERROR: ${message} (${latencyMs}ms)`);
    }
  });

  // ── Maliyet: ai_usage_log'dan flowId='eval-<runId>-*' satırlarını topla ──
  const usageRows = await usageLogModel
    .find({ flowId: { $regex: `^eval-${escapeRegExp(runId)}-` } })
    .select('flowId estCostUsd')
    .lean()
    .exec();
  const pipelineCostUsd = usageRows.reduce(
    (sum, row) => sum + (row.estCostUsd ?? 0),
    0,
  );

  const judgeCostUsd = judgeUsages.reduce((sum, usage) => {
    const input = usage.inputTokens ?? 0;
    const output = usage.outputTokens ?? 0;
    return sum + estimateCostUsd(judgeModel, input, output);
  }, 0);

  const summary = summarizeRehber(results);
  const finishedAt = new Date().toISOString();

  const meta: ReportMeta = {
    runId,
    startedAt,
    finishedAt,
    gitSha: gitSha(),
    locale: args.locale ?? 'tr+en',
    models: {
      expand: runtime.modelName('expand'),
      select: runtime.modelName('select'),
    },
    passageMinScore: Number(process.env.AI_PASSAGE_MIN_SCORE ?? 0.68),
    datasetSize: fullDataset.length,
    casesRun: dataset.length,
    pipelineCostUsd,
    judgeCostUsd,
    judgeModel: judgeEnabled ? judgeModel : undefined,
    judgeEnabled,
  };

  const { jsonPath, mdPath } = writeReport('rehber', {
    meta,
    summary,
    cases: reportCases,
  });

  console.log('\n=== ÖZET ===');
  console.log(
    `kindMatchRate=${(summary.kindMatchRate * 100).toFixed(0)}%  tagsAnyHitRate=${(summary.tagsAnyHitRate * 100).toFixed(0)}%  errorRate=${(summary.errorRate * 100).toFixed(0)}%`,
  );
  console.log(
    `latency p50=${summary.latencyP50.toFixed(0)}ms p95=${summary.latencyP95.toFixed(0)}ms`,
  );
  console.log(
    `pipeline maliyeti: $${pipelineCostUsd.toFixed(4)}  judge maliyeti: $${judgeCostUsd.toFixed(4)}  toplam: $${(pipelineCostUsd + judgeCostUsd).toFixed(4)}`,
  );
  console.log(`\nJSON rapor: ${jsonPath}`);
  console.log(`Markdown rapor: ${mdPath}`);

  await app.close();
}

main().catch((error) => {
  console.error('[eval:rehber] HATA:', describeError(error));
  process.exitCode = 1;
});
