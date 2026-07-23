import { NotFoundException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AiChatService } from './ai-chat.service';

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
  recommendedDhikrIds?: Types.ObjectId[];
  usedModel?: string;
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
        recommendedDhikrIds: payload.recommendedDhikrIds ?? [],
        usedModel: payload.usedModel,
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

  const dhikrModel = {
    find: jest.fn(() => chain(() => [])),
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
    searchDhikrsForAgent: jest.fn(() => Promise.resolve([])),
  };

  const progressGateway = { emitChatStep: jest.fn() };
  const configService = { get: jest.fn(() => undefined) }; // no OPENAI_API_KEY → agent falls back
  const usageService = { record: jest.fn(() => Promise.resolve()) };

  const service = new AiChatService(
    progressGateway as never,
    configService as never,
    aiService as never,
    usageService as never,
    conversationModel as never,
    messageModel as never,
    dhikrModel as never,
    userModel as never,
  );

  return {
    service,
    user,
    conversations,
    messages,
    aiService,
    conversationModel,
  };
}

describe('AiChatService', () => {
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
});
