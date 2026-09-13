/**
 * AI Rehber / AI Sohbet eval harness'i için SAF metrik hesaplama katmanı.
 * Nest, Mongoose veya `ai` SDK'sına bağımlılığı YOKTUR — `apps/api/scripts/eval/**`
 * altındaki runner script'leri (ts-node ile çalışır, jest kapsamı DIŞINDA) bu
 * dosyayı import eder. Jest'in `rootDir` ayarı `src/` olduğu için unit testler
 * de bilinçli olarak buraya (scripts/ yerine) konuldu — böylece `pnpm test`
 * bu modülü de kapsar.
 */

// ── Genel istatistik yardımcıları ───────────────────────────────────────────

/**
 * `values` içindeki `p` (0-100) persentilini "nearest-rank" değil, lineer
 * interpolasyonla hesaplar (Excel/NumPy'nin `linear` yöntemi). Boş dizi için
 * 0 döner — çağıran taraf (rapor) bunu "veri yok" olarak yorumlamalı.
 */
export function percentile(values: number[], p: number): number {
  if (values.length === 0) return 0;
  if (values.length === 1) return values[0];

  const sorted = [...values].sort((a, b) => a - b);
  const clampedP = Math.min(100, Math.max(0, p));
  const rank = (clampedP / 100) * (sorted.length - 1);
  const lowerIndex = Math.floor(rank);
  const upperIndex = Math.ceil(rank);

  if (lowerIndex === upperIndex) return sorted[lowerIndex];

  const weight = rank - lowerIndex;
  return sorted[lowerIndex] * (1 - weight) + sorted[upperIndex] * weight;
}

/** `count/total` oranı — `total === 0` iken 0 döner (NaN yerine). */
export function rate(count: number, total: number): number {
  if (total <= 0) return 0;
  return count / total;
}

function mean(values: number[]): number | undefined {
  if (values.length === 0) return undefined;
  return values.reduce((sum, v) => sum + v, 0) / values.length;
}

function countBy<T extends string>(values: T[]): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const value of values) {
    counts[value] = (counts[value] ?? 0) + 1;
  }
  return counts;
}

// ── AI Rehber (öneri) vakaları ──────────────────────────────────────────────

export type RehberOutcomeKind =
  | 'recommendations'
  | 'offTopic'
  | 'clarification'
  | 'error';

export type RehberExpectKind =
  | 'recommendations'
  | 'offTopic'
  | 'clarification'
  | 'any';

export type RehberJudgeVerdict = 'pass' | 'weak' | 'fail';

export type RehberCaseResult = {
  id: string;
  category: string;
  outcomeKind: RehberOutcomeKind;
  expectKind: RehberExpectKind;
  kindMatch: boolean;
  /** `expect.tagsAny` verilmişse ve outcome 'recommendations' ise dolu. */
  tagsAnyHit?: boolean;
  latencyMs: number;
  error?: string;
  judge?: { overall: number; verdict: RehberJudgeVerdict };
};

export type RehberSummary = {
  total: number;
  byKind: Record<string, number>;
  kindMatchRate: number;
  tagsAnyHitRate: number;
  clarificationRate: number;
  offTopicRate: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  judgeOverallMean?: number;
  judgeVerdictCounts?: Record<string, number>;
};

export function summarizeRehber(cases: RehberCaseResult[]): RehberSummary {
  const total = cases.length;
  const byKind = countBy(cases.map((c) => c.outcomeKind));
  const latencies = cases.map((c) => c.latencyMs);

  const tagsAnyCases = cases.filter((c) => c.tagsAnyHit !== undefined);
  const judged = cases.filter((c) => c.judge !== undefined);

  const summary: RehberSummary = {
    total,
    byKind,
    kindMatchRate: rate(cases.filter((c) => c.kindMatch).length, total),
    tagsAnyHitRate: rate(
      tagsAnyCases.filter((c) => c.tagsAnyHit).length,
      tagsAnyCases.length,
    ),
    clarificationRate: rate(byKind.clarification ?? 0, total),
    offTopicRate: rate(byKind.offTopic ?? 0, total),
    errorRate: rate(byKind.error ?? 0, total),
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
  };

  if (judged.length > 0) {
    summary.judgeOverallMean = mean(judged.map((c) => c.judge!.overall));
    summary.judgeVerdictCounts = countBy(judged.map((c) => c.judge!.verdict));
  }

  return summary;
}

// ── AI Sohbet vakaları ───────────────────────────────────────────────────────

export type ChatMode = 'chat' | 'bilgi' | 'error';
export type ChatCoverage = 'full' | 'partial' | 'none';
export type ChatCitationCorrectness = 'correct' | 'missing' | 'extra' | 'wrong';
export type ChatJudgeVerdict = 'pass' | 'weak' | 'fail';

export type ChatCaseResult = {
  id: string;
  topic: string;
  mode: ChatMode;
  expectMode: 'chat' | 'bilgi';
  modeMatch: boolean;
  coverage?: ChatCoverage;
  expectCoverage?: ChatCoverage;
  coverageMatch?: boolean;
  /** Bu vakada retrieval'in döndürdüğü ham pasaj skorları (kalibrasyon için). */
  passageScores?: number[];
  latencyMs: number;
  error?: string;
  judge?: {
    groundedness: number;
    citationCorrectness?: ChatCitationCorrectness;
    verdict: ChatJudgeVerdict;
  };
};

export type ChatSummary = {
  total: number;
  modeAccuracy: number;
  coverageAccuracy: number;
  coverageCounts: Record<string, number>;
  citationCorrectnessCounts?: Record<string, number>;
  groundednessMean?: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
  passageScoreP10: number;
  passageScoreP50: number;
  passageScoreP90: number;
};

export function summarizeChat(cases: ChatCaseResult[]): ChatSummary {
  const total = cases.length;
  const latencies = cases.map((c) => c.latencyMs);
  const coverageCounts = countBy(
    cases.filter((c) => c.coverage !== undefined).map((c) => c.coverage!),
  );

  const coverageJudged = cases.filter((c) => c.coverageMatch !== undefined);
  const judged = cases.filter((c) => c.judge !== undefined);
  const citationJudged = judged.filter(
    (c) => c.judge!.citationCorrectness !== undefined,
  );

  const allPassageScores = cases.flatMap((c) => c.passageScores ?? []);
  const erroredCount = cases.filter((c) => c.mode === 'error').length;

  const summary: ChatSummary = {
    total,
    modeAccuracy: rate(cases.filter((c) => c.modeMatch).length, total),
    coverageAccuracy: rate(
      coverageJudged.filter((c) => c.coverageMatch).length,
      coverageJudged.length,
    ),
    coverageCounts,
    errorRate: rate(erroredCount, total),
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
    passageScoreP10: percentile(allPassageScores, 10),
    passageScoreP50: percentile(allPassageScores, 50),
    passageScoreP90: percentile(allPassageScores, 90),
  };

  if (judged.length > 0) {
    summary.groundednessMean = mean(judged.map((c) => c.judge!.groundedness));
  }
  if (citationJudged.length > 0) {
    summary.citationCorrectnessCounts = countBy(
      citationJudged.map((c) => c.judge!.citationCorrectness!),
    );
  }

  return summary;
}

// ── AI Vird Programı vakaları ────────────────────────────────────────────────

export type VirdOutcomeKind = 'program' | 'offTopic' | 'error';
export type VirdExpectKind = 'program' | 'offTopic' | 'any';

export type VirdCaseResult = {
  id: string;
  category: string;
  outcomeKind: VirdOutcomeKind;
  expectKind: VirdExpectKind;
  kindMatch: boolean;
  /** outcome 'program' ve `expect.phasesBetween` verilmişse dolu — faz sayısı [min,max] aralığında mı. */
  phaseCountOk?: boolean;
  /** outcome 'program' ve `expect.slotsCovered` verilmişse dolu — istenen dilimlerin HEPSİ en az bir fazda kullanılmış mı. */
  slotsCoveredOk?: boolean;
  /** `expect.tagsAny` verilmişse ve outcome 'program' ise dolu. */
  tagsAnyHit?: boolean;
  latencyMs: number;
  error?: string;
};

export type VirdSummary = {
  total: number;
  byKind: Record<string, number>;
  kindMatchRate: number;
  phaseCountOkRate: number;
  slotsCoveredOkRate: number;
  tagsAnyHitRate: number;
  offTopicRate: number;
  errorRate: number;
  latencyP50: number;
  latencyP95: number;
};

/**
 * LLM-free yapısal özet — `run-vird-eval.ts`'in "kapsamayan faz/istenmeyen
 * dilim/aşırı hedef → modele geri" doğrulama kapılarını (bkz.
 * vird-program-agent.service.ts) DEĞİL, ajanın NİHAİ (doğrulanmış) çıktısının
 * beklenen şekle uyup uymadığını (kind, faz sayısı aralığı, dilim kapsamı,
 * etiket isabetleri) ölçer. Judge (LLM-as-judge) katmanı bu iterasyonda
 * eklenmedi — bkz. docs/vird-programi.md "Eval" notu.
 */
export function summarizeVird(cases: VirdCaseResult[]): VirdSummary {
  const total = cases.length;
  const byKind = countBy(cases.map((c) => c.outcomeKind));
  const latencies = cases.map((c) => c.latencyMs);

  const phaseCountCases = cases.filter((c) => c.phaseCountOk !== undefined);
  const slotsCoveredCases = cases.filter((c) => c.slotsCoveredOk !== undefined);
  const tagsAnyCases = cases.filter((c) => c.tagsAnyHit !== undefined);

  return {
    total,
    byKind,
    kindMatchRate: rate(cases.filter((c) => c.kindMatch).length, total),
    phaseCountOkRate: rate(
      phaseCountCases.filter((c) => c.phaseCountOk).length,
      phaseCountCases.length,
    ),
    slotsCoveredOkRate: rate(
      slotsCoveredCases.filter((c) => c.slotsCoveredOk).length,
      slotsCoveredCases.length,
    ),
    tagsAnyHitRate: rate(
      tagsAnyCases.filter((c) => c.tagsAnyHit).length,
      tagsAnyCases.length,
    ),
    offTopicRate: rate(byKind.offTopic ?? 0, total),
    errorRate: rate(byKind.error ?? 0, total),
    latencyP50: percentile(latencies, 50),
    latencyP95: percentile(latencies, 95),
  };
}
