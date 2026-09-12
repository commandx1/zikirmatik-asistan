/**
 * `run-retrieval-eval.ts` için SAF metrik hesaplama katmanı. Diğer eval'lerin
 * metrik katmanı (`src/modules/ai/eval/metrics.ts`) jest `rootDir`'e
 * girebilmek için `src/` altında tutulur; bu dosya ise `percentile`/`rate`
 * DIŞINDA bir unit-test gerektirmeyen, tamamen retrieval'e özgü hesaplamalar
 * içerdiği ve görev tanımı `scripts/eval/` dışına yalnızca `key`/`nameArabic`
 * projeksiyonu ve eval wrapper'ı eklenmesine izin verdiği için bilinçli
 * olarak burada (scripts/eval/lib altında) tutuldu.
 */
import { percentile, rate } from '../../../src/modules/ai/eval/metrics';

export type RetrievalCaseResult = {
  id: string;
  /** `expectedKeys` boş/eksikse true — key-metrikleri (rank/hit5/recall15) hesaba katılmaz. */
  skipped: boolean;
  firstRank: number | null;
  hit5: boolean;
  recall15: number;
  dupCount: number;
  latencyMs: number;
  error?: string;
};

export type RetrievalSummary = {
  total: number;
  evaluated: number;
  skipped: number;
  errorCount: number;
  errorRate: number;
  meanRecall15: number;
  hit5Rate: number;
  mrr: number;
  meanDupCount: number;
  latencyP50: number;
  latencyP95: number;
};

function mean(values: number[]): number {
  if (values.length === 0) return 0;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

export function summarizeRetrieval(
  results: RetrievalCaseResult[],
): RetrievalSummary {
  const total = results.length;
  const errored = results.filter((r) => Boolean(r.error));
  const nonErrored = results.filter((r) => !r.error);
  const evaluable = nonErrored.filter((r) => !r.skipped);
  const skippedCount = nonErrored.filter((r) => r.skipped).length;

  const reciprocalRanks = evaluable.map((r) =>
    r.firstRank ? 1 / r.firstRank : 0,
  );

  return {
    total,
    evaluated: evaluable.length,
    skipped: skippedCount,
    errorCount: errored.length,
    errorRate: rate(errored.length, total),
    meanRecall15: mean(evaluable.map((r) => r.recall15)),
    hit5Rate: rate(
      evaluable.filter((r) => r.hit5).length,
      evaluable.length,
    ),
    mrr: mean(reciprocalRanks),
    meanDupCount: mean(nonErrored.map((r) => r.dupCount)),
    latencyP50: percentile(
      nonErrored.map((r) => r.latencyMs),
      50,
    ),
    latencyP95: percentile(
      nonErrored.map((r) => r.latencyMs),
      95,
    ),
  };
}
