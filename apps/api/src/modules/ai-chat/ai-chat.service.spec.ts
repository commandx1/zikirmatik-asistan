import { EventEmitter } from 'node:events';
import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { generateObject, generateText, streamText } from 'ai';
import type { Request, Response } from 'express';
import { AiPipelineError, classifyAiError } from '../ai/ai-errors';
import { AiChatService } from './ai-chat.service';

// Vercel AI SDK'sı ağ çağrısı yaptığı için mock'lanır: böylece
// classifyIntent → retrieval → prompt seçimi zinciri gerçek kodla,
// LLM cevabı ise deterministik olarak test edilebilir. ai-errors.ts da bu
// modülden sınıf isimleri import ettiği için (APICallError, RetryError vb.)
// classifyAiError'ın çökmemesi için sahte (her zaman false dönen) isInstance
// implementasyonları sağlanır.
jest.mock('ai', () => {
  class FakeAiError extends Error {
    static isInstance(): boolean {
      return false;
    }
  }

  return {
    generateObject: jest.fn(),
    generateText: jest.fn(),
    streamText: jest.fn(),
    stepCountIs: jest.fn(() => 'stop-condition'),
    Output: {
      object: (spec: unknown) => spec,
      text: () => ({}),
    },
    APICallError: FakeAiError,
    RetryError: FakeAiError,
    NoObjectGeneratedError: FakeAiError,
    NoOutputGeneratedError: FakeAiError,
    InvalidToolInputError: FakeAiError,
    JSONParseError: FakeAiError,
    TypeValidationError: FakeAiError,
  };
});

const generateObjectMock = generateObject as unknown as jest.Mock;
const generateTextMock = generateText as unknown as jest.Mock;
const streamTextMock = streamText as unknown as jest.Mock;

type ConversationDoc = {
  _id: Types.ObjectId;
  userId: Types.ObjectId;
  title: string;
  status: string;
  lastMessageAt: Date;
  locale: string;
};

type MessageDoc = {
  _id: Types.ObjectId;
  conversationId: Types.ObjectId;
  userId: Types.ObjectId;
  role: 'user' | 'assistant';
  content: string;
  usedModel?: string;
  mode?: string;
  coverage?: string;
  sourceCitations?: Array<{
    sourceId: string;
    sourceTitle: string;
    pageStart: number;
    pageEnd: number;
  }>;
  createdAt: Date;
};

function chain<T>(resolve: () => T) {
  const api = {
    sort: () => api,
    skip: () => api,
    limit: () => api,
    select: () => api,
    lean: () => api,
    exec: () => Promise.resolve(resolve()),
  };
  return api;
}

function createHarness() {
  const conversations: ConversationDoc[] = [];
  const messages: MessageDoc[] = [];

  const conversationModel = {
    create: jest.fn((payload: Partial<ConversationDoc>) => {
      const doc: ConversationDoc = {
        _id: new Types.ObjectId(),
        userId: payload.userId!,
        title: payload.title!,
        status: payload.status ?? 'active',
        lastMessageAt: payload.lastMessageAt ?? new Date(),
        locale: payload.locale ?? 'tr',
      };
      conversations.push(doc);
      return Promise.resolve(doc);
    }),
    findOne: jest.fn(
      (filter: { _id: Types.ObjectId; userId: Types.ObjectId }) =>
        chain(
          () =>
            conversations.find(
              (c) => c._id.equals(filter._id) && c.userId.equals(filter.userId),
            ) ?? null,
        ),
    ),
    findById: jest.fn((id: Types.ObjectId) =>
      chain(() => conversations.find((c) => c._id.equals(id)) ?? null),
    ),
    find: jest.fn((filter: { userId: Types.ObjectId }) =>
      chain(() => conversations.filter((c) => c.userId.equals(filter.userId))),
    ),
    countDocuments: jest.fn((filter: { userId: Types.ObjectId }) =>
      chain(
        () =>
          conversations.filter((c) => c.userId.equals(filter.userId)).length,
      ),
    ),
    updateOne: jest.fn(
      (
        filter: { _id: Types.ObjectId },
        update: { $set?: Partial<ConversationDoc> },
      ) => ({
        exec: () => {
          const doc = conversations.find((c) => c._id.equals(filter._id));
          if (doc && update.$set) Object.assign(doc, update.$set);
          return Promise.resolve({ acknowledged: true });
        },
      }),
    ),
  };

  const messageModel = {
    create: jest.fn((payload: Partial<MessageDoc>) => {
      const doc: MessageDoc = {
        _id: new Types.ObjectId(),
        conversationId: payload.conversationId!,
        userId: payload.userId!,
        role: payload.role!,
        content: payload.content!,
        usedModel: payload.usedModel,
        mode: payload.mode,
        coverage: payload.coverage,
        sourceCitations: payload.sourceCitations,
        createdAt: new Date(),
      };
      messages.push(doc);
      return Promise.resolve(doc);
    }),
    find: jest.fn((filter: { conversationId: Types.ObjectId }) =>
      chain(() =>
        messages
          .filter((m) => m.conversationId.equals(filter.conversationId))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime()),
      ),
    ),
    countDocuments: jest.fn((filter: { conversationId: Types.ObjectId }) =>
      chain(
        () =>
          messages.filter((m) => m.conversationId.equals(filter.conversationId))
            .length,
      ),
    ),
  };

  const user = { _id: new Types.ObjectId(), isPremium: false };
  const userModel = {
    findById: jest.fn(() => ({
      lean: () => ({ exec: () => Promise.resolve(user) }),
    })),
  };

  const retrievalService = {
    searchSourcePassages: jest.fn(() => Promise.resolve([])),
  };

  const aiCreditsService = {
    ensureCreditAccessForFlow: jest.fn(() => Promise.resolve()),
    debitCreditForFlow: jest.fn(() => Promise.resolve({ balance: 4 })),
  };

  const progressGateway = { emitChatStep: jest.fn() };

  // AI_CHAT_PASSAGE_LIMIT gibi ortam değişkenleri okunmadığında varsayılana
  // (CHAT_PASSAGE_LIMIT_DEFAULT=6) düşülür.
  const configService = { get: jest.fn(() => undefined) };

  const usageService = { record: jest.fn(() => Promise.resolve()) };

  // withAiRetry'nin gerçek davranışını (tek deneme + hatayı her zaman
  // AiPipelineError olarak fırlatma) taklit eder — retry sayısı testler için
  // önemli değil, önemli olan hatanın her zaman sınıflandırılmış dönmesi.
  const aiRuntimeService = {
    model: jest.fn(() => 'model'),
    modelName: jest.fn(() => 'model-name'),
    settings: jest.fn(() => ({})),
    withAiRetry: jest.fn(
      async (_label: string, fn: (attempt: number) => Promise<unknown>) => {
        try {
          return await fn(1);
        } catch (rawError) {
          throw classifyAiError(rawError);
        }
      },
    ),
    flowLog: jest.fn(() => ({
      log: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    })),
  };

  const service = new AiChatService(
    progressGateway as never,
    configService as never,
    aiRuntimeService as never,
    aiCreditsService as never,
    usageService as never,
    retrievalService as never,
    conversationModel as never,
    messageModel as never,
    userModel as never,
  );

  return {
    service,
    user,
    conversations,
    messages,
    retrievalService,
    aiCreditsService,
    conversationModel,
    progressGateway,
    aiRuntimeService,
  };
}

/** classifyIntent'in döneceği modu/sorguyu sabitler. */
function stubClassify(intent: { mode: 'chat' | 'bilgi'; searchQuery: string }) {
  generateObjectMock.mockResolvedValue({ object: intent, usage: {} });
}

/** mode='chat' için deterministik generateText cevabı. */
function stubChatAnswer(text = 'Deterministik test cevabı.') {
  generateTextMock.mockResolvedValue({ text, totalUsage: {}, steps: [] });
}

/** mode='bilgi' için deterministik generateText yapılandırılmış çıktısı. */
function stubBilgiAnswer(output: {
  coverage: 'full' | 'partial' | 'none';
  usedPassages: string[];
  answer: string;
}) {
  generateTextMock.mockResolvedValue({
    output,
    text: '',
    totalUsage: {},
    steps: [],
  });
}

function samplePassage(overrides: Partial<Record<string, unknown>> = {}) {
  return {
    sourceId: 'muhtasar-ilmihal',
    sourceTitle: 'Muhtasar İlmihal',
    sectionHeading: 'Abdest',
    text: 'BENZERSIZ_PASAJ_METNI',
    pageStart: 40,
    pageEnd: 41,
    type: 'ilmihal',
    ...overrides,
  };
}

function createFakeRes() {
  const res: {
    headersSent: boolean;
    writableEnded: boolean;
    statusCode?: number;
    setHeader: jest.Mock;
    flushHeaders: jest.Mock;
    write: jest.Mock;
    end: jest.Mock;
    status: jest.Mock;
    json: jest.Mock;
  } = {
    headersSent: false,
    writableEnded: false,
    setHeader: jest.fn(),
    flushHeaders: jest.fn(),
    write: jest.fn(() => true),
    end: jest.fn(),
    status: jest.fn(),
    json: jest.fn(),
  };
  res.status.mockImplementation(() => res);
  res.json.mockImplementation(() => res);
  res.end.mockImplementation(() => {
    res.writableEnded = true;
  });
  return res as unknown as Response & typeof res;
}

function createFakeReq() {
  return new EventEmitter() as unknown as Request;
}

/** writeSse'nin ürettiği event/data çiftlerini res.write çağrılarından ayrıştırır. */
function collectSseEvents(res: {
  write: jest.Mock;
}): Array<{ event: string; data: unknown }> {
  const calls = res.write.mock.calls.map((c: unknown[]) => c[0] as string);
  const events: Array<{ event: string; data: unknown }> = [];
  for (let i = 0; i < calls.length; i += 2) {
    const eventLine = calls[i] ?? '';
    const dataLine = calls[i + 1] ?? '';
    const event = eventLine.replace(/^event: /, '').trim();
    const jsonText = dataLine.replace(/^data: /, '').trim();
    events.push({ event, data: jsonText ? JSON.parse(jsonText) : undefined });
  }
  return events;
}

/**
 * `partialOutputStream` hata fırlattığı testlerde `result.output` hiç
 * `await` edilmez — ama Promise.reject(...) hemen oluşturulduğu için Node
 * bunu "unhandled rejection" sayıp süreci çökertir. Burada baştan bir
 * no-op `.catch` ekleyerek bunu bastırıyoruz; kod gerçekten `await` ederse
 * reddedilme aynen yayılır.
 */
function neverResolves(error: Error): Promise<never> {
  const promise = Promise.reject<never>(error);
  promise.catch(() => {});
  return promise;
}

function asyncIterableFrom<T>(items: T[], errorAfter?: Error) {
  return {
    [Symbol.asyncIterator]() {
      let i = 0;
      return {
        next(): Promise<IteratorResult<T>> {
          if (i < items.length) {
            const value = items[i++];
            return Promise.resolve({ value, done: false });
          }
          if (errorAfter) {
            return Promise.reject<IteratorResult<T>>(errorAfter);
          }
          return Promise.resolve({ value: undefined as never, done: true });
        },
      };
    },
  };
}

describe('AiChatService', () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
    generateTextMock.mockReset();
    streamTextMock.mockReset();
    // Varsayılan: sınıflandırma 'chat' döner, arama/pasaj akışı hiç
    // tetiklenmez — kredi/sahiplik/başlık testleri bu yolu kullanır.
    stubClassify({ mode: 'chat', searchQuery: '' });
    stubChatAnswer();
  });

  it('debits exactly one credit per createConversation call', async () => {
    const { service, user, aiCreditsService } = createHarness();

    await service.createConversation(user._id.toString(), {
      firstMessage: 'Bugün çok üzgünüm, ne okuyayım?',
    });

    expect(aiCreditsService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledTimes(1);
    expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledWith(
      user._id,
      expect.any(String),
      false,
      expect.any(String),
      'CHAT_MESSAGE_DEBIT',
    );
  });

  it('debits exactly one credit per sendMessage call', async () => {
    const { service, user, aiCreditsService } = createHarness();

    const { conversation } = await service.createConversation(
      user._id.toString(),
      { firstMessage: 'Selam' },
    );

    aiCreditsService.debitCreditForFlow.mockClear();
    aiCreditsService.ensureCreditAccessForFlow.mockClear();

    await service.sendMessage(
      user._id.toString(),
      conversation!._id.toString(),
      {
        message: 'Sabır için ne okuyayım?',
      },
    );

    expect(aiCreditsService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledTimes(1);
  });

  it('throws 404 when sending a message to a conversation owned by another user', async () => {
    const { service, user } = createHarness();

    const { conversation } = await service.createConversation(
      user._id.toString(),
      { firstMessage: 'Selam' },
    );

    const otherUserId = new Types.ObjectId().toString();

    await expect(
      service.sendMessage(otherUserId, conversation!._id.toString(), {
        message: 'başka birinin sohbeti',
      }),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('throws 404 when listing messages of a conversation owned by another user', async () => {
    const { service, user } = createHarness();

    const { conversation } = await service.createConversation(
      user._id.toString(),
      { firstMessage: 'Selam' },
    );

    const otherUserId = new Types.ObjectId().toString();

    await expect(
      service.listMessages(otherUserId, conversation!._id.toString(), 1, 20),
    ).rejects.toBeInstanceOf(NotFoundException);
  });

  it('generates a title truncated to ~60 chars from the first message', async () => {
    const { service, user, conversations } = createHarness();

    const longMessage =
      'Bu çok uzun bir ilk mesaj örneğidir ve altmış karakteri kesinlikle aşacak şekilde yazılmıştır, devam ediyor.';

    await service.createConversation(user._id.toString(), {
      firstMessage: longMessage,
    });

    expect(conversations).toHaveLength(1);
    expect(conversations[0].title.length).toBeLessThanOrEqual(61); // 60 + '…'
    expect(conversations[0].title.endsWith('…')).toBe(true);
  });

  it('keeps the full title when the first message is short', async () => {
    const { service, user, conversations } = createHarness();

    await service.createConversation(user._id.toString(), {
      firstMessage: 'Kısa mesaj',
    });

    expect(conversations[0].title).toBe('Kısa mesaj');
  });

  describe('retrieval routing', () => {
    it("searches source passages in 'bilgi' mode using the classifier's rewritten query", async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({
        mode: 'bilgi',
        searchQuery: 'oruçluyken sakız çiğnemek orucu bozar mı',
      });
      stubBilgiAnswer({
        coverage: 'none',
        usedPassages: [],
        answer: 'Bu konuda elimde kaynak yok, bir alime danışmanı öneririm.',
      });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'sakız orucu bozar mı',
      });

      expect(retrievalService.searchSourcePassages).toHaveBeenCalledTimes(1);
      // Ham kullanıcı mesajı değil, bağlamdan arındırılmış sorgu kullanılmalı.
      expect(retrievalService.searchSourcePassages).toHaveBeenCalledWith(
        'oruçluyken sakız çiğnemek orucu bozar mı',
        6,
        { flowId: expect.any(String) as string, userId: user._id.toString() },
      );
    });

    it("does not search source passages in 'chat' mode", async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'chat', searchQuery: '' });
      stubChatAnswer();

      await service.createConversation(user._id.toString(), {
        firstMessage: 'selam, bugün çok yorgunum',
      });

      expect(retrievalService.searchSourcePassages).not.toHaveBeenCalled();
    });

    it('throws AiPipelineError and persists nothing when classification fails', async () => {
      const { service, user, conversations, messages, aiCreditsService } =
        createHarness();
      generateObjectMock.mockRejectedValue(new Error('timeout'));

      await expect(
        service.createConversation(user._id.toString(), {
          firstMessage: 'abdest nasıl alınır',
        }),
      ).rejects.toBeInstanceOf(AiPipelineError);

      expect(conversations).toHaveLength(0);
      expect(messages).toHaveLength(0);
      expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    });

    it("attaches source citations in 'bilgi' mode and never returns dhikr recommendations", async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'full',
        usedPassages: ['P1'],
        answer: 'Abdestin farzları şunlardır...',
      });

      const result = await service.createConversation(user._id.toString(), {
        firstMessage: 'abdestin farzları nelerdir',
      });

      const reply = result.messages[1];
      expect(reply.sourceCitations).toEqual([
        {
          sourceId: 'muhtasar-ilmihal',
          sourceTitle: 'Muhtasar İlmihal',
          pageStart: 40,
          pageEnd: 41,
        },
      ]);
      expect(reply).not.toHaveProperty('recommendedDhikrs');
    });

    it('grounds the system prompt on the retrieved passages', async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'full',
        usedPassages: ['P1'],
        answer: 'Abdestin farzları şunlardır...',
      });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'abdestin farzları nelerdir',
      });

      const [firstCallArgs] = generateTextMock.mock.calls as Array<
        [{ system: string }]
      >;
      const systemPrompt = firstCallArgs[0].system;
      expect(systemPrompt).toContain('BENZERSIZ_PASAJ_METNI');
      expect(systemPrompt).toContain('Muhtasar İlmihal — Abdest, s. 40-41');
      expect(systemPrompt).toContain('#P1 [');
      // Öneri talimatları prompt'tan tamamen çıkmış olmalı.
      expect(systemPrompt).not.toContain('ADAYLAR');
      expect(systemPrompt).not.toContain('attachRecommendations');
    });

    it('orders KAYNAK PASAJLARI < SON HATIRLATMA < ÇIKTI ALANLARI in the bilgi system prompt', async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'full',
        usedPassages: ['P1'],
        answer: 'Abdestin farzları şunlardır...',
      });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'abdestin farzları nelerdir',
      });

      const [firstCallArgs] = generateTextMock.mock.calls as Array<
        [{ system: string }]
      >;
      const systemPrompt = firstCallArgs[0].system;

      const kaynakIdx = systemPrompt.indexOf('KAYNAK PASAJLARI');
      const sonIdx = systemPrompt.indexOf('SON HATIRLATMA');
      const ciktiIdx = systemPrompt.indexOf('ÇIKTI ALANLARI');

      expect(kaynakIdx).toBeGreaterThan(-1);
      expect(sonIdx).toBeGreaterThan(kaynakIdx);
      expect(ciktiIdx).toBeGreaterThan(sonIdx);
    });
  });

  describe('coverage/citation consistency (bilgi mode)', () => {
    it("returns empty citations when coverage is 'none'", async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'kripto para caiz mi' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'none',
        usedPassages: [],
        answer: 'Bu konuda elimde kaynak yok, bir alime danışmalısın.',
      });

      const result = await service.createConversation(user._id.toString(), {
        firstMessage: 'kripto para caiz mi',
      });

      const reply = result.messages[1];
      expect(reply.coverage).toBe('none');
      expect(reply.sourceCitations).toEqual([]);
    });

    it("downgrades coverage to 'none' when usedPassages references an unknown passage", async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'full',
        usedPassages: ['P9'],
        answer: 'Abdestin farzları şunlardır...',
      });

      const result = await service.createConversation(user._id.toString(), {
        firstMessage: 'abdestin farzları nelerdir',
      });

      const reply = result.messages[1];
      expect(reply.sourceCitations).toEqual([]);
      expect(reply.coverage).toBe('none');
    });

    it('sanitizes stray passage refs out of the answer text', async () => {
      const { service, user, retrievalService } = createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'sakız orucu bozar mı' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);
      stubBilgiAnswer({
        coverage: 'none',
        usedPassages: [],
        answer: 'Bozmaz (P2).',
      });

      const result = await service.createConversation(user._id.toString(), {
        firstMessage: 'sakız orucu bozar mı',
      });

      const reply = result.messages[1];
      expect(reply.content).toBe('Bozmaz.');
    });
  });

  describe('streamCreateConversation (SSE)', () => {
    it('writes an AI_UNAVAILABLE error event and persists nothing when the stream fails before any token', async () => {
      const { service, user, conversations, messages, aiCreditsService } =
        createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });

      streamTextMock.mockReturnValue({
        partialOutputStream: asyncIterableFrom([], new Error('provider down')),
        output: neverResolves(new Error('never reached')),
      });

      const res = createFakeRes();
      const req = createFakeReq();

      await service.streamCreateConversation(
        user._id.toString(),
        { firstMessage: 'abdestin farzları nelerdir' },
        req,
        res,
      );

      const events = collectSseEvents(res);
      const errorEvent = events.find((e) => e.event === 'error');
      expect(errorEvent).toBeDefined();
      expect((errorEvent!.data as { code: string }).code).toBe(
        'AI_UNAVAILABLE',
      );

      expect(conversations).toHaveLength(0);
      expect(messages).toHaveLength(0);
      expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    });

    it('writes tokens then an error when the stream fails mid-way, without persisting or debiting', async () => {
      const { service, user, conversations, messages, aiCreditsService } =
        createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'abdestin farzları' });

      streamTextMock.mockReturnValue({
        partialOutputStream: asyncIterableFrom(
          [{ coverage: 'full', usedPassages: ['P1'], answer: 'Sakız ' }],
          new Error('connection reset'),
        ),
        output: neverResolves(new Error('never reached')),
      });

      const res = createFakeRes();
      const req = createFakeReq();

      await service.streamCreateConversation(
        user._id.toString(),
        { firstMessage: 'abdestin farzları nelerdir' },
        req,
        res,
      );

      const events = collectSseEvents(res);
      expect(events.some((e) => e.event === 'token')).toBe(true);
      const errorEvent = events.find((e) => e.event === 'error');
      expect(errorEvent).toBeDefined();
      expect((errorEvent!.data as { code: string }).code).toBe(
        'AI_UNAVAILABLE',
      );

      expect(conversations).toHaveLength(0);
      expect(messages).toHaveLength(0);
      expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    });

    it('streams partial answer deltas and finishes with a done event carrying content/coverage/mode/citations', async () => {
      const { service, user, retrievalService, aiCreditsService } =
        createHarness();
      stubClassify({ mode: 'bilgi', searchQuery: 'sakız orucu bozar mı' });
      retrievalService.searchSourcePassages.mockResolvedValue([
        samplePassage(),
      ] as never);

      streamTextMock.mockReturnValue({
        partialOutputStream: asyncIterableFrom([
          { coverage: 'full' },
          { coverage: 'full', usedPassages: ['P1'], answer: 'Sak' },
          { coverage: 'full', usedPassages: ['P1'], answer: 'Sakız bozmaz' },
        ]),
        output: Promise.resolve({
          coverage: 'full',
          usedPassages: ['P1'],
          answer: 'Sakız bozmaz',
        }),
      });

      const res = createFakeRes();
      const req = createFakeReq();

      await service.streamCreateConversation(
        user._id.toString(),
        { firstMessage: 'sakız orucu bozar mı' },
        req,
        res,
      );

      const events = collectSseEvents(res);
      const tokens = events
        .filter((e) => e.event === 'token')
        .map((e) => (e.data as { delta: string }).delta);
      expect(tokens).toEqual(['Sak', 'ız bozmaz']);

      const doneEvent = events.find((e) => e.event === 'done');
      expect(doneEvent).toBeDefined();
      const done = doneEvent!.data as {
        content: string;
        coverage: string;
        mode: string;
        sourceCitations: unknown[];
      };
      expect(done.content).toBe('Sakız bozmaz');
      expect(done.coverage).toBe('full');
      expect(done.mode).toBe('bilgi');
      expect(done.sourceCitations).toEqual([
        {
          sourceId: 'muhtasar-ilmihal',
          sourceTitle: 'Muhtasar İlmihal',
          pageStart: 40,
          pageEnd: 41,
        },
      ]);
      expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledTimes(1);
    });
  });
});
