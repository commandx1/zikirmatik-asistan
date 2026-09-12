/**
 * Retrieval eval runner — LLM-FREE (judge yok) bir değerlendirme: GERÇEK
 * `RetrievalService.searchDhikrsByText()` çağrısını, golden dataset'teki
 * (`datasets/rehber-intents.json`) `expectedKeys` altın verisiyle karşılaştırıp
 * rank/hit@5/recall@15/near-duplicate metrikleri üretir.
 *
 * Niyet genişletme (expandIntent) adımı da GERÇEK koddan çağrılır — ama
 * yalnızca dataset'te `case.expandedQuery` YOKSA (bkz. `RecommendationAgentService.
 * expandIntentForEval`, `expandIntent`'in eval için eklenmiş public wrapper'ı).
 * `--write-expanded` verilirse üretilen expandedQuery dataset JSON'ına geri
 * yazılır — böylece sonraki run'lar aynı sorguyu ücretsiz tekrar kullanabilir.
 *
 * `--dry-run` HİÇBİR Mongo/AI SDK çağrısı YAPMAZ (bkz. run-rehber-eval.ts'deki
 * aynı desen — bootstrapEvalContext yalnızca dry-run DIŞINDA çağrılır).
 *
 * Kullanım (bkz. README.md):
 *   pnpm --filter api eval:retrieval -- --dry-run
 *   pnpm --filter api eval:retrieval -- --limit 5
 *   pnpm --filter api eval:retrieval -- --write-expanded
 *   pnpm --filter api eval:retrieval -- --baseline scripts/eval/reports/retrieval-2026-09-10T12-00-00-000Z.json
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { parseArgs } from './lib/args';
import {
  describeError,
  deriveTimeOfDay,
  escapeRegExp,
  gitSha,
  newRunId,
  validateEvalUserId,
} from './lib/util';
import { runPool } from './lib/pool';
import { bootstrapEvalContext } from './lib/bootstrap';
import {
  writeReport,
  type RetrievalBaseline,
  type RetrievalDeltaRow,
  type RetrievalReportCandidate,
  type RetrievalReportCase,
  type RetrievalReportMeta,
  type RetrievalRun,
} from './lib/report';
import {
  summarizeRetrieval,
  type RetrievalCaseResult,
} from './lib/retrieval-metrics';
import { RetrievalService } from '../../src/modules/ai/retrieval.service';
import { AiRuntimeService } from '../../src/modules/ai/ai-runtime.service';
import type { SupportedAiLocale } from '../../src/modules/ai/utils/locale';

const DATASET_PATH = join(__dirname, 'datasets', 'rehber-intents.json');
// AI_EVAL_USER_ID gerçek bir kullanıcı olmalı (diğer eval'lerde olduğu
// gibi) — ama retrieval eval'ı yalnızca fire-and-forget usage log kaydı
// için userId kullanır (RetrievalService.searchDhikrsByText hiçbir yolda
// kullanıcıyı doğrulamaz), bu yüzden AI_EVAL_USER_ID set değilse sabit bir
// sahte ObjectId'ye düşülür — görev tanımının izin verdiği gibi.
const DUMMY_EVAL_USER_ID = '000000000000000000000001';

type DatasetItem = {
  id: string;
  freeText: string;
  locale: SupportedAiLocale;
  category: string;
  expect: { kind: string; tagsAny?: string[] };
  // Başka bir worker tarafından EŞ ZAMANLI olarak ekleniyor olabilir —
  // eksik/boş vakalar key-metrikleri için ATLANIR (yine de rapor edilir).
  expectedKeys?: string[];
  // Önceden hesaplanmış niyet genişletmesi — varsa LLM çağrısı YAPILMAZ.
  expandedQuery?: string;
  offTopic?: boolean;
};

// Harakat (U+064B–U+0652), üstün elif (U+0670) ve tatvil (U+0640) + tüm
// boşluklar silinerek near-duplicate Arapça metin normalizasyonu yapılır.
function normalizeArabic(value: string | undefined): string {
  if (!value) return '';
  return value
    .normalize('NFC')
    .replace(/[ً-ْٰـ]/g, '')
    .replace(/\s+/g, '')
    .trim();
}

function countDuplicates(candidates: Array<{ nameArabic?: string }>): number {
  const groups = new Map<string, number>();
  for (const c of candidates) {
    const norm = normalizeArabic(c.nameArabic);
    if (!norm) continue;
    groups.set(norm, (groups.get(norm) ?? 0) + 1);
  }
  let dupCount = 0;
  for (const size of groups.values()) {
    if (size > 1) dupCount += size;
  }
  return dupCount;
}

function loadDataset(): DatasetItem[] {
  const raw = readFileSync(DATASET_PATH, 'utf8');
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
  const withExpectedKeys = selected.filter(
    (item) => item.expectedKeys && item.expectedKeys.length > 0,
  ).length;
  const withExpandedQuery = selected.filter((item) =>
    Boolean(item.expandedQuery?.trim()),
  ).length;

  console.log('=== Retrieval Eval — DRY RUN ===');
  console.log(`Toplam dataset: ${fullDataset.length} vaka`);
  console.log(`Çalıştırılacak (filtreli): ${selected.length} vaka`);
  console.log(
    `expectedKeys dolu olan: ${withExpectedKeys}/${selected.length} (kalanlar key-metrikleri için atlanacak)`,
  );
  console.log(
    `expandedQuery önceden dolu olan (cache): ${withExpandedQuery}/${selected.length} (kalanlar için LLM çağrısı gerekir)`,
  );
  console.log('\nÖrnek vakalar:');
  for (const item of selected.slice(0, 5)) {
    console.log(
      `  [${item.id}] (${item.category}/${item.locale}) "${item.freeText.slice(0, 60)}" → expectedKeys=${item.expectedKeys?.join(',') || '(yok)'}`,
    );
  }
  console.log(
    "\nGerçek çalıştırma için --dry-run'ı kaldırın (bkz. README.md). " +
      'AI_EVAL_USER_ID set değilse sabit bir sahte ObjectId kullanılır.',
  );
}

function loadBaseline(path: string): {
  reportPath: string;
  cases: Array<{ id: string; firstRank: number | null }>;
  summary: RetrievalRun['summary'];
} {
  const raw = readFileSync(path, 'utf8');
  const parsed = JSON.parse(raw) as RetrievalRun;
  return {
    reportPath: path,
    cases: parsed.cases.map((c) => ({ id: c.id, firstRank: c.firstRank })),
    summary: parsed.summary,
  };
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

  const userIdRaw = process.env.AI_EVAL_USER_ID?.trim();
  const userId = userIdRaw
    ? validateEvalUserId(userIdRaw)
    : DUMMY_EVAL_USER_ID;

  const runId = newRunId();
  const startedAt = new Date().toISOString();
  console.log(`\n=== Retrieval Eval çalıştırılıyor (runId=${runId}) ===`);
  console.log(`${dataset.length} vaka, concurrency=${args.concurrency}\n`);

  const { app, agent, usageLogModel } = await bootstrapEvalContext();
  const retrieval = app.get(RetrievalService, { strict: false });
  const runtime = app.get(AiRuntimeService, { strict: false });

  const results: RetrievalCaseResult[] = [];
  const reportCases: RetrievalReportCase[] = [];
  // Yazılabilir expandedQuery'leri id → query eşlemesiyle topluyoruz;
  // --write-expanded sonunda dataset'i TEK seferde günceller.
  const writtenExpansions = new Map<
    string,
    { expandedQuery: string; offTopic?: boolean }
  >();
  let expansionsLlmCalls = 0;
  let expansionsCached = 0;

  await runPool(dataset, args.concurrency, async (item) => {
    const flowId = `eval-${runId}-${item.id}`;
    const started = Date.now();

    try {
      let expandedQuery: string;
      let expandedFromCache: boolean;
      const cached = item.expandedQuery?.trim();
      if (cached) {
        expandedQuery = cached;
        expandedFromCache = true;
        expansionsCached++;
      } else {
        const expansion = await agent.expandIntentForEval({
          freeText: item.freeText,
          timeOfDay: deriveTimeOfDay(),
          locale: item.locale,
          flowId,
          userId,
        });
        expandedQuery = expansion.expandedQuery;
        expandedFromCache = false;
        expansionsLlmCalls++;
        if (args.writeExpanded) {
          writtenExpansions.set(item.id, {
            expandedQuery: expansion.expandedQuery,
            ...(expansion.offTopic ? { offTopic: true } : {}),
          });
        }
      }

      const candidates = await retrieval.searchDhikrsByText({
        query: expandedQuery,
        limit: 15,
        excludeIds: [],
        locale: item.locale,
        flowId,
        userId,
      });
      const latencyMs = Date.now() - started;

      const expectedKeys = item.expectedKeys ?? [];
      const skipped = expectedKeys.length === 0;
      const expectedSet = new Set(expectedKeys);

      let firstRank: number | null = null;
      let hit5 = false;
      let recall15 = 0;
      if (!skipped) {
        const hitCount = candidates.filter(
          (c) => c.key && expectedSet.has(c.key),
        ).length;
        recall15 = hitCount / expectedKeys.length;
        const rankIndex = candidates.findIndex(
          (c) => c.key && expectedSet.has(c.key),
        );
        firstRank = rankIndex === -1 ? null : rankIndex + 1;
        hit5 = firstRank !== null && firstRank <= 5;
      }

      const dupCount = countDuplicates(candidates);
      const top15: RetrievalReportCandidate[] = candidates.map((c) => ({
        key: c.key,
        id: c.id,
        name: c.name,
        score: c.fusedScore ?? c.score,
        ...(expectedSet.has(c.key ?? '') ? { isExpected: true } : {}),
      }));

      results.push({
        id: item.id,
        skipped,
        firstRank,
        hit5,
        recall15,
        dupCount,
        latencyMs,
      });
      reportCases.push({
        id: item.id,
        freeText: item.freeText,
        locale: item.locale,
        category: item.category,
        expandedQuery,
        expandedFromCache,
        expectedKeys,
        skipped,
        firstRank,
        hit5,
        recall15,
        dupCount,
        latencyMs,
        top15,
      });

      const mark = skipped ? '·' : hit5 ? '✓' : firstRank ? '~' : '✗';
      console.log(
        `  [${item.id}] ${mark} rank=${firstRank ?? '—'} recall15=${recall15.toFixed(2)} dup=${dupCount} (${latencyMs}ms)`,
      );
    } catch (error) {
      const latencyMs = Date.now() - started;
      const message = describeError(error);
      results.push({
        id: item.id,
        skipped: true,
        firstRank: null,
        hit5: false,
        recall15: 0,
        dupCount: 0,
        latencyMs,
        error: message,
      });
      reportCases.push({
        id: item.id,
        freeText: item.freeText,
        locale: item.locale,
        category: item.category,
        expandedQuery: item.expandedQuery ?? '',
        expandedFromCache: Boolean(item.expandedQuery),
        expectedKeys: item.expectedKeys ?? [],
        skipped: true,
        firstRank: null,
        hit5: false,
        recall15: 0,
        dupCount: 0,
        latencyMs,
        top15: [],
        error: message,
      });
      console.log(`  [${item.id}] ✗ ERROR: ${message} (${latencyMs}ms)`);
    }
  });

  console.log(
    `\nNiyet genişletme: ${expansionsLlmCalls} LLM çağrısı, ${expansionsCached} cache'ten kullanıldı.`,
  );

  if (args.writeExpanded && writtenExpansions.size > 0) {
    // Başka bir worker aynı anda dataset'e expectedKeys eklemiş olabilir —
    // yazmadan HEMEN önce dosyayı TEKRAR okuyup yalnızca expandedQuery/
    // offTopic alanlarını güncelleyerek çakışma riskini azaltıyoruz.
    const freshDataset = loadDataset();
    for (const entry of freshDataset) {
      const written = writtenExpansions.get(entry.id);
      if (!written) continue;
      entry.expandedQuery = written.expandedQuery;
      if (written.offTopic) {
        entry.offTopic = true;
      }
    }
    writeFileSync(
      DATASET_PATH,
      `${JSON.stringify(freshDataset, null, 2)}\n`,
      'utf8',
    );
    console.log(
      `${writtenExpansions.size} vaka için expandedQuery dataset'e yazıldı (${DATASET_PATH}).`,
    );
  }

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

  const summary = summarizeRetrieval(results);
  const finishedAt = new Date().toISOString();

  let baseline: RetrievalBaseline | undefined;
  if (args.baseline) {
    try {
      const loaded = loadBaseline(args.baseline);
      const beforeById = new Map(
        loaded.cases.map((c) => [c.id, c.firstRank]),
      );
      const rankDeltas: RetrievalDeltaRow[] = [];
      for (const c of reportCases) {
        if (!beforeById.has(c.id)) continue;
        const before = beforeById.get(c.id) ?? null;
        if (before !== c.firstRank) {
          rankDeltas.push({ id: c.id, before, after: c.firstRank });
        }
      }
      baseline = {
        reportPath: args.baseline,
        summary: loaded.summary,
        rankDeltas,
      };
    } catch (error) {
      console.warn(
        `--baseline yüklenemedi (${args.baseline}): ${describeError(error)}`,
      );
    }
  }

  const meta: RetrievalReportMeta = {
    runId,
    startedAt,
    finishedAt,
    gitSha: gitSha(),
    locale: args.locale ?? 'tr+en',
    models: { expand: runtime.modelName('expand') },
    datasetSize: fullDataset.length,
    casesRun: dataset.length,
    expansionsLlmCalls,
    expansionsCached,
    pipelineCostUsd,
  };

  const { jsonPath, mdPath } = writeReport('retrieval', {
    meta,
    summary,
    cases: reportCases,
    baseline,
  });

  console.log('\n=== ÖZET ===');
  console.log(
    `evaluated=${summary.evaluated}/${summary.total}  skipped=${summary.skipped}  errorRate=${(summary.errorRate * 100).toFixed(0)}%`,
  );
  console.log(
    `meanRecall@15=${summary.meanRecall15.toFixed(3)}  hit@5=${(summary.hit5Rate * 100).toFixed(0)}%  MRR=${summary.mrr.toFixed(3)}  meanDupCount=${summary.meanDupCount.toFixed(2)}`,
  );
  console.log(
    `latency p50=${summary.latencyP50.toFixed(0)}ms p95=${summary.latencyP95.toFixed(0)}ms`,
  );
  console.log(`pipeline maliyeti: $${pipelineCostUsd.toFixed(4)}`);
  if (baseline) {
    console.log(
      `\nBaseline (${baseline.reportPath}): meanRecall@15 ${baseline.summary.meanRecall15.toFixed(3)} → ${summary.meanRecall15.toFixed(3)}, hit@5 ${(baseline.summary.hit5Rate * 100).toFixed(0)}% → ${(summary.hit5Rate * 100).toFixed(0)}%, ${baseline.rankDeltas.length} vakanın rank'ı değişti.`,
    );
  }
  console.log(`\nJSON rapor: ${jsonPath}`);
  console.log(`Markdown rapor: ${mdPath}`);

  await app.close();
}

main().catch((error) => {
  console.error('[eval:retrieval] HATA:', describeError(error));
  process.exitCode = 1;
});
