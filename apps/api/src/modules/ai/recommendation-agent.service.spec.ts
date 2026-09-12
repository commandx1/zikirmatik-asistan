import { Types } from 'mongoose';
import { APICallError, generateObject, generateText } from 'ai';
import { RecommendationAgentService } from './recommendation-agent.service';
import { AiRuntimeService } from './ai-runtime.service';
import type { DhikrCandidate, SourcePassageResult } from './retrieval.service';

type DhikrLeanStub = { _id: Types.ObjectId };

type SearchByTextParams = {
  query: string;
  limit: number;
  excludeIds: string[];
  locale: string;
  flowId?: string;
  userId?: string;
};

type SearchByTimeOfDayParams = {
  timeOfDay: string;
  limit: number;
  excludeIds: string[];
  locale: string;
};

// generateText'e geçirilen options nesnesinin, testlerin ihtiyaç duyduğu
// alt kümesi — `any` kullanmadan tool execute'larını ve prepareStep'i
// tip-güvenli biçimde çağırabilmek için.
type SelectStepOptions = {
  system: string;
  prompt: string;
  prepareStep: (args: { steps: unknown[] }) => {
    activeTools: string[];
    toolChoice: string;
  };
  tools: {
    searchDhikrs: {
      execute: (input: { query: string; why: string }) => Promise<unknown>;
    };
    selectRecommendations: {
      execute: (input: {
        summary: string;
        items: Array<{ ref: string; reason: string }>;
      }) => unknown;
    };
    askClarification: {
      execute: (input: { question: string }) => unknown;
    };
  };
};

// 'ai' SDK gerçek ağ çağrısı yapar; generateText/generateObject mock'lanır,
// diğer her şey (APICallError, classifyAiError'ın kullandığı hata sınıfları,
// tool() — identity fonksiyonu, stepCountIs) GERÇEK kalır — böylece
// AiRuntimeService.withAiRetry ve classifyAiError gerçek davranışlarıyla
// test edilebilir (retry sayısı, reason sınıflandırması vb.).
jest.mock('ai', () => {
  const actual = jest.requireActual<typeof import('ai')>('ai');
  return {
    ...actual,
    generateText: jest.fn(),
    generateObject: jest.fn(),
  };
});

const generateTextMock = generateText as unknown as jest.Mock<
  Promise<{ totalUsage: unknown; steps: unknown[] }>,
  [SelectStepOptions]
>;
const generateObjectMock = generateObject as unknown as jest.Mock;

function apiCallError(statusCode: number, message = 'api error'): APICallError {
  return new APICallError({
    message,
    url: 'https://api.openai.com/v1/responses',
    requestBodyValues: {},
    statusCode,
  });
}

function candidate(
  id: string,
  overrides: Partial<DhikrCandidate> = {},
): DhikrCandidate {
  return {
    id,
    name: `Zikir ${id.slice(-4)}`,
    virtue: 'Bu zikrin faziletine dair metin.',
    meaning: 'Bu zikrin anlamına dair metin.',
    tags: ['huzur'],
    categories: ['genel'],
    suitableFor: ['kaygı'],
    timeOfDay: ['any'],
    ...overrides,
  };
}

function dhikrLean(id: string) {
  return { _id: new Types.ObjectId(id) };
}

function mkId(): string {
  return new Types.ObjectId().toHexString();
}

function createHarness(
  configValues?: Record<string, string | number | undefined>,
) {
  const configService = {
    get: jest.fn((key: string) => {
      if (key === 'OPENAI_API_KEY') return 'test-key';
      return configValues?.[key];
    }),
  };
  // Gerçek AiRuntimeService kullanılır: model()/settings()/withAiRetry()/
  // flowLog() gerçek davranışlarıyla çalışır (yalnızca generateText/
  // generateObject mock'landığı için ağa hiç çıkılmaz).
  const runtime = new AiRuntimeService(configService as never);

  // jest.fn<FnType>() (parametresiz) kullanılır: isimsiz/kullanılmayan
  // parametreler no-unused-vars'ı tetiklemesin diye. Varsayılan dönüş
  // değerleri aşağıda mockResolvedValue ile ayarlanır; testler ihtiyaç
  // duyduğunda mockResolvedValueOnce ile üzerine yazar.
  const searchSourcePassages = jest.fn<
    Promise<SourcePassageResult[]>,
    [string, number?, { minScore?: number; flowId?: string; userId?: string }?]
  >();
  searchSourcePassages.mockResolvedValue([]);

  const searchDhikrsByText = jest.fn<
    Promise<DhikrCandidate[]>,
    [SearchByTextParams]
  >();
  searchDhikrsByText.mockResolvedValue([]);

  const searchDhikrsByTimeOfDay = jest.fn<
    Promise<DhikrCandidate[]>,
    [SearchByTimeOfDayParams]
  >();
  searchDhikrsByTimeOfDay.mockResolvedValue([]);

  const loadDhikrsByIds = jest.fn<Promise<DhikrLeanStub[]>, [string[]]>();
  loadDhikrsByIds.mockResolvedValue([]);

  const embedQuery = jest.fn<
    Promise<{ vector: number[]; usage?: { inputTokens: number } }>,
    [string, { flowId?: string; userId?: string }]
  >();
  embedQuery.mockResolvedValue({ vector: [0.1, 0.2, 0.3] });

  const retrieval = {
    searchSourcePassages,
    searchDhikrsByText,
    searchDhikrsByTimeOfDay,
    loadDhikrsByIds,
    embedQuery,
  };

  const usage = { record: jest.fn(() => Promise.resolve()) };
  const progressGateway = { emitStep: jest.fn() };

  const service = new RecommendationAgentService(
    runtime,
    retrieval as never,
    usage as never,
    progressGateway as never,
    configService as never,
  );

  return { service, retrieval, usage, progressGateway, configService };
}

function stubExpand(result: { offTopic: boolean; expandedQuery: string }) {
  generateObjectMock.mockResolvedValueOnce({ object: result, usage: {} });
}

describe('RecommendationAgentService', () => {
  beforeEach(() => {
    generateTextMock.mockReset();
    generateObjectMock.mockReset();
  });

  it('happy path: selects candidates via selectRecommendations, in the given order', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'huzur arayışı' });

    const id1 = mkId();
    const id2 = mkId();
    const id3 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValueOnce([
      candidate(id1),
      candidate(id2),
      candidate(id3),
    ]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([
      dhikrLean(id3),
      dhikrLean(id1),
    ]);

    let capturedPrepareStep: unknown;
    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      const prepared = opts.prepareStep({ steps: [] });
      capturedPrepareStep = prepared;
      await opts.tools.selectRecommendations.execute({
        summary: 'Niyetine uygun zikirler bunlar.',
        items: [
          { ref: 'C1', reason: 'r1' },
          { ref: 'C3', reason: 'r3' },
        ],
      });
      return { totalUsage: {}, steps: [{}] };
    });

    const outcome = await service.run({
      freeText: 'canım sıkkın',
      timeOfDay: 'evening',
      recentDhikrIds: [],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-1',
      userId: 'user-1',
    });

    expect(outcome.kind).toBe('selected');
    if (outcome.kind !== 'selected') throw new Error('unexpected');
    expect(outcome.items.map((i) => i.dhikr._id.toString())).toEqual([
      id1,
      id3,
    ]);
    expect(outcome.summary).toBe('Niyetine uygun zikirler bunlar.');
    expect(capturedPrepareStep).toEqual({
      activeTools: ['searchDhikrs', 'selectRecommendations'],
      toolChoice: 'required',
    });

    // searchQuery tek seferde embed edilir; sonuç vektörü hem pasaj hem
    // zikir aramasına geçirilir (bkz. retrieval.service.ts embedQuery).
    expect(retrieval.embedQuery).toHaveBeenCalledTimes(1);
    expect(retrieval.embedQuery).toHaveBeenCalledWith('huzur arayışı', {
      flowId: 'flow-1',
      userId: 'user-1',
    });
    expect(retrieval.searchSourcePassages).toHaveBeenCalledWith(
      'huzur arayışı',
      expect.any(Number),
      expect.objectContaining({ queryVector: [0.1, 0.2, 0.3] }),
    );
    expect(retrieval.searchDhikrsByText.mock.calls[0][0]).toMatchObject({
      queryVector: [0.1, 0.2, 0.3],
      excludeIds: [],
    });
  });

  it('re-search path: searchDhikrs excludes prior ids, then selectRecommendations picks a new ref', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'huzur arayışı' });

    const id1 = mkId();
    const id2 = mkId();
    const id3 = mkId();
    const id4 = mkId();
    const id5 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValueOnce([
      candidate(id1),
      candidate(id2),
      candidate(id3),
    ]);
    retrieval.searchDhikrsByText.mockResolvedValueOnce([
      candidate(id4),
      candidate(id5),
    ]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id5)]);

    let prepareStepAfterSearch: unknown;
    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      await opts.tools.searchDhikrs.execute({
        query: 'yeniden yazılmış sorgu',
        why: 'ilk adaylar uymuyor',
      });
      prepareStepAfterSearch = opts.prepareStep({ steps: [] });
      await opts.tools.selectRecommendations.execute({
        summary: 'Yeni arama sonrası özet.',
        items: [{ ref: 'C5', reason: 'r5' }],
      });
      return { totalUsage: {}, steps: [{}, {}] };
    });

    const outcome = await service.run({
      freeText: 'canım sıkkın',
      timeOfDay: 'evening',
      recentDhikrIds: ['recent-1'],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-2',
      userId: 'user-1',
    });

    expect(outcome.kind).toBe('selected');
    if (outcome.kind !== 'selected') throw new Error('unexpected');
    expect(outcome.items.map((i) => i.dhikr._id.toString())).toEqual([id5]);

    // İlk arama artık recentDhikrIds'i excludeIds olarak GEÇMEZ — yumuşak
    // işaretlemeye (recentlyPracticed) geçildi.
    const firstCallArgs = retrieval.searchDhikrsByText.mock.calls[0]?.[0];
    expect(firstCallArgs?.excludeIds).toEqual([]);

    // searchDhikrs (tool, ikinci arama) ilk 3 adayın id'lerini +
    // recentDhikrIds'i excludeIds'e eklemeye devam eder — bu davranış
    // değişmedi.
    const secondCallArgs = retrieval.searchDhikrsByText.mock.calls[1]?.[0];
    expect(secondCallArgs?.excludeIds).toEqual(
      expect.arrayContaining(['recent-1', id1, id2, id3]),
    );

    expect(prepareStepAfterSearch).toEqual({
      activeTools: ['selectRecommendations', 'askClarification'],
      toolChoice: 'required',
    });
  });

  it('marks a candidate that is in recentDhikrIds as recentlyPracticed in the prompt, without excluding it', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'huzur arayışı' });

    const id1 = mkId();
    const id2 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValueOnce([
      candidate(id1),
      candidate(id2),
    ]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      // id1 (C1) alakasız çekilmiş olsa bile aday listesinden ÇIKARILMADI —
      // yalnızca satırında işaretli.
      expect(opts.prompt).toContain('[son 7 günde çekildi]');
      const c1Line = opts.prompt
        .split('\n')
        .find((line) => line.startsWith('C1 |'));
      const c2Line = opts.prompt
        .split('\n')
        .find((line) => line.startsWith('C2 |'));
      expect(c1Line).toContain('[son 7 günde çekildi]');
      expect(c2Line).not.toContain('[son 7 günde çekildi]');

      await opts.tools.selectRecommendations.execute({
        summary: 'ozet',
        items: [{ ref: 'C1', reason: 'reason' }],
      });
      return { totalUsage: {}, steps: [{}] };
    });

    const outcome = await service.run({
      freeText: 'canım sıkkın',
      timeOfDay: 'evening',
      recentDhikrIds: [id1],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-recent',
      userId: 'user-1',
    });

    expect(outcome.kind).toBe('selected');
    expect(retrieval.searchDhikrsByText.mock.calls[0][0].excludeIds).toEqual(
      [],
    );
  });

  it('clarification path: askClarification after a search sanitizes the question', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'belirsiz niyet' });

    retrieval.searchDhikrsByText.mockResolvedValueOnce([candidate(mkId())]);
    retrieval.searchDhikrsByText.mockResolvedValueOnce([]);

    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      await opts.tools.searchDhikrs.execute({ query: 'x', why: 'y' });
      await opts.tools.askClarification.execute({
        question: ' Hangi konuda?\n ',
      });
      return { totalUsage: {}, steps: [{}, {}] };
    });

    const outcome = await service.run({
      freeText: 'bilmiyorum',
      timeOfDay: 'night',
      recentDhikrIds: [],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-3',
      userId: 'user-1',
    });

    expect(outcome).toEqual({
      kind: 'clarification',
      question: 'Hangi konuda?',
    });
  });

  it('invalid refs only: retries the whole select step once, then throws AiInvalidOutputError', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'huzur arayışı' });
    retrieval.searchDhikrsByText.mockResolvedValueOnce([candidate(mkId())]);

    generateTextMock.mockImplementation(async (opts: SelectStepOptions) => {
      const result = await opts.tools.selectRecommendations.execute({
        summary: 'ozet',
        items: [
          { ref: 'C99', reason: 'x' },
          { ref: '507f1f77bcf86cd799439011', reason: 'y' },
        ],
      });
      expect(result).toEqual({
        ok: false,
        error: 'Yalnızca aday listesindeki C# referanslarını kullan.',
      });
      return { totalUsage: {}, steps: [{}] };
    });

    await expect(
      service.run({
        freeText: 'canım sıkkın',
        timeOfDay: 'evening',
        recentDhikrIds: [],
        maxRecommendations: 5,
        locale: 'tr',
        flowId: 'flow-4',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ reason: 'invalid_output' });

    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });

  it('mixed refs: only the valid C# ref is accepted, the invalid one is dropped', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'huzur arayışı' });

    const id1 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValueOnce([candidate(id1)]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      await opts.tools.selectRecommendations.execute({
        summary: 'ozet',
        items: [
          { ref: 'C1', reason: 'reason-for-c1' },
          { ref: 'C99', reason: 'reason-for-c99' },
        ],
      });
      return { totalUsage: {}, steps: [{}] };
    });

    const outcome = await service.run({
      freeText: 'canım sıkkın',
      timeOfDay: 'evening',
      recentDhikrIds: [],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-5',
      userId: 'user-1',
    });

    expect(outcome.kind).toBe('selected');
    if (outcome.kind !== 'selected') throw new Error('unexpected');
    expect(outcome.items).toHaveLength(1);
    expect(outcome.items[0].reason).toBe('reason-for-c1');
    expect(outcome.items.some((i) => i.reason === 'reason-for-c99')).toBe(
      false,
    );
  });

  it('off-topic: returns immediately, generateText is never called', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: true, expandedQuery: '' });

    const outcome = await service.run({
      freeText: 'nasılsın',
      timeOfDay: 'evening',
      recentDhikrIds: [],
      maxRecommendations: 5,
      locale: 'tr',
      flowId: 'flow-6',
      userId: 'user-1',
    });

    expect(outcome).toEqual({ kind: 'offTopic' });
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(retrieval.searchDhikrsByText).not.toHaveBeenCalled();
    expect(retrieval.searchDhikrsByTimeOfDay).not.toHaveBeenCalled();
    expect(retrieval.embedQuery).not.toHaveBeenCalled();
  });

  it('provider failure: classifies a 503 APICallError as provider_error after retrying once', async () => {
    const { service, retrieval } = createHarness();
    // freeText yok → expandIntent hiç çalışmaz, doğrudan zaman tabanlı aday
    // çekme yoluna girilir (generateObject mock'lamaya gerek yok).
    retrieval.searchDhikrsByTimeOfDay.mockResolvedValueOnce([
      candidate(mkId()),
    ]);

    generateTextMock.mockRejectedValue(
      apiCallError(503, 'service unavailable'),
    );

    await expect(
      service.run({
        timeOfDay: 'night',
        recentDhikrIds: [],
        maxRecommendations: 5,
        locale: 'tr',
        flowId: 'flow-7',
        userId: 'user-1',
      }),
    ).rejects.toMatchObject({ reason: 'provider_error', retryable: true });

    expect(generateTextMock).toHaveBeenCalledTimes(2);
    // Zaman tabanlı yol (freeText yok) hiç embed etmemeli.
    expect(retrieval.embedQuery).not.toHaveBeenCalled();
  });

  it('locale en: system prompt mentions English, user prompt uses C# refs', async () => {
    const { service, retrieval } = createHarness();
    stubExpand({ offTopic: false, expandedQuery: 'seeking peace' });

    const id1 = mkId();
    const enCandidate = candidate(id1, { name: 'Subhanallah' });
    retrieval.searchDhikrsByText.mockResolvedValueOnce([enCandidate]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce(async (opts: SelectStepOptions) => {
      await opts.tools.selectRecommendations.execute({
        summary: 'summary',
        items: [{ ref: 'C1', reason: 'reason' }],
      });
      return { totalUsage: {}, steps: [{}] };
    });

    await service.run({
      freeText: 'I feel anxious',
      timeOfDay: 'evening',
      recentDhikrIds: [],
      maxRecommendations: 5,
      locale: 'en',
      flowId: 'flow-8',
      userId: 'user-1',
    });

    const callArgs = generateTextMock.mock.calls[0][0];
    expect(callArgs.system).toContain('English');
    expect(callArgs.prompt).toContain('C1 | Subhanallah');
  });
});
