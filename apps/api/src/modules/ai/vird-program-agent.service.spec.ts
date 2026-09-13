import { Types } from 'mongoose';
import { APICallError, generateText } from 'ai';
import { VirdProgramAgentService } from './vird-program-agent.service';
import { AiRuntimeService } from './ai-runtime.service';
import type { BuildProgramInput } from './prompts';
import type { DhikrCandidate } from './retrieval.service';

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

// generateText'e geçirilen options nesnesinin testlerin ihtiyaç duyduğu alt
// kümesi — recommendation-agent.service.spec.ts'teki SelectStepOptions
// deseninin vird ajanına uyarlanmışı (searchDhikrs + buildProgram, tool
// sonuçları senkron döner).
type BuildStepOptions = {
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
    buildProgram: {
      execute: (input: BuildProgramInput) => unknown;
    };
  };
};

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
  [BuildStepOptions]
>;

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
    recommendedCount: 33,
    ...overrides,
  };
}

function dhikrLean(id: string): DhikrLeanStub {
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
  // Gerçek AiRuntimeService: model()/settings()/withAiRetry()/flowLog()
  // gerçek davranışlarıyla çalışır (yalnızca generateText mock'landığı için
  // ağa hiç çıkılmaz).
  const runtime = new AiRuntimeService(configService as never);

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
    searchDhikrsByText,
    searchDhikrsByTimeOfDay,
    loadDhikrsByIds,
    embedQuery,
  };

  const usage = { record: jest.fn(() => Promise.resolve()) };
  const progressGateway = { emitStep: jest.fn() };

  const expandIntent = jest.fn<
    Promise<{ offTopic: boolean; expandedQuery: string }>,
    [unknown]
  >();
  expandIntent.mockResolvedValue({
    offTopic: false,
    expandedQuery: 'sınav kaygısı, huzur arayışı',
  });
  const recommendationAgent = { expandIntent };

  const service = new VirdProgramAgentService(
    runtime,
    retrieval as never,
    usage as never,
    progressGateway as never,
    configService as never,
    recommendationAgent as never,
  );

  return {
    service,
    retrieval,
    usage,
    progressGateway,
    recommendationAgent,
    configService,
  };
}

function baseInput(
  overrides: Partial<Parameters<VirdProgramAgentService['run']>[0]> = {},
) {
  return {
    freeText: 'sınav dönemindeyim çok kaygılıyım',
    durationDays: 7,
    slots: ['free'] as Array<
      'morning' | 'prayer' | 'evening' | 'night' | 'free'
    >,
    recentDhikrIds: [],
    locale: 'tr' as const,
    flowId: 'flow-x',
    userId: 'user-1',
    ...overrides,
  };
}

describe('VirdProgramAgentService', () => {
  beforeEach(() => {
    generateTextMock.mockReset();
  });

  it('off-topic: returns immediately, generateText and retrieval are never called', async () => {
    const { service, retrieval, recommendationAgent } = createHarness();
    recommendationAgent.expandIntent.mockResolvedValueOnce({
      offTopic: true,
      expandedQuery: '',
    });

    const outcome = await service.run(baseInput({ flowId: 'flow-1' }));

    expect(outcome).toEqual({ kind: 'offTopic' });
    expect(generateTextMock).not.toHaveBeenCalled();
    expect(retrieval.searchDhikrsByText).not.toHaveBeenCalled();
    expect(retrieval.embedQuery).not.toHaveBeenCalled();
  });

  it('happy path: gathers per-slot candidates, builds a valid program, resolves dhikr via the second DB gate', async () => {
    const { service, retrieval } = createHarness();
    const idGeneral = mkId();
    const idMorning = mkId();
    const idPrayer = mkId();

    retrieval.searchDhikrsByText.mockImplementation(
      (params: SearchByTextParams) =>
        Promise.resolve(
          params.query === 'namaz sonrası'
            ? [candidate(idPrayer, { name: 'Prayer Zikri' })]
            : [candidate(idGeneral, { name: 'General Zikri' })],
        ),
    );
    retrieval.searchDhikrsByTimeOfDay.mockResolvedValueOnce([
      candidate(idMorning, { name: 'Morning Zikri' }),
    ]);
    retrieval.loadDhikrsByIds.mockImplementation((ids: string[]) =>
      Promise.resolve(ids.map((id) => dhikrLean(id))),
    );

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      const prepared = opts.prepareStep({ steps: [] });
      expect(prepared).toEqual({
        activeTools: ['searchDhikrs', 'buildProgram'],
        toolChoice: 'required',
      });

      // Sıra: [genel(C1), morning(C2), prayer(C3)] — gatherCandidates
      // [generalCandidates, ...slotCandidateLists] sırasını korur.
      const result = opts.tools.buildProgram.execute({
        title: 'Sınav Dönemi Virdi',
        summary:
          'Bu zor günlerde Allah’a sığınmak güzel, inşallah kolaylık olur.',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'Sabır ve tevekkül',
            slots: {
              morning: [{ ref: 'C2', target: 10 }],
              prayer: [{ ref: 'C3', target: 3 }],
            },
          },
        ],
      });
      expect(result).toEqual({ ok: true, phases: 1 });
      return Promise.resolve({ totalUsage: {}, steps: [{}] });
    });

    const outcome = await service.run(
      baseInput({
        slots: ['morning', 'prayer'],
        flowId: 'flow-2',
      }),
    );

    expect(outcome.kind).toBe('program');
    if (outcome.kind !== 'program') throw new Error('unexpected');
    expect(outcome.title).toBe('Sınav Dönemi Virdi');
    expect(outcome.phases).toHaveLength(1);
    expect(outcome.phases[0].slots.morning?.[0].dhikr._id.toString()).toBe(
      idMorning,
    );
    expect(outcome.phases[0].slots.morning?.[0].target).toBe(10);
    expect(outcome.phases[0].slots.prayer?.[0].target).toBe(3);
    expect(outcome.phases[0].slots.night).toBeUndefined();

    expect(retrieval.searchDhikrsByTimeOfDay).toHaveBeenCalledWith(
      expect.objectContaining({ timeOfDay: 'morning', limit: 6 }),
    );
    expect(retrieval.searchDhikrsByText).toHaveBeenCalledWith(
      expect.objectContaining({ query: 'namaz sonrası', limit: 6 }),
    );
    expect(retrieval.loadDhikrsByIds).toHaveBeenCalledWith(
      expect.arrayContaining([idMorning, idPrayer]),
    );
  });

  it('second gate: drops a referenced dhikr that fails DB re-verification', async () => {
    const { service, retrieval } = createHarness();
    const idOk = mkId();
    const idGone = mkId();
    retrieval.searchDhikrsByText.mockResolvedValue([
      candidate(idOk),
      candidate(idGone),
    ]);
    // idGone artık isVerified/isActive değil — ikinci kapıdan geçemez.
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(idOk)]);

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      const result = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: {
              free: [
                { ref: 'C1', target: 5 },
                { ref: 'C2', target: 5 },
              ],
            },
          },
        ],
      });
      expect(result).toEqual({ ok: true, phases: 1 });
      return Promise.resolve({ totalUsage: {}, steps: [{}] });
    });

    const outcome = await service.run(baseInput({ flowId: 'flow-3' }));

    expect(outcome.kind).toBe('program');
    if (outcome.kind !== 'program') throw new Error('unexpected');
    expect(outcome.phases[0].slots.free).toHaveLength(1);
    expect(outcome.phases[0].slots.free?.[0].dhikr._id.toString()).toBe(idOk);
  });

  it('throws AiInvalidOutputError when nothing survives the second DB gate', async () => {
    const { service, retrieval } = createHarness();
    retrieval.searchDhikrsByText.mockResolvedValue([candidate(mkId())]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([]);

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C1', target: 5 }] },
          },
        ],
      });
      return Promise.resolve({ totalUsage: {}, steps: [{}] });
    });

    await expect(
      service.run(baseInput({ flowId: 'flow-4' })),
    ).rejects.toMatchObject({ reason: 'invalid_output' });
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('gate: phases with a gap are rejected, model retries with corrected phases', async () => {
    const { service, retrieval } = createHarness();
    const id1 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValue([candidate(id1)]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      const bad = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 3,
            focus: 'f1',
            slots: { free: [{ ref: 'C1', target: 5 }] },
          },
          {
            // gün 4 boşta kalıyor — boşluksuz kaplama ihlali.
            fromDay: 5,
            toDay: 7,
            focus: 'f2',
            slots: { free: [{ ref: 'C1', target: 5 }] },
          },
        ],
      }) as { ok: boolean; error?: string };
      expect(bad.ok).toBe(false);
      expect(bad.error).toContain('boşluksuz');

      const good = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C1', target: 5 }] },
          },
        ],
      });
      expect(good).toEqual({ ok: true, phases: 1 });
      return Promise.resolve({ totalUsage: {}, steps: [{}, {}] });
    });

    const outcome = await service.run(baseInput({ flowId: 'flow-5' }));
    expect(outcome.kind).toBe('program');
    expect(generateTextMock).toHaveBeenCalledTimes(1);
  });

  it('gate: a slot outside the requested set is rejected', async () => {
    const { service, retrieval } = createHarness();
    const id1 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValue([candidate(id1)]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      const bad = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            // yalnızca 'free' istendi, model 'night' eklemiş.
            slots: { night: [{ ref: 'C1', target: 5 }] },
          },
        ],
      }) as { ok: boolean; error?: string };
      expect(bad.ok).toBe(false);
      expect(bad.error).toContain('night');

      const good = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C1', target: 5 }] },
          },
        ],
      });
      expect(good).toEqual({ ok: true, phases: 1 });
      return Promise.resolve({ totalUsage: {}, steps: [{}, {}] });
    });

    const outcome = await service.run(baseInput({ flowId: 'flow-6' }));
    expect(outcome.kind).toBe('program');
  });

  it('gate: a target exceeding the candidate row recommendedCount is rejected', async () => {
    const { service, retrieval } = createHarness();
    const id1 = mkId();
    retrieval.searchDhikrsByText.mockResolvedValue([
      candidate(id1, { recommendedCount: 10 }),
    ]);
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id1)]);

    generateTextMock.mockImplementationOnce((opts: BuildStepOptions) => {
      const bad = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C1', target: 500 }] },
          },
        ],
      }) as { ok: boolean; error?: string };
      expect(bad.ok).toBe(false);
      expect(bad.error).toContain('10');

      const good = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C1', target: 10 }] },
          },
        ],
      });
      expect(good).toEqual({ ok: true, phases: 1 });
      return Promise.resolve({ totalUsage: {}, steps: [{}, {}] });
    });

    const outcome = await service.run(baseInput({ flowId: 'flow-7' }));
    expect(outcome.kind).toBe('program');
  });

  it('re-search path: searchDhikrs excludes prior candidate ids + recentDhikrIds, then the tool gate closes', async () => {
    const { service, retrieval } = createHarness();
    const id1 = mkId();
    const id2 = mkId();
    retrieval.searchDhikrsByText.mockImplementation(
      (params: SearchByTextParams) =>
        Promise.resolve(
          params.query === 'yeni sorgu' ? [candidate(id2)] : [candidate(id1)],
        ),
    );
    retrieval.loadDhikrsByIds.mockResolvedValueOnce([dhikrLean(id2)]);

    let preparedAfterSearch: unknown;
    generateTextMock.mockImplementationOnce(async (opts: BuildStepOptions) => {
      await opts.tools.searchDhikrs.execute({
        query: 'yeni sorgu',
        why: 'ilk adaylar yetersiz',
      });
      preparedAfterSearch = opts.prepareStep({ steps: [{}] });

      const result = opts.tools.buildProgram.execute({
        title: 't',
        summary: 's',
        phases: [
          {
            fromDay: 1,
            toDay: 7,
            focus: 'f',
            slots: { free: [{ ref: 'C2', target: 5 }] },
          },
        ],
      });
      expect(result).toEqual({ ok: true, phases: 1 });
      return { totalUsage: {}, steps: [{}, {}] };
    });

    const outcome = await service.run(
      baseInput({ recentDhikrIds: ['recent-1'], flowId: 'flow-8' }),
    );

    expect(outcome.kind).toBe('program');
    expect(preparedAfterSearch).toEqual({
      activeTools: ['buildProgram'],
      toolChoice: 'required',
    });

    const searchCall = retrieval.searchDhikrsByText.mock.calls.find(
      (call) => call[0].query === 'yeni sorgu',
    );
    expect(searchCall?.[0].excludeIds).toEqual(
      expect.arrayContaining(['recent-1', id1]),
    );
  });

  it('provider failure: classifies a 503 APICallError as provider_error after retrying once', async () => {
    const { service, retrieval } = createHarness();
    retrieval.searchDhikrsByText.mockResolvedValue([candidate(mkId())]);
    generateTextMock.mockRejectedValue(
      apiCallError(503, 'service unavailable'),
    );

    await expect(
      service.run(baseInput({ flowId: 'flow-9' })),
    ).rejects.toMatchObject({ reason: 'provider_error', retryable: true });

    expect(generateTextMock).toHaveBeenCalledTimes(2);
  });
});
