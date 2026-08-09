import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { generateObject, generateText } from 'ai';
import { AiChatService } from './ai-chat.service';

// Vercel AI SDK'sı ağ çağrısı yaptığı için mock'lanır: böylece
// classifyIntent → retrieval → prompt seçimi zinciri gerçek kodla,
// LLM cevabı ise deterministik olarak test edilebilir.
jest.mock('ai', () => ({
  generateObject: jest.fn(),
  generateText: jest.fn(),
  streamText: jest.fn(),
  stepCountIs: jest.fn(() => 'stop-condition'),
}));

jest.mock('@ai-sdk/openai', () => ({
  createOpenAI: jest.fn(() => (modelId: string) => ({ modelId })),
}));

const generateObjectMock = generateObject as unknown as jest.Mock;
const generateTextMock = generateText as unknown as jest.Mock;

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

function createHarness(options: { withApiKey?: boolean } = {}) {
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

  const aiService = {
    ensureCreditAccessForFlow: jest.fn(() => Promise.resolve()),
    debitCreditForFlow: jest.fn(() => Promise.resolve({ balance: 4 })),
    searchSourcePassagesForAgent: jest.fn(() => Promise.resolve([])),
  };

  const progressGateway = { emitChatStep: jest.fn() };
  // withApiKey=false → OPENAI_API_KEY yok, agent fallback metnine düşer ve
  // LLM/retrieval hiç çalışmaz (kredi/sahiplik testleri bu yolu kullanır).
  const configService = {
    get: jest.fn((key: string) =>
      key === 'OPENAI_API_KEY' && options.withApiKey ? 'test-key' : undefined,
    ),
  };
  const usageService = { record: jest.fn(() => Promise.resolve()) };

  const service = new AiChatService(
    progressGateway as never,
    configService as never,
    aiService as never,
    usageService as never,
    conversationModel as never,
    messageModel as never,
    userModel as never,
  );

  return {
    service,
    user,
    conversations,
    messages,
    aiService,
    conversationModel,
    progressGateway,
  };
}

/** classifyIntent'in döneceği modu ve LLM cevabını sabitler. */
function stubAgent(intent: { mode: 'chat' | 'bilgi'; searchQuery: string }) {
  generateObjectMock.mockResolvedValue({ object: intent, usage: {} });
  generateTextMock.mockResolvedValue({
    text: 'Deterministik test cevabı.',
    totalUsage: {},
    steps: [],
  });
}

describe('AiChatService', () => {
  beforeEach(() => {
    generateObjectMock.mockReset();
    generateTextMock.mockReset();
  });

  it('debits exactly one credit per createConversation call', async () => {
    const { service, user, aiService } = createHarness();

    await service.createConversation(user._id.toString(), {
      firstMessage: 'Bugün çok üzgünüm, ne okuyayım?',
    });

    expect(aiService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiService.debitCreditForFlow).toHaveBeenCalledTimes(1);
    expect(aiService.debitCreditForFlow).toHaveBeenCalledWith(
      user._id,
      expect.any(String),
      false,
      expect.any(String),
      'CHAT_MESSAGE_DEBIT',
    );
  });

  it('debits exactly one credit per sendMessage call', async () => {
    const { service, user, aiService } = createHarness();

    const { conversation } = await service.createConversation(
      user._id.toString(),
      { firstMessage: 'Selam' },
    );

    aiService.debitCreditForFlow.mockClear();
    aiService.ensureCreditAccessForFlow.mockClear();

    await service.sendMessage(
      user._id.toString(),
      conversation!._id.toString(),
      {
        message: 'Sabır için ne okuyayım?',
      },
    );

    expect(aiService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiService.debitCreditForFlow).toHaveBeenCalledTimes(1);
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
      const { service, user, aiService } = createHarness({ withApiKey: true });
      stubAgent({
        mode: 'bilgi',
        searchQuery: 'oruçluyken sakız çiğnemek orucu bozar mı',
      });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'sakız orucu bozar mı',
      });

      expect(aiService.searchSourcePassagesForAgent).toHaveBeenCalledTimes(1);
      // Ham kullanıcı mesajı değil, bağlamdan arındırılmış sorgu kullanılmalı.
      expect(aiService.searchSourcePassagesForAgent).toHaveBeenCalledWith(
        'oruçluyken sakız çiğnemek orucu bozar mı',
        6,
      );
    });

    it("does not search source passages in 'chat' mode", async () => {
      const { service, user, aiService } = createHarness({ withApiKey: true });
      stubAgent({ mode: 'chat', searchQuery: '' });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'selam, bugün çok yorgunum',
      });

      expect(aiService.searchSourcePassagesForAgent).not.toHaveBeenCalled();
    });

    it("falls back to 'bilgi' with the raw message when classification fails", async () => {
      const { service, user, aiService } = createHarness({ withApiKey: true });
      generateObjectMock.mockRejectedValue(new Error('timeout'));
      generateTextMock.mockResolvedValue({
        text: 'Deterministik test cevabı.',
        totalUsage: {},
        steps: [],
      });

      await service.createConversation(user._id.toString(), {
        firstMessage: 'abdest nasıl alınır',
      });

      expect(aiService.searchSourcePassagesForAgent).toHaveBeenCalledWith(
        'abdest nasıl alınır',
        6,
      );
    });

    it("attaches source citations in 'bilgi' mode and never returns dhikr recommendations", async () => {
      const { service, user, aiService } = createHarness({ withApiKey: true });
      stubAgent({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      aiService.searchSourcePassagesForAgent.mockResolvedValue([
        {
          sourceId: 'muhtasar-ilmihal',
          sourceTitle: 'Muhtasar İlmihal',
          sectionHeading: 'Abdest',
          text: 'Abdestin farzları...',
          pageStart: 40,
          pageEnd: 41,
          type: 'ilmihal',
        },
      ] as never);

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
      const { service, user, aiService } = createHarness({ withApiKey: true });
      stubAgent({ mode: 'bilgi', searchQuery: 'abdestin farzları' });
      aiService.searchSourcePassagesForAgent.mockResolvedValue([
        {
          sourceId: 'muhtasar-ilmihal',
          sourceTitle: 'Muhtasar İlmihal',
          sectionHeading: 'Abdest',
          text: 'BENZERSIZ_PASAJ_METNI',
          pageStart: 40,
          pageEnd: 41,
          type: 'ilmihal',
        },
      ] as never);

      await service.createConversation(user._id.toString(), {
        firstMessage: 'abdestin farzları nelerdir',
      });

      const [firstCallArgs] = generateTextMock.mock.calls as Array<
        [{ system: string }]
      >;
      const systemPrompt = firstCallArgs[0].system;
      expect(systemPrompt).toContain('BENZERSIZ_PASAJ_METNI');
      expect(systemPrompt).toContain('Muhtasar İlmihal — Abdest, s. 40-41');
      // Öneri talimatları prompt'tan tamamen çıkmış olmalı.
      expect(systemPrompt).not.toContain('ADAYLAR');
      expect(systemPrompt).not.toContain('attachRecommendations');
    });
  });
});
