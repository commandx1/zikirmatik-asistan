/**
 * Eval run çıktılarını `scripts/eval/reports/` altına JSON (ham veri) ve
 * Markdown (insan tarafından okunacak özet) olarak yazar. Bu dosya saf
 * dosya-sistemi + string biçimlendirmedir — Nest/Mongo/AI SDK bağımlılığı
 * yoktur, `run-*-eval.ts` tarafından çağrılır.
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import type {
  RehberSummary,
  ChatSummary,
} from '../../../src/modules/ai/eval/metrics';

const REPORTS_DIR = join(__dirname, '..', 'reports');

export type ReportMeta = {
  runId: string;
  startedAt: string;
  finishedAt: string;
  gitSha: string;
  locale: string;
  models: Record<string, string>;
  passageMinScore?: number;
  datasetSize: number;
  casesRun: number;
  pipelineCostUsd: number;
  judgeCostUsd: number;
  judgeModel?: string;
  judgeEnabled: boolean;
};

export type RehberReportItem = {
  ref?: string;
  name: string;
  tags: string[];
  reason: string;
};

export type RehberReportCase = {
  id: string;
  category: string;
  freeText: string;
  locale: string;
  outcomeKind: string;
  expectKind: string;
  kindMatch: boolean;
  tagsAnyHit?: boolean;
  summary?: string;
  items?: RehberReportItem[];
  clarificationQuestion?: string;
  latencyMs: number;
  error?: string;
  judge?: {
    overall: number;
    summaryTone: number;
    verdict: string;
    items: Array<{
      ref: string;
      relevance: number;
      reasonGroundedInVirtue: boolean;
      note: string;
    }>;
  };
};

export type ChatReportCase = {
  id: string;
  topic: string;
  message: string;
  locale: string;
  mode: string;
  expectMode: string;
  modeMatch: boolean;
  coverage?: string;
  expectCoverage?: string;
  coverageMatch?: boolean;
  answer?: string;
  sourceCitations?: Array<{
    sourceTitle: string;
    pageStart: number;
    pageEnd: number;
  }>;
  usedPassages?: string[];
  retrievedPassageScores?: number[];
  searchQuery?: string;
  retrievedPassageHeadings?: string[];
  latencyMs: number;
  error?: string;
  judge?: {
    groundedness: number;
    faithfulness: number;
    citationCorrectness: string;
    coverageLabelCorrect: boolean;
    unsupportedClaims: string[];
    verdict: string;
  };
};

export type RehberRun = {
  meta: ReportMeta;
  summary: RehberSummary;
  cases: RehberReportCase[];
};

export type ChatRun = {
  meta: ReportMeta;
  summary: ChatSummary;
  cases: ChatReportCase[];
};

function truncate(value: string | undefined, max: number): string {
  const trimmed = (value ?? '').replace(/\s+/g, ' ').trim();
  return trimmed.length > max ? `${trimmed.slice(0, max)}…` : trimmed;
}

function checkMark(value: boolean | undefined): string {
  if (value === undefined) return '—';
  return value ? '✓' : '✗';
}

function pct(value: number | undefined): string {
  if (value === undefined) return '—';
  return `${(value * 100).toFixed(0)}%`;
}

function fmtMs(value: number): string {
  return `${Math.round(value)}ms`;
}

function renderHeader(kind: 'rehber' | 'chat', meta: ReportMeta): string {
  const modelsLine = Object.entries(meta.models)
    .map(([k, v]) => `${k}=${v}`)
    .join(', ');
  const totalCost = meta.pipelineCostUsd + meta.judgeCostUsd;

  return [
    `# AI ${kind === 'rehber' ? 'Rehber' : 'Sohbet'} Eval Raporu`,
    '',
    `- Tarih: ${meta.finishedAt}`,
    `- Git SHA: \`${meta.gitSha}\``,
    `- runId: \`${meta.runId}\``,
    `- Locale: ${meta.locale}`,
    `- Modeller: ${modelsLine || '—'}`,
    meta.passageMinScore !== undefined
      ? `- AI_PASSAGE_MIN_SCORE: ${meta.passageMinScore}`
      : undefined,
    `- Dataset boyutu: ${meta.datasetSize} (çalıştırılan: ${meta.casesRun})`,
    `- Pipeline maliyeti: $${meta.pipelineCostUsd.toFixed(4)}`,
    meta.judgeEnabled
      ? `- Judge maliyeti (${meta.judgeModel}): $${meta.judgeCostUsd.toFixed(4)}`
      : '- Judge: devre dışı (--no-judge)',
    `- **Toplam maliyet: $${totalCost.toFixed(4)}**`,
    '',
  ]
    .filter((line): line is string => line !== undefined)
    .join('\n');
}

function renderRehberSummaryTable(summary: RehberSummary): string {
  const rows = [
    ['Toplam vaka', String(summary.total)],
    ['kind eşleşme oranı', pct(summary.kindMatchRate)],
    ['tagsAny isabet oranı', pct(summary.tagsAnyHitRate)],
    ['clarification oranı', pct(summary.clarificationRate)],
    ['offTopic oranı', pct(summary.offTopicRate)],
    ['hata oranı', pct(summary.errorRate)],
    ['gecikme p50', fmtMs(summary.latencyP50)],
    ['gecikme p95', fmtMs(summary.latencyP95)],
  ];
  if (summary.judgeOverallMean !== undefined) {
    rows.push(['judge overall (ort.)', summary.judgeOverallMean.toFixed(2)]);
  }
  if (summary.judgeVerdictCounts) {
    rows.push([
      'judge verdict dağılımı',
      Object.entries(summary.judgeVerdictCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
    ]);
  }
  rows.push([
    'outcome dağılımı',
    Object.entries(summary.byKind)
      .map(([k, v]) => `${k}=${v}`)
      .join(', '),
  ]);

  return [
    '## Özet',
    '',
    '| Metrik | Değer |',
    '| --- | --- |',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
  ].join('\n');
}

function renderChatSummaryTable(summary: ChatSummary): string {
  const rows = [
    ['Toplam vaka', String(summary.total)],
    ['mode doğruluğu', pct(summary.modeAccuracy)],
    ['coverage doğruluğu', pct(summary.coverageAccuracy)],
    [
      'coverage dağılımı',
      Object.entries(summary.coverageCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(', ') || '—',
    ],
    ['hata oranı', pct(summary.errorRate)],
    ['gecikme p50', fmtMs(summary.latencyP50)],
    ['gecikme p95', fmtMs(summary.latencyP95)],
  ];
  if (summary.groundednessMean !== undefined) {
    rows.push(['groundedness (ort.)', summary.groundednessMean.toFixed(2)]);
  }
  if (summary.citationCorrectnessCounts) {
    rows.push([
      'citation correctness dağılımı',
      Object.entries(summary.citationCorrectnessCounts)
        .map(([k, v]) => `${k}=${v}`)
        .join(', '),
    ]);
  }

  return [
    '## Özet',
    '',
    '| Metrik | Değer |',
    '| --- | --- |',
    ...rows.map(([k, v]) => `| ${k} | ${v} |`),
    '',
  ].join('\n');
}

function renderRehberCasesTable(cases: RehberReportCase[]): string {
  const header =
    '| id | input | outcome | expected | checks | judge | latency |';
  const sep = '| --- | --- | --- | --- | --- | --- | --- |';
  const rows = cases.map((c) => {
    const checks = [
      `kind ${checkMark(c.kindMatch)}`,
      c.tagsAnyHit !== undefined
        ? `tagsAny ${checkMark(c.tagsAnyHit)}`
        : undefined,
    ]
      .filter(Boolean)
      .join(', ');
    const judge = c.judge
      ? `${c.judge.verdict} (${c.judge.overall}/5)`
      : c.error
        ? '—'
        : '(atlandı)';
    return `| ${c.id} | ${truncate(c.freeText, 50)} | ${c.error ? `error: ${truncate(c.error, 30)}` : c.outcomeKind} | ${c.expectKind} | ${checks} | ${judge} | ${fmtMs(c.latencyMs)} |`;
  });

  return ['## Vakalar', '', header, sep, ...rows, ''].join('\n');
}

function renderChatCasesTable(cases: ChatReportCase[]): string {
  const header = '| id | input | mode | coverage | checks | judge | latency |';
  const sep = '| --- | --- | --- | --- | --- | --- | --- |';
  const rows = cases.map((c) => {
    const checks = [
      `mode ${checkMark(c.modeMatch)}`,
      c.coverageMatch !== undefined
        ? `coverage ${checkMark(c.coverageMatch)}`
        : undefined,
    ]
      .filter(Boolean)
      .join(', ');
    const judge = c.judge
      ? `${c.judge.verdict} (g=${c.judge.groundedness}/5)`
      : c.error
        ? '—'
        : '(atlandı)';
    const coverageCell = c.coverage
      ? `${c.coverage}${c.expectCoverage ? ` (beklenen: ${c.expectCoverage})` : ''}`
      : '—';
    return `| ${c.id} | ${truncate(c.message, 50)} | ${c.error ? `error: ${truncate(c.error, 30)}` : c.mode} | ${coverageCell} | ${checks} | ${judge} | ${fmtMs(c.latencyMs)} |`;
  });

  return ['## Vakalar', '', header, sep, ...rows, ''].join('\n');
}

function renderRehberFailures(cases: RehberReportCase[]): string {
  const failures = cases.filter(
    (c) =>
      Boolean(c.error) ||
      !c.kindMatch ||
      c.tagsAnyHit === false ||
      (c.judge && c.judge.verdict !== 'pass'),
  );
  if (failures.length === 0) {
    return ['## Başarısızlıklar', '', '(yok)', ''].join('\n');
  }

  const blocks = failures.map((c) => {
    const lines = [
      `### ${c.id} (${c.category})`,
      `- freeText: ${c.freeText}`,
      `- outcome: ${c.error ? `error (${c.error})` : c.outcomeKind} — beklenen: ${c.expectKind}`,
    ];
    if (c.summary) lines.push(`- summary: ${c.summary}`);
    if (c.clarificationQuestion) {
      lines.push(`- clarification sorusu: ${c.clarificationQuestion}`);
    }
    if (c.items && c.items.length > 0) {
      lines.push('- öneriler:');
      for (const item of c.items) {
        lines.push(
          `  - ${item.name} [${item.tags.join(', ')}] — ${item.reason}`,
        );
      }
    }
    if (c.judge) {
      lines.push(
        `- judge: verdict=${c.judge.verdict}, overall=${c.judge.overall}/5, summaryTone=${c.judge.summaryTone}/5`,
      );
      for (const item of c.judge.items) {
        lines.push(
          `  - ${item.ref}: relevance=${item.relevance}/5, grounded=${item.reasonGroundedInVirtue}, note="${item.note}"`,
        );
      }
    }
    return lines.join('\n');
  });

  return ['## Başarısızlıklar', '', ...blocks, ''].join('\n');
}

function renderChatFailures(cases: ChatReportCase[]): string {
  const failures = cases.filter(
    (c) =>
      Boolean(c.error) ||
      !c.modeMatch ||
      c.coverageMatch === false ||
      (c.judge && c.judge.verdict !== 'pass'),
  );
  if (failures.length === 0) {
    return ['## Başarısızlıklar', '', '(yok)', ''].join('\n');
  }

  const blocks = failures.map((c) => {
    const lines = [
      `### ${c.id} (${c.topic})`,
      `- mesaj: ${c.message}`,
      `- mode: ${c.error ? `error (${c.error})` : c.mode} — beklenen: ${c.expectMode}`,
    ];
    if (c.coverage) {
      lines.push(
        `- coverage: ${c.coverage}${c.expectCoverage ? ` — beklenen: ${c.expectCoverage}` : ''}`,
      );
    }
    if (c.answer) lines.push(`- cevap: ${c.answer}`);
    if (c.sourceCitations && c.sourceCitations.length > 0) {
      lines.push(
        `- kaynaklar: ${c.sourceCitations
          .map((s) => `${s.sourceTitle} s.${s.pageStart}-${s.pageEnd}`)
          .join('; ')}`,
      );
    }
    if (c.judge) {
      lines.push(
        `- judge: verdict=${c.judge.verdict}, groundedness=${c.judge.groundedness}/5, faithfulness=${c.judge.faithfulness}/5, citation=${c.judge.citationCorrectness}, coverageLabelCorrect=${c.judge.coverageLabelCorrect}`,
      );
      if (c.judge.unsupportedClaims.length > 0) {
        lines.push(
          `  - dayanaksız iddialar: ${c.judge.unsupportedClaims.join(' | ')}`,
        );
      }
    }
    return lines.join('\n');
  });

  return ['## Başarısızlıklar', '', ...blocks, ''].join('\n');
}

function renderChatCalibration(summary: ChatSummary): string {
  return [
    '## Kalibrasyon (AI_PASSAGE_MIN_SCORE için)',
    '',
    "Bu run'de retrieval'in döndürdüğü TÜM pasajların (eşik uygulanmadan önceki) vectorSearch skor dağılımı:",
    '',
    `- p10: ${summary.passageScoreP10.toFixed(3)}`,
    `- p50: ${summary.passageScoreP50.toFixed(3)}`,
    `- p90: ${summary.passageScoreP90.toFixed(3)}`,
    '',
    "Not: bu skorlar `AI_PASSAGE_MIN_SCORE` eşiğinden ÖNCEki `retrievedPassages`'tan alınır (bkz. AiChatService.evaluateReply). Eşik altı örnek çoksa (p10 eşiğe yakın/altındaysa) eşiği yükseltmek, üstteyse düşürmek kalite/kapsam dengesini ayarlamak için değerlendirilebilir.",
    '',
  ].join('\n');
}

function writeReportFiles(
  kind: 'rehber' | 'chat',
  meta: ReportMeta,
  json: unknown,
  markdown: string,
): { jsonPath: string; mdPath: string } {
  mkdirSync(REPORTS_DIR, { recursive: true });
  const stamp = meta.finishedAt.replace(/[:.]/g, '-');
  const base = `${kind}-${stamp}`;
  const jsonPath = join(REPORTS_DIR, `${base}.json`);
  const mdPath = join(REPORTS_DIR, `${base}.md`);

  writeFileSync(jsonPath, JSON.stringify(json, null, 2), 'utf8');
  writeFileSync(mdPath, markdown, 'utf8');

  return { jsonPath, mdPath };
}

export function writeRehberReport(run: RehberRun): {
  jsonPath: string;
  mdPath: string;
} {
  const markdown = [
    renderHeader('rehber', run.meta),
    renderRehberSummaryTable(run.summary),
    renderRehberCasesTable(run.cases),
    renderRehberFailures(run.cases),
  ].join('\n');

  return writeReportFiles('rehber', run.meta, run, markdown);
}

export function writeChatReport(run: ChatRun): {
  jsonPath: string;
  mdPath: string;
} {
  const markdown = [
    renderHeader('chat', run.meta),
    renderChatSummaryTable(run.summary),
    renderChatCasesTable(run.cases),
    renderChatFailures(run.cases),
    renderChatCalibration(run.summary),
  ].join('\n');

  return writeReportFiles('chat', run.meta, run, markdown);
}

export function writeReport(
  kind: 'rehber',
  run: RehberRun,
): { jsonPath: string; mdPath: string };
export function writeReport(
  kind: 'chat',
  run: ChatRun,
): { jsonPath: string; mdPath: string };
export function writeReport(
  kind: 'rehber' | 'chat',
  run: RehberRun | ChatRun,
): { jsonPath: string; mdPath: string } {
  return kind === 'rehber'
    ? writeRehberReport(run as RehberRun)
    : writeChatReport(run as ChatRun);
}
