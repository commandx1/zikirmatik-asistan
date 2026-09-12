/**
 * AI Sohbet eval runner — GERÇEK `AiChatService.evaluateReply()`'i (bkz.
 * ai-chat.service.ts, yalnızca eval için eklenmiş PUBLIC metod) Nest DI
 * konteynerinden alıp golden dataset (`datasets/chat-questions.json`)
 * üzerinde çalıştırır, isteğe bağlı olarak bir LLM hakem ile skorlar ve
 * `reports/chat-<ISO>.json` + `.md` üretir.
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
 *   pnpm --filter api eval:chat -- --dry-run
 *   pnpm --filter api eval:chat -- --limit 5 --no-judge
 *   AI_EVAL_USER_ID=<objectId> pnpm --filter api eval:chat
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from './lib/args';
import {
  describeError,
  escapeRegExp,
  gitSha,
  newRunId,
  validateEvalUserId,
} from './lib/util';
import { runPool } from './lib/pool';
import { bootstrapEvalContext } from './lib/bootstrap';
import { judgeChat } from './lib/judge';
import {
  writeReport,
  type ChatReportCase,
  type ReportMeta,
} from './lib/report';
import {
  summarizeChat,
  type ChatCaseResult,
} from '../../src/modules/ai/eval/metrics';
import { renderPassageRef } from '../../src/modules/ai-chat/prompts';
import { AiRuntimeService } from '../../src/modules/ai/ai-runtime.service';
import { estimateCostUsd } from '../../src/modules/ai/ai-pricing.constants';

type ChatHistoryEntry = { role: 'user' | 'assistant'; content: string };

type DatasetItem = {
  id: string;
  message: string;
  locale: 'tr' | 'en';
  expectMode: 'chat' | 'bilgi';
  expectCoverage?: 'full' | 'partial' | 'none';
  topic: string;
  history?: ChatHistoryEntry[];
};

function loadDataset(): DatasetItem[] {
  const raw = readFileSync(
    join(__dirname, 'datasets', 'chat-questions.json'),
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
  const byTopic: Record<string, number> = {};
  const byLocale: Record<string, number> = {};
  const byExpectMode: Record<string, number> = {};
  const byExpectCoverage: Record<string, number> = {};
  let withHistory = 0;

  for (const item of selected) {
    byTopic[item.topic] = (byTopic[item.topic] ?? 0) + 1;
    byLocale[item.locale] = (byLocale[item.locale] ?? 0) + 1;
    byExpectMode[item.expectMode] = (byExpectMode[item.expectMode] ?? 0) + 1;
    if (item.expectCoverage) {
      byExpectCoverage[item.expectCoverage] =
        (byExpectCoverage[item.expectCoverage] ?? 0) + 1;
    }
    if (item.history && item.history.length > 0) withHistory++;
  }

  console.log('=== AI Sohbet Eval — DRY RUN ===');
  console.log(`Toplam dataset: ${fullDataset.length} vaka`);
  console.log(`Çalıştırılacak (filtreli): ${selected.length} vaka`);
  console.log('Konuya göre:', byTopic);
  console.log("Locale'e göre:", byLocale);
  console.log("Beklenen mode'a göre:", byExpectMode);
  console.log("Beklenen coverage'a göre:", byExpectCoverage);
  console.log(`Geçmişli (follow-up) vaka sayısı: ${withHistory}`);
  console.log('\nÖrnek vakalar:');
  for (const item of selected.slice(0, 5)) {
    console.log(
      `  [${item.id}] (${item.topic}/${item.locale}) "${item.message.slice(0, 60)}" → expectMode=${item.expectMode}${item.expectCoverage ? ` expectCoverage=${item.expectCoverage}` : ''}`,
    );
  }
  console.log(
    "\nGerçek çalıştırma için AI_EVAL_USER_ID ortam değişkenini set edip --dry-run'ı kaldırın (bkz. README.md).",
  );
}

function renderPassageLine(
  passage: {
    sourceTitle: string;
    sectionHeading?: string;
    pageStart: number;
    pageEnd: number;
    text: string;
    score?: number;
  },
  index: number,
): string {
  const pages =
    passage.pageEnd !== passage.pageStart
      ? `s. ${passage.pageStart}-${passage.pageEnd}`
      : `s. ${passage.pageStart}`;
  const heading = passage.sectionHeading ? ` — ${passage.sectionHeading}` : '';
  const score =
    passage.score !== undefined ? ` (score=${passage.score.toFixed(3)})` : '';
  return `#${renderPassageRef(index)} [${passage.sourceTitle}${heading}, ${pages}]${score}\n${passage.text}`;
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
  console.log(`\n=== AI Sohbet Eval çalıştırılıyor (runId=${runId}) ===`);
  console.log(
    `${dataset.length} vaka, concurrency=${args.concurrency}, judge=${judgeEnabled ? judgeModel : 'kapalı'}\n`,
  );

  const { app, chat, usageLogModel } = await bootstrapEvalContext();
  const runtime = app.get(AiRuntimeService);

  const results: ChatCaseResult[] = [];
  const reportCases: ChatReportCase[] = [];
  const judgeUsages: Array<{ inputTokens?: number; outputTokens?: number }> =
    [];

  await runPool(dataset, args.concurrency, async (item) => {
    const flowId = `eval-${runId}-${item.id}`;
    const started = Date.now();
    const history: ChatHistoryEntry[] = [
      ...(item.history ?? []),
      { role: 'user', content: item.message },
    ];

    try {
      const reply = await chat.evaluateReply({
        history,
        locale: item.locale,
        flowId,
        userId,
      });
      const latencyMs = Date.now() - started;

      const modeMatch = reply.mode === item.expectMode;
      const coverageMatch =
        item.expectCoverage !== undefined
          ? reply.coverage === item.expectCoverage
          : undefined;
      const passageScores = reply.retrievedPassages
        .map((p) => p.score)
        .filter((score): score is number => typeof score === 'number');

      let judge: ChatReportCase['judge'];
      if (judgeEnabled && reply.mode === 'bilgi') {
        try {
          const passageLines = reply.retrievedPassages.map((p, idx) =>
            renderPassageLine(p, idx),
          );
          const judged = await judgeChat({
            question: item.message,
            passageLines,
            coverage: reply.coverage ?? 'none',
            usedPassages: reply.usedPassages,
            answer: reply.answer,
          });
          judgeUsages.push(judged.usage);
          judge = {
            groundedness: judged.output.groundedness,
            faithfulness: judged.output.faithfulness,
            citationCorrectness: judged.output.citationCorrectness,
            coverageLabelCorrect: judged.output.coverageLabelCorrect,
            unsupportedClaims: judged.output.unsupportedClaims,
            verdict: judged.output.verdict,
          };
        } catch (judgeError) {
          console.warn(
            `  [${item.id}] judge başarısız: ${describeError(judgeError)}`,
          );
        }
      }

      results.push({
        id: item.id,
        topic: item.topic,
        mode: reply.mode,
        expectMode: item.expectMode,
        modeMatch,
        coverage: reply.coverage,
        expectCoverage: item.expectCoverage,
        coverageMatch,
        passageScores,
        latencyMs,
        judge: judge && {
          groundedness: judge.groundedness,
          citationCorrectness: judge.citationCorrectness as
            | 'correct'
            | 'missing'
            | 'extra'
            | 'wrong',
          verdict: judge.verdict as 'pass' | 'weak' | 'fail',
        },
      });
      reportCases.push({
        id: item.id,
        topic: item.topic,
        message: item.message,
        locale: item.locale,
        mode: reply.mode,
        expectMode: item.expectMode,
        modeMatch,
        coverage: reply.coverage,
        expectCoverage: item.expectCoverage,
        coverageMatch,
        answer: reply.answer,
        sourceCitations: reply.sourceCitations,
        usedPassages: reply.usedPassages,
        searchQuery: reply.searchQuery,
        retrievedPassageHeadings: reply.retrievedPassages.map(
          (p) => `${p.sourceId} s.${p.pageStart} [${p.sectionHeading ?? '-'}]`,
        ),
        retrievedPassageScores: passageScores,
        latencyMs,
        judge,
      });

      const mark = modeMatch ? '✓' : '✗';
      console.log(
        `  [${item.id}] ${mark} mode=${reply.mode} coverage=${reply.coverage ?? '-'} (${latencyMs}ms)${judge ? ` judge=${judge.verdict}` : ''}`,
      );
    } catch (error) {
      const latencyMs = Date.now() - started;
      const message = describeError(error);
      results.push({
        id: item.id,
        topic: item.topic,
        mode: 'error',
        expectMode: item.expectMode,
        modeMatch: false,
        latencyMs,
        error: message,
      });
      reportCases.push({
        id: item.id,
        topic: item.topic,
        message: item.message,
        locale: item.locale,
        mode: 'error',
        expectMode: item.expectMode,
        modeMatch: false,
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

  const summary = summarizeChat(results);
  const finishedAt = new Date().toISOString();

  const meta: ReportMeta = {
    runId,
    startedAt,
    finishedAt,
    gitSha: gitSha(),
    locale: args.locale ?? 'tr+en',
    models: {
      classify: runtime.modelName('classify'),
      chat: runtime.modelName('chat'),
    },
    passageMinScore: Number(process.env.AI_PASSAGE_MIN_SCORE ?? 0.68),
    datasetSize: fullDataset.length,
    casesRun: dataset.length,
    pipelineCostUsd,
    judgeCostUsd,
    judgeModel: judgeEnabled ? judgeModel : undefined,
    judgeEnabled,
  };

  const { jsonPath, mdPath } = writeReport('chat', {
    meta,
    summary,
    cases: reportCases,
  });

  console.log('\n=== ÖZET ===');
  console.log(
    `modeAccuracy=${(summary.modeAccuracy * 100).toFixed(0)}%  coverageAccuracy=${(summary.coverageAccuracy * 100).toFixed(0)}%  errorRate=${(summary.errorRate * 100).toFixed(0)}%`,
  );
  console.log(
    `latency p50=${summary.latencyP50.toFixed(0)}ms p95=${summary.latencyP95.toFixed(0)}ms`,
  );
  console.log(
    `passage score p10/p50/p90 = ${summary.passageScoreP10.toFixed(3)}/${summary.passageScoreP50.toFixed(3)}/${summary.passageScoreP90.toFixed(3)}`,
  );
  console.log(
    `pipeline maliyeti: $${pipelineCostUsd.toFixed(4)}  judge maliyeti: $${judgeCostUsd.toFixed(4)}  toplam: $${(pipelineCostUsd + judgeCostUsd).toFixed(4)}`,
  );
  console.log(`\nJSON rapor: ${jsonPath}`);
  console.log(`Markdown rapor: ${mdPath}`);

  await app.close();
}

main().catch((error) => {
  console.error('[eval:chat] HATA:', describeError(error));
  process.exitCode = 1;
});
