import { Types } from 'mongoose';
import { RetrievalService } from './retrieval.service';
import { AiRetrievalError } from './ai-errors';
import { canonicalKeyFromArabic } from '../dhikrs/utils/canonical-key';

type AggregateHandler = (
  pipeline: unknown[],
  callIndex: number,
) => Promise<unknown[]> | unknown[];

type AggregateMock = jest.Mock<{ exec: () => Promise<unknown[]> }, [unknown[]]>;

function hasStage(pipeline: unknown[], key: string): boolean {
  return pipeline.some(
    (stage) => typeof stage === 'object' && stage !== null && key in stage,
  );
}

/**
 * Zikir bacağı Atlas `$search` yerine standart Mongo `$text` kullanır —
 * `$text` yalnızca aggregate pipeline'ının İLK `$match` aşamasında
 * geçerlidir, bkz. runDhikrTextSearch.
 */
function hasTextMatch(pipeline: unknown[]): boolean {
  const first = pipeline[0];
  if (typeof first !== 'object' || first === null || !('$match' in first)) {
    return false;
  }
  const match = first.$match;
  return typeof match === 'object' && match !== null && '$text' in match;
}

function createHarness(options?: {
  embeddingVector?: number[] | null;
  configValues?: Record<string, string | number | undefined>;
}) {
  const embeddingVector =
    options && 'embeddingVector' in options
      ? options.embeddingVector
      : [0.1, 0.2, 0.3];

  const dhikrPipelines: unknown[][] = [];
  let dhikrHandler: AggregateHandler = () => [];
  const dhikrAggregate: AggregateMock = jest.fn((pipeline: unknown[]) => {
    dhikrPipelines.push(pipeline);
    const callIndex = dhikrPipelines.length - 1;
    return {
      exec: async () => dhikrHandler(pipeline, callIndex),
    };
  });

  const passagePipelines: unknown[][] = [];
  let passageHandler: AggregateHandler = () => [];
  const passageAggregate: AggregateMock = jest.fn((pipeline: unknown[]) => {
    passagePipelines.push(pipeline);
    const callIndex = passagePipelines.length - 1;
    return {
      exec: async () => passageHandler(pipeline, callIndex),
    };
  });

  const dhikrModel = {
    aggregate: dhikrAggregate,
  };
  const sourcePassageModel = {
    aggregate: passageAggregate,
  };
  const dhikrLogModel = {
    distinct: jest.fn(() => Promise.resolve([])),
  };

  const embeddingService = {
    embedWithUsage: jest.fn(() =>
      Promise.resolve({ vector: embeddingVector, usage: undefined }),
    ),
    model: 'text-embedding-3-large',
  };

  const usageService = {
    record: jest.fn(() => Promise.resolve()),
  };

  const configService = {
    get: jest.fn((key: string) => options?.configValues?.[key]),
  };

  const flowLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const aiRuntime = {
    flowLog: jest.fn(() => flowLogger),
  };

  const service = new RetrievalService(
    dhikrModel as never,
    sourcePassageModel as never,
    dhikrLogModel as never,
    embeddingService as never,
    usageService as never,
    configService as never,
    aiRuntime as never,
  );

  return {
    service,
    dhikrModel,
    sourcePassageModel,
    embeddingService,
    usageService,
    configService,
    flowLogger,
    // Basit tek-sonuç API'si (mevcut testler) — pipeline'dan bağımsız aynı
    // sonucu döner.
    setDhikrAggregateResult: (value: unknown[]) => {
      dhikrHandler = () => value;
    },
    setPassageAggregateResult: (value: unknown[]) => {
      passageHandler = () => value;
    },
    // Hibrit testler için pipeline bazlı davranış (örn. $search hata verir,
    // $vectorSearch sonuç döner).
    setDhikrAggregateHandler: (handler: AggregateHandler) => {
      dhikrHandler = handler;
    },
    setPassageAggregateHandler: (handler: AggregateHandler) => {
      passageHandler = handler;
    },
    getLastDhikrPipeline: () => dhikrPipelines[dhikrPipelines.length - 1] ?? [],
    getLastPassagePipeline: () =>
      passagePipelines[passagePipelines.length - 1] ?? [],
    getDhikrPipelines: () => dhikrPipelines,
    getPassagePipelines: () => passagePipelines,
  };
}

describe('RetrievalService', () => {
  describe('searchSourcePassages', () => {
    it('applies a $match _vectorScore $gte minScore stage when minScore > 0', async () => {
      const { service, setPassageAggregateResult, getLastPassagePipeline } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setPassageAggregateResult([
        {
          _id: new Types.ObjectId(),
          sourceId: 's1',
          text: 'metin',
          sourceTitle: 'Kitap',
          pageStart: 1,
          pageEnd: 2,
          type: 'ilmihal',
          _vectorScore: 0.8,
        },
      ]);

      await service.searchSourcePassages('sorgu', 4, { minScore: 0.5 });

      const pipeline = getLastPassagePipeline();
      const matchStage = pipeline.find(
        (stage): stage is { $match: { _vectorScore: { $gte: number } } } =>
          typeof stage === 'object' &&
          stage !== null &&
          '$match' in (stage as Record<string, unknown>) &&
          '_vectorScore' in
            ((stage as { $match: Record<string, unknown> }).$match ?? {}),
      );
      expect(matchStage).toBeDefined();
      expect(matchStage?.$match._vectorScore).toEqual({ $gte: 0.5 });
    });

    it('omits the $match _vectorScore stage when minScore is 0', async () => {
      const { service, setPassageAggregateResult, getLastPassagePipeline } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setPassageAggregateResult([]);

      await service.searchSourcePassages('sorgu', 4, { minScore: 0 });

      const pipeline = getLastPassagePipeline();
      const hasScoreMatch = pipeline.some(
        (stage) =>
          typeof stage === 'object' &&
          stage !== null &&
          '$match' in (stage as Record<string, unknown>) &&
          '_vectorScore' in
            ((stage as { $match: Record<string, unknown> }).$match ?? {}),
      );
      expect(hasScoreMatch).toBe(false);
    });

    it('throws AiRetrievalError when embedding returns null', async () => {
      const { service } = createHarness({ embeddingVector: null });

      await expect(service.searchSourcePassages('sorgu', 4)).rejects.toThrow(
        AiRetrievalError,
      );
    });

    it('returns [] for an empty query without embedding', async () => {
      const { service, embeddingService } = createHarness();

      const result = await service.searchSourcePassages('   ', 4);

      expect(result).toEqual([]);
      expect(embeddingService.embedWithUsage).not.toHaveBeenCalled();
    });

    describe('hibrit mod (AI_HYBRID_SEARCH=1, varsayılan)', () => {
      const P1 = { id: new Types.ObjectId(), sourceId: 's1', text: 'p1' };
      const P2 = { id: new Types.ObjectId(), sourceId: 's2', text: 'p2' };
      const P3 = { id: new Types.ObjectId(), sourceId: 's3', text: 'p3' };

      function passageDoc(p: typeof P1, extra: Record<string, unknown>) {
        return {
          _id: p.id,
          sourceId: p.sourceId,
          text: p.text,
          sourceTitle: 'Kitap',
          pageStart: 1,
          pageEnd: 2,
          type: 'ilmihal',
          ...extra,
        };
      }

      it('(a) calls aggregate twice (vector + text) and fuses results via RRF', async () => {
        const { service, setPassageAggregateHandler, getPassagePipelines } =
          createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [
              passageDoc(P1, { _vectorScore: 0.9 }),
              passageDoc(P2, { _vectorScore: 0.8 }),
            ];
          }
          if (hasStage(pipeline, '$search')) {
            return [
              passageDoc(P2, { _textScore: 5 }),
              passageDoc(P3, { _textScore: 3 }),
            ];
          }
          throw new Error('unexpected pipeline');
        });

        const result = await service.searchSourcePassages('sorgu', 4, {
          minScore: 0,
        });

        const pipelines = getPassagePipelines();
        expect(pipelines).toHaveLength(2);
        expect(hasStage(pipelines[0], '$vectorSearch')).toBe(true);
        expect(hasStage(pipelines[1], '$search')).toBe(true);

        // RRF (k=60): P2 = 1/62 + 1/61 (vector rank2 + text rank1) — en yüksek.
        // P1 = 1/61 (vector rank1 tek başına). P3 = 1/62 (text rank2 tek başına).
        expect(result.map((r) => r.sourceId)).toEqual(['s2', 's1', 's3']);
        expect(result[0].matchedBy).toBe('both');
        expect(result[1].matchedBy).toBe('vector');
        expect(result[2].matchedBy).toBe('text');
      });

      it('(b) a text-only hit below the vector threshold survives', async () => {
        const { service, setPassageAggregateHandler } = createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [passageDoc(P1, { _vectorScore: 0.5 })];
          }
          if (hasStage(pipeline, '$search')) {
            return [passageDoc(P2, { _textScore: 4 })];
          }
          throw new Error('unexpected pipeline');
        });

        // minScore çok yüksek — P1 (yalnız vektör, 0.5) elenmeli ama
        // P2 (yalnız metin eşleşmesi) hayatta kalmalı.
        const result = await service.searchSourcePassages('sorgu', 4, {
          minScore: 0.95,
        });

        expect(result.map((r) => r.sourceId)).toEqual(['s2']);
        expect(result[0].matchedBy).toBe('text');
      });

      it('(c) a vector-only item below the threshold is dropped', async () => {
        const { service, setPassageAggregateHandler } = createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [passageDoc(P1, { _vectorScore: 0.5 })];
          }
          if (hasStage(pipeline, '$search')) {
            return [];
          }
          throw new Error('unexpected pipeline');
        });

        const result = await service.searchSourcePassages('sorgu', 4, {
          minScore: 0.95,
        });

        expect(result).toEqual([]);
      });

      it('drops weak text hits below the relative floor (scores [5,4,1] -> 2 kept)', async () => {
        const { service, setPassageAggregateHandler, flowLogger } =
          createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [];
          }
          if (hasStage(pipeline, '$search')) {
            return [
              passageDoc(P1, { _textScore: 5 }),
              passageDoc(P2, { _textScore: 4 }),
              passageDoc(P3, { _textScore: 1 }),
            ];
          }
          throw new Error('unexpected pipeline');
        });

        const result = await service.searchSourcePassages('duası', 4, {
          minScore: 0,
        });

        // 0.35 * 5 = 1.75 eşiği — skor 1 olan P3 elenir, s1 ve s2 kalır.
        expect(result.map((r) => r.sourceId).sort()).toEqual(['s1', 's2']);
        expect(result.some((r) => r.sourceId === 's3')).toBe(false);

        const droppedLogs = flowLogger.debug.mock.calls.filter(
          ([message]: [string]) =>
            typeof message === 'string' &&
            message.includes('relative floor') &&
            message.includes('1/3'),
        );
        expect(droppedLogs).toHaveLength(1);
      });

      it("(d) a '$search index not found' error degrades to vector-only + a single warn", async () => {
        const { service, setPassageAggregateHandler, flowLogger } =
          createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [passageDoc(P1, { _vectorScore: 0.9 })];
          }
          if (hasStage(pipeline, '$search')) {
            throw new Error(
              'PlanExecutor error during aggregation :: caused by :: index not found: source_passages_text_index',
            );
          }
          throw new Error('unexpected pipeline');
        });

        const result1 = await service.searchSourcePassages('sorgu', 4, {
          minScore: 0,
        });
        expect(result1.map((r) => r.sourceId)).toEqual(['s1']);
        expect(result1[0].matchedBy).toBe('vector');

        // İkinci çağrı — uyarı yine de sadece BİR kez basılmalı (process
        // başına rate-limit).
        await service.searchSourcePassages('sorgu', 4, { minScore: 0 });

        const missingIndexWarnings = flowLogger.warn.mock.calls.filter(
          ([message]: [string]) =>
            typeof message === 'string' &&
            message.includes('source_passages_text_index'),
        );
        expect(missingIndexWarnings).toHaveLength(1);
      });

      it('any OTHER $search error still throws AiRetrievalError', async () => {
        const { service, setPassageAggregateHandler } = createHarness();

        setPassageAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [passageDoc(P1, { _vectorScore: 0.9 })];
          }
          if (hasStage(pipeline, '$search')) {
            throw new Error('some unrelated Atlas Search failure');
          }
          throw new Error('unexpected pipeline');
        });

        await expect(
          service.searchSourcePassages('sorgu', 4, { minScore: 0 }),
        ).rejects.toThrow(AiRetrievalError);
      });
    });

    it('(e) AI_HYBRID_SEARCH=0 calls aggregate exactly once (vector-only)', async () => {
      const { service, setPassageAggregateResult, getPassagePipelines } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setPassageAggregateResult([]);

      await service.searchSourcePassages('sorgu', 4, { minScore: 0 });

      expect(getPassagePipelines()).toHaveLength(1);
      expect(hasStage(getPassagePipelines()[0], '$vectorSearch')).toBe(true);
    });
  });

  describe('searchDhikrsByText', () => {
    it('maps name/virtue/meaning from locale en when present', async () => {
      const { service, setDhikrAggregateResult } = createHarness({
        configValues: { AI_HYBRID_SEARCH: '0' },
      });
      setDhikrAggregateResult([
        {
          _id: new Types.ObjectId(),
          name: { tr: 'Tesbih', en: 'Tasbih' },
          virtue: { tr: 'Fazileti tr', en: 'Virtue en' },
          meaning: { tr: 'Anlam tr', en: 'Meaning en' },
          tags: ['tag1'],
          categories: ['cat1'],
          suitableFor: ['sabah'],
          timeOfDay: ['morning'],
          _vectorScore: 0.9,
        },
      ]);

      const result = await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'en',
      });

      expect(result[0]).toMatchObject({
        name: 'Tasbih',
        virtue: 'Virtue en',
        meaning: 'Meaning en',
        score: 0.9,
      });
    });

    it('falls back to tr when the en field is empty', async () => {
      const { service, setDhikrAggregateResult } = createHarness({
        configValues: { AI_HYBRID_SEARCH: '0' },
      });
      setDhikrAggregateResult([
        {
          _id: new Types.ObjectId(),
          name: { tr: 'Tesbih', en: '' },
          virtue: { tr: 'Fazileti tr', en: '' },
          meaning: { tr: 'Anlam tr', en: '' },
          tags: [],
          categories: [],
          suitableFor: [],
          timeOfDay: ['any'],
        },
      ]);

      const result = await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'en',
      });

      expect(result[0]).toMatchObject({
        name: 'Tesbih',
        virtue: 'Fazileti tr',
        meaning: 'Anlam tr',
      });
    });

    it('throws AiRetrievalError when embedding fails', async () => {
      const { service } = createHarness({ embeddingVector: null });

      await expect(
        service.searchDhikrsByText({
          query: 'huzur',
          limit: 5,
          excludeIds: [],
          locale: 'tr',
        }),
      ).rejects.toThrow(AiRetrievalError);
    });

    describe('hibrit mod (AI_DHIKR_HYBRID_SEARCH=1)', () => {
      const D1 = new Types.ObjectId();
      const D2 = new Types.ObjectId();

      function dhikrDoc(id: Types.ObjectId, extra: Record<string, unknown>) {
        return {
          _id: id,
          name: { tr: 'Zikir', en: 'Zikir' },
          virtue: { tr: 'Fazilet', en: 'Fazilet' },
          meaning: { tr: 'Anlam', en: 'Anlam' },
          tags: [],
          categories: [],
          suitableFor: [],
          timeOfDay: ['any'],
          ...extra,
        };
      }

      it('uses a $match $text stage (not Atlas $search) for the text leg', async () => {
        const { service, setDhikrAggregateHandler, getDhikrPipelines } =
          createHarness({ configValues: { AI_DHIKR_HYBRID_SEARCH: '1' } });

        setDhikrAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [dhikrDoc(D1, { _vectorScore: 0.9 })];
          }
          return [dhikrDoc(D2, { _textScore: 4 })];
        });

        await service.searchDhikrsByText({
          query: 'Hasbünallah',
          limit: 5,
          excludeIds: [],
          locale: 'tr',
        });

        const pipelines = getDhikrPipelines();
        expect(pipelines).toHaveLength(2);
        const textPipeline = pipelines.find(
          (p) => !hasStage(p, '$vectorSearch'),
        );
        expect(textPipeline).toBeDefined();
        expect(hasStage(textPipeline!, '$search')).toBe(false);
        expect(hasTextMatch(textPipeline!)).toBe(true);
        const matchStage = textPipeline![0] as {
          $match: { $text: { $search: string; $language: string } };
        };
        expect(matchStage.$match.$text).toEqual({
          $search: 'Hasbünallah',
          $language: 'turkish',
        });
      });

      it('fuses vector + text candidates and tags matchedBy', async () => {
        const { service, setDhikrAggregateHandler, getDhikrPipelines } =
          createHarness({ configValues: { AI_DHIKR_HYBRID_SEARCH: '1' } });

        setDhikrAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [dhikrDoc(D1, { _vectorScore: 0.9 })];
          }
          return [dhikrDoc(D2, { _textScore: 4 })];
        });

        const result = await service.searchDhikrsByText({
          query: 'Hasbünallah',
          limit: 5,
          excludeIds: [],
          locale: 'tr',
        });

        expect(getDhikrPipelines()).toHaveLength(2);
        expect(result.map((r) => r.id)).toEqual([D1.toString(), D2.toString()]);
        expect(result[0].matchedBy).toBe('vector');
        expect(result[1].matchedBy).toBe('text');
      });

      it('drops weak text hits below the relative floor (scores [5,4,1] -> 2 kept)', async () => {
        const D3 = new Types.ObjectId();
        const { service, setDhikrAggregateHandler } = createHarness({
          configValues: { AI_DHIKR_HYBRID_SEARCH: '1' },
        });

        setDhikrAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [];
          }
          return [
            dhikrDoc(D1, { _textScore: 5 }),
            dhikrDoc(D2, { _textScore: 4 }),
            dhikrDoc(D3, { _textScore: 1 }),
          ];
        });

        const result = await service.searchDhikrsByText({
          query: 'duası',
          limit: 5,
          excludeIds: [],
          locale: 'tr',
        });

        // 0.35 * 5 = 1.75 eşiği — skor 1 olan D3 elenir, 5 ve 4 kalır.
        expect(result.map((r) => r.id).sort()).toEqual(
          [D1.toString(), D2.toString()].sort(),
        );
        expect(result.some((r) => r.id === D3.toString())).toBe(false);
      });

      it("degrades to vector-only when the $text index is missing ('text index required')", async () => {
        const { service, setDhikrAggregateHandler, flowLogger } = createHarness(
          { configValues: { AI_DHIKR_HYBRID_SEARCH: '1' } },
        );

        setDhikrAggregateHandler((pipeline) => {
          if (hasStage(pipeline, '$vectorSearch')) {
            return [dhikrDoc(D1, { _vectorScore: 0.9 })];
          }
          throw new Error(
            'MongoServerError: text index required for $text query',
          );
        });

        const result = await service.searchDhikrsByText({
          query: 'Hasbünallah',
          limit: 5,
          excludeIds: [],
          locale: 'tr',
        });

        expect(result.map((r) => r.id)).toEqual([D1.toString()]);
        expect(result[0].matchedBy).toBe('vector');

        const missingIndexWarnings = flowLogger.warn.mock.calls.filter(
          ([message]: [string]) =>
            typeof message === 'string' && message.includes('dhikr_text_idx'),
        );
        expect(missingIndexWarnings).toHaveLength(1);
      });
    });

    it('AI_DHIKR_HYBRID_SEARCH=0 calls aggregate exactly once (vector-only)', async () => {
      const { service, setDhikrAggregateResult, getDhikrPipelines } =
        createHarness({ configValues: { AI_DHIKR_HYBRID_SEARCH: '0' } });
      setDhikrAggregateResult([]);

      await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      expect(getDhikrPipelines()).toHaveLength(1);
    });

    it('default env (AI_DHIKR_HYBRID_SEARCH unset) does not call $text — dhikr path stays vector-only', async () => {
      const { service, setDhikrAggregateResult, getDhikrPipelines } =
        createHarness();
      setDhikrAggregateResult([]);

      await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      const pipelines = getDhikrPipelines();
      expect(pipelines).toHaveLength(1);
      expect(pipelines.some((p) => hasTextMatch(p))).toBe(false);
      expect(hasStage(pipelines[0], '$vectorSearch')).toBe(true);
    });
  });

  describe('searchDhikrsByTimeOfDay', () => {
    it('uses a $sample stage instead of a recommendedCount sort', async () => {
      const { service, setDhikrAggregateResult, getLastDhikrPipeline } =
        createHarness();
      setDhikrAggregateResult([]);

      await service.searchDhikrsByTimeOfDay({
        timeOfDay: 'morning',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      const pipeline = getLastDhikrPipeline();
      const hasSample = pipeline.some(
        (stage) =>
          typeof stage === 'object' &&
          stage !== null &&
          '$sample' in (stage as Record<string, unknown>),
      );
      const hasRecommendedCountSort = pipeline.some(
        (stage) =>
          typeof stage === 'object' &&
          stage !== null &&
          '$sort' in (stage as Record<string, unknown>) &&
          'recommendedCount' in
            ((stage as { $sort: Record<string, unknown> }).$sort ?? {}),
      );
      expect(hasSample).toBe(true);
      expect(hasRecommendedCountSort).toBe(false);
    });

    it('overfetches via $sample (limit*3) and dedupes by canonicalKey', async () => {
      const { service, setDhikrAggregateResult, getLastDhikrPipeline } =
        createHarness();
      const dupKey = canonicalKeyFromArabic('السَّلَامُ');
      setDhikrAggregateResult([
        {
          _id: new Types.ObjectId(),
          name: { tr: 'A', en: 'A' },
          virtue: { tr: '', en: '' },
          meaning: { tr: '', en: '' },
          tags: [],
          categories: [],
          suitableFor: [],
          timeOfDay: ['morning'],
          canonicalKey: dupKey,
        },
        {
          _id: new Types.ObjectId(),
          name: { tr: 'B (harekesiz varyant)', en: 'B' },
          virtue: { tr: '', en: '' },
          meaning: { tr: '', en: '' },
          tags: [],
          categories: [],
          suitableFor: [],
          timeOfDay: ['morning'],
          nameArabic: 'السلام',
        },
      ]);

      const result = await service.searchDhikrsByTimeOfDay({
        timeOfDay: 'morning',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      expect(result).toHaveLength(1);

      const pipeline = getLastDhikrPipeline();
      const sampleStage = pipeline.find(
        (stage): stage is { $sample: { size: number } } =>
          typeof stage === 'object' &&
          stage !== null &&
          '$sample' in (stage as Record<string, unknown>),
      );
      expect(sampleStage?.$sample.size).toBe(15);
    });
  });

  describe('canonicalKey dedupe ve ENN (exact vektör araması)', () => {
    function dhikrDocWithArabic(
      id: Types.ObjectId,
      extra: Record<string, unknown>,
    ) {
      return {
        _id: id,
        name: { tr: 'Zikir', en: 'Zikir' },
        virtue: { tr: 'Fazilet', en: 'Fazilet' },
        meaning: { tr: 'Anlam', en: 'Anlam' },
        tags: [],
        categories: [],
        suitableFor: [],
        timeOfDay: ['any'],
        ...extra,
      };
    }

    it('vector-only $vectorSearch stage uses exact:true and no numCandidates', async () => {
      const { service, setDhikrAggregateResult, getLastDhikrPipeline } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setDhikrAggregateResult([]);

      await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      const pipeline = getLastDhikrPipeline();
      const vectorStage = pipeline.find(
        (stage): stage is { $vectorSearch: Record<string, unknown> } =>
          typeof stage === 'object' &&
          stage !== null &&
          '$vectorSearch' in (stage as Record<string, unknown>),
      );
      expect(vectorStage?.$vectorSearch.exact).toBe(true);
      expect(vectorStage?.$vectorSearch).not.toHaveProperty('numCandidates');
    });

    it('hybrid mode $vectorSearch leg also uses exact:true and no numCandidates', async () => {
      const { service, setDhikrAggregateHandler, getDhikrPipelines } =
        createHarness({ configValues: { AI_DHIKR_HYBRID_SEARCH: '1' } });

      setDhikrAggregateHandler(() => []);

      await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      const vectorPipeline = getDhikrPipelines().find((p) =>
        hasStage(p, '$vectorSearch'),
      );
      const vectorStage = vectorPipeline?.find(
        (stage): stage is { $vectorSearch: Record<string, unknown> } =>
          typeof stage === 'object' &&
          stage !== null &&
          '$vectorSearch' in (stage as Record<string, unknown>),
      );
      expect(vectorStage?.$vectorSearch.exact).toBe(true);
      expect(vectorStage?.$vectorSearch).not.toHaveProperty('numCandidates');
    });

    it('two candidates with the same Arabic text (harakat vs. no harakat) dedupe to one, keeping the higher-ranked', async () => {
      const D1 = new Types.ObjectId();
      const D2 = new Types.ObjectId();
      const { service, setDhikrAggregateResult } = createHarness({
        configValues: { AI_HYBRID_SEARCH: '0' },
      });

      setDhikrAggregateResult([
        dhikrDocWithArabic(D1, {
          _vectorScore: 0.9,
          nameArabic: 'سُبْحَانَ اللَّهِ',
        }),
        dhikrDocWithArabic(D2, {
          _vectorScore: 0.8,
          nameArabic: 'سبحان الله',
        }),
      ]);

      const result = await service.searchDhikrsByText({
        query: 'tesbih',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
      });

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe(D1.toString());
    });

    it('passage $vectorSearch numCandidates is 200 (not exact, unchanged behavior otherwise)', async () => {
      const { service, setPassageAggregateResult, getLastPassagePipeline } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setPassageAggregateResult([]);

      await service.searchSourcePassages('sorgu', 4, { minScore: 0 });

      const pipeline = getLastPassagePipeline();
      const vectorStage = pipeline.find(
        (stage): stage is { $vectorSearch: Record<string, unknown> } =>
          typeof stage === 'object' &&
          stage !== null &&
          '$vectorSearch' in (stage as Record<string, unknown>),
      );
      expect(vectorStage?.$vectorSearch.numCandidates).toBe(200);
      expect(vectorStage?.$vectorSearch.exact).toBeUndefined();
    });
  });

  describe('embedQuery / queryVector geçişi', () => {
    it('searchDhikrsByText skips embedding when queryVector is provided', async () => {
      const { service, setDhikrAggregateResult, embeddingService } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setDhikrAggregateResult([]);

      await service.searchDhikrsByText({
        query: 'huzur',
        limit: 5,
        excludeIds: [],
        locale: 'tr',
        queryVector: [0.5, 0.5],
      });

      expect(embeddingService.embedWithUsage).not.toHaveBeenCalled();
    });

    it('searchSourcePassages skips embedding when queryVector is provided', async () => {
      const { service, setPassageAggregateResult, embeddingService } =
        createHarness({ configValues: { AI_HYBRID_SEARCH: '0' } });
      setPassageAggregateResult([]);

      await service.searchSourcePassages('sorgu', 4, {
        minScore: 0,
        queryVector: [0.5, 0.5],
      });

      expect(embeddingService.embedWithUsage).not.toHaveBeenCalled();
    });

    it('embedQuery records usage once and throws AiRetrievalError on null vector', async () => {
      const { service } = createHarness({ embeddingVector: null });

      await expect(
        service.embedQuery('sorgu', { flowId: 'f1', userId: 'u1' }),
      ).rejects.toThrow(AiRetrievalError);
    });
  });
});
