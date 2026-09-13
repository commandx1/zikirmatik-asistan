import {
  percentile,
  rate,
  summarizeRehber,
  summarizeChat,
  summarizeVird,
  type RehberCaseResult,
  type ChatCaseResult,
  type VirdCaseResult,
} from './metrics';

describe('percentile', () => {
  it('boş dizi için 0 döner', () => {
    expect(percentile([], 50)).toBe(0);
  });

  it('tek elemanlı dizide p ne olursa olsun o elemanı döner', () => {
    expect(percentile([42], 0)).toBe(42);
    expect(percentile([42], 100)).toBe(42);
  });

  it('p=50 medyanı lineer interpolasyonla hesaplar', () => {
    expect(percentile([10, 20, 30, 40], 50)).toBeCloseTo(25, 5);
  });

  it('p=0 ve p=100 min/max döner', () => {
    const values = [5, 1, 9, 3];
    expect(percentile(values, 0)).toBe(1);
    expect(percentile(values, 100)).toBe(9);
  });

  it('sırasız girdi de doğru sonuç verir (mutasyon yapmadan sıralar)', () => {
    const values = [3, 1, 2];
    expect(percentile(values, 50)).toBe(2);
    expect(values).toEqual([3, 1, 2]); // orijinal dizi değişmemeli
  });
});

describe('rate', () => {
  it('normal oranı hesaplar', () => {
    expect(rate(1, 4)).toBe(0.25);
  });

  it('total=0 iken 0 döner (NaN değil)', () => {
    expect(rate(0, 0)).toBe(0);
  });

  it('total negatifse 0 döner', () => {
    expect(rate(5, -1)).toBe(0);
  });
});

function rehberCase(overrides: Partial<RehberCaseResult>): RehberCaseResult {
  return {
    id: 'r1',
    category: 'emotion',
    outcomeKind: 'recommendations',
    expectKind: 'recommendations',
    kindMatch: true,
    latencyMs: 100,
    ...overrides,
  };
}

describe('summarizeRehber', () => {
  it('boş vaka listesinde oranlar 0 olur', () => {
    const summary = summarizeRehber([]);
    expect(summary.total).toBe(0);
    expect(summary.kindMatchRate).toBe(0);
    expect(summary.tagsAnyHitRate).toBe(0);
    expect(summary.latencyP50).toBe(0);
    expect(summary.judgeOverallMean).toBeUndefined();
  });

  it('kindMatchRate ve byKind sayımını doğru hesaplar', () => {
    const cases = [
      rehberCase({ id: '1', outcomeKind: 'recommendations', kindMatch: true }),
      rehberCase({
        id: '2',
        outcomeKind: 'offTopic',
        expectKind: 'offTopic',
        kindMatch: true,
      }),
      rehberCase({
        id: '3',
        outcomeKind: 'error',
        expectKind: 'recommendations',
        kindMatch: false,
        error: 'AI_UNAVAILABLE',
      }),
    ];
    const summary = summarizeRehber(cases);
    expect(summary.total).toBe(3);
    expect(summary.byKind).toEqual({
      recommendations: 1,
      offTopic: 1,
      error: 1,
    });
    expect(summary.kindMatchRate).toBeCloseTo(2 / 3, 5);
    expect(summary.offTopicRate).toBeCloseTo(1 / 3, 5);
    expect(summary.errorRate).toBeCloseTo(1 / 3, 5);
  });

  it('yalnızca tagsAnyHit tanımlı vakaları oran hesabına katar', () => {
    const cases = [
      rehberCase({ id: '1', tagsAnyHit: true }),
      rehberCase({ id: '2', tagsAnyHit: false }),
      rehberCase({ id: '3' }), // tagsAny beklenmiyor — hesaba katılmaz
    ];
    expect(summarizeRehber(cases).tagsAnyHitRate).toBeCloseTo(0.5, 5);
  });

  it('judge verileri varsa ortalama ve verdict sayımını hesaplar', () => {
    const cases = [
      rehberCase({
        id: '1',
        judge: { overall: 5, verdict: 'pass' },
      }),
      rehberCase({
        id: '2',
        judge: { overall: 3, verdict: 'weak' },
      }),
    ];
    const summary = summarizeRehber(cases);
    expect(summary.judgeOverallMean).toBe(4);
    expect(summary.judgeVerdictCounts).toEqual({ pass: 1, weak: 1 });
  });
});

function chatCase(overrides: Partial<ChatCaseResult>): ChatCaseResult {
  return {
    id: 'c1',
    topic: 'oruc',
    mode: 'bilgi',
    expectMode: 'bilgi',
    modeMatch: true,
    latencyMs: 200,
    ...overrides,
  };
}

describe('summarizeChat', () => {
  it('boş vaka listesinde oranlar 0 olur', () => {
    const summary = summarizeChat([]);
    expect(summary.total).toBe(0);
    expect(summary.modeAccuracy).toBe(0);
    expect(summary.coverageAccuracy).toBe(0);
    expect(summary.passageScoreP50).toBe(0);
    expect(summary.groundednessMean).toBeUndefined();
  });

  it('modeAccuracy ve errorRate doğru hesaplanır', () => {
    const cases = [
      chatCase({
        id: '1',
        mode: 'bilgi',
        expectMode: 'bilgi',
        modeMatch: true,
      }),
      chatCase({
        id: '2',
        mode: 'chat',
        expectMode: 'bilgi',
        modeMatch: false,
      }),
      chatCase({
        id: '3',
        mode: 'error',
        expectMode: 'bilgi',
        modeMatch: false,
        error: 'boom',
      }),
    ];
    const summary = summarizeChat(cases);
    expect(summary.modeAccuracy).toBeCloseTo(1 / 3, 5);
    expect(summary.errorRate).toBeCloseTo(1 / 3, 5);
  });

  it('coverageAccuracy yalnızca coverageMatch tanımlı vakalarda hesaplanır', () => {
    const cases = [
      chatCase({
        id: '1',
        coverage: 'full',
        expectCoverage: 'full',
        coverageMatch: true,
      }),
      chatCase({
        id: '2',
        coverage: 'none',
        expectCoverage: 'full',
        coverageMatch: false,
      }),
      chatCase({ id: '3', mode: 'chat', expectMode: 'chat' }), // coverage beklenmiyor
    ];
    const summary = summarizeChat(cases);
    expect(summary.coverageAccuracy).toBeCloseTo(0.5, 5);
    expect(summary.coverageCounts).toEqual({ full: 1, none: 1 });
  });

  it('passage skorlarının persentillerini tüm vakalar üzerinden birleştirir', () => {
    const cases = [
      chatCase({ id: '1', passageScores: [0.5, 0.9] }),
      chatCase({ id: '2', passageScores: [0.7] }),
    ];
    const summary = summarizeChat(cases);
    expect(summary.passageScoreP50).toBeCloseTo(0.7, 5);
  });

  it('judge verileri varsa groundedness ortalaması ve citation sayımı hesaplanır', () => {
    const cases = [
      chatCase({
        id: '1',
        judge: {
          groundedness: 4,
          citationCorrectness: 'correct',
          verdict: 'pass',
        },
      }),
      chatCase({
        id: '2',
        judge: {
          groundedness: 2,
          citationCorrectness: 'missing',
          verdict: 'weak',
        },
      }),
    ];
    const summary = summarizeChat(cases);
    expect(summary.groundednessMean).toBe(3);
    expect(summary.citationCorrectnessCounts).toEqual({
      correct: 1,
      missing: 1,
    });
  });
});

function virdCase(overrides: Partial<VirdCaseResult>): VirdCaseResult {
  return {
    id: 'v1',
    category: 'exam',
    outcomeKind: 'program',
    expectKind: 'program',
    kindMatch: true,
    latencyMs: 150,
    ...overrides,
  };
}

describe('summarizeVird', () => {
  it('boş vaka listesinde oranlar 0 olur', () => {
    const summary = summarizeVird([]);
    expect(summary.total).toBe(0);
    expect(summary.kindMatchRate).toBe(0);
    expect(summary.phaseCountOkRate).toBe(0);
    expect(summary.slotsCoveredOkRate).toBe(0);
    expect(summary.tagsAnyHitRate).toBe(0);
    expect(summary.latencyP50).toBe(0);
  });

  it('kindMatchRate ve byKind sayımını doğru hesaplar', () => {
    const cases = [
      virdCase({ id: '1', outcomeKind: 'program', kindMatch: true }),
      virdCase({
        id: '2',
        outcomeKind: 'offTopic',
        expectKind: 'offTopic',
        kindMatch: true,
      }),
      virdCase({
        id: '3',
        outcomeKind: 'error',
        expectKind: 'program',
        kindMatch: false,
        error: 'AI_UNAVAILABLE',
      }),
    ];
    const summary = summarizeVird(cases);
    expect(summary.total).toBe(3);
    expect(summary.byKind).toEqual({ program: 1, offTopic: 1, error: 1 });
    expect(summary.kindMatchRate).toBeCloseTo(2 / 3, 5);
    expect(summary.offTopicRate).toBeCloseTo(1 / 3, 5);
    expect(summary.errorRate).toBeCloseTo(1 / 3, 5);
  });

  it('phaseCountOkRate yalnızca phaseCountOk tanımlı vakaları hesaba katar', () => {
    const cases = [
      virdCase({ id: '1', phaseCountOk: true }),
      virdCase({ id: '2', phaseCountOk: false }),
      virdCase({ id: '3' }), // faz aralığı beklenmiyor — hesaba katılmaz
    ];
    expect(summarizeVird(cases).phaseCountOkRate).toBeCloseTo(0.5, 5);
  });

  it('slotsCoveredOkRate yalnızca slotsCoveredOk tanımlı vakaları hesaba katar', () => {
    const cases = [
      virdCase({ id: '1', slotsCoveredOk: true }),
      virdCase({ id: '2', slotsCoveredOk: true }),
      virdCase({ id: '3', slotsCoveredOk: false }),
    ];
    expect(summarizeVird(cases).slotsCoveredOkRate).toBeCloseTo(2 / 3, 5);
  });

  it('tagsAnyHitRate yalnızca tagsAnyHit tanımlı vakaları hesaba katar', () => {
    const cases = [
      virdCase({ id: '1', tagsAnyHit: true }),
      virdCase({ id: '2', tagsAnyHit: false }),
      virdCase({ id: '3' }),
    ];
    expect(summarizeVird(cases).tagsAnyHitRate).toBeCloseTo(0.5, 5);
  });
});
