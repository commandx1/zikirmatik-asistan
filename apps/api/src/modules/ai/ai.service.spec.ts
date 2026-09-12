import { Types } from 'mongoose';
import { AiService } from './ai.service';
import { AiPipelineError, AiRetrievalError } from './ai-errors';
import type { AgentOutcome } from './recommendation-agent.service';

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

function createHarness(options?: {
  agentOutcome?: AgentOutcome;
  agentError?: Error;
}) {
  const userId = new Types.ObjectId();
  const user = { _id: userId, isPremium: false };

  const progressGateway = { emitStep: jest.fn() };

  const createdRecommendation = { _id: new Types.ObjectId() };
  const aiRecommendationModel = {
    create: jest.fn(() => Promise.resolve(createdRecommendation)),
    find: jest.fn(() => chain(() => [])),
    findOne: jest.fn(() => chain(() => null)),
    findByIdAndUpdate: jest.fn(() => chain(() => null)),
  };

  const aiCreditsService = {
    computePromptHash: jest.fn(() => 'hash-123'),
    ensureCreditAccessForFlow: jest.fn(() => Promise.resolve()),
    debitCreditForFlow: jest.fn(() => Promise.resolve({ balance: 4 })),
  };

  const dhikrModel = {
    updateOne: jest.fn(() => ({ exec: () => Promise.resolve() })),
  };

  const userModel = {
    findById: jest.fn(() => ({
      lean: () => ({ exec: () => Promise.resolve(user) }),
    })),
    updateOne: jest.fn(() => ({ exec: () => Promise.resolve() })),
  };

  const retrievalService = {
    getRecentDhikrIds: jest.fn(() => Promise.resolve([])),
  };

  const agentError = options?.agentError;
  const recommendationAgent = {
    run: agentError
      ? jest.fn(() => Promise.reject(agentError))
      : jest.fn(() =>
          Promise.resolve(options?.agentOutcome ?? { kind: 'offTopic' }),
        ),
  };

  const flowLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const runtime = { flowLog: jest.fn(() => flowLogger) };

  const service = new AiService(
    progressGateway as never,
    aiRecommendationModel as never,
    aiCreditsService as never,
    dhikrModel as never,
    userModel as never,
    retrievalService as never,
    recommendationAgent as never,
    runtime as never,
  );

  return {
    service,
    userId,
    user,
    progressGateway,
    aiRecommendationModel,
    aiCreditsService,
    dhikrModel,
    userModel,
    retrievalService,
    recommendationAgent,
  };
}

function basePayload(userId: Types.ObjectId) {
  return {
    userId: userId.toString(),
    flowId: '11111111-1111-4111-8111-111111111111',
    freeText: 'canım sıkkın',
  };
}

describe('AiService.createRecommendation', () => {
  it('selected → persists, debits credit once, and returns kind "recommendations"', async () => {
    const dhikrId = new Types.ObjectId();
    const outcome: AgentOutcome = {
      kind: 'selected',
      summary: 'Sıcak bir özet.',
      sources: [],
      items: [
        {
          dhikr: {
            _id: dhikrId,
            name: { tr: 'Sübhanallah', en: 'Subhanallah' },
            nameArabic: 'سبحان الله',
            transliteration: { tr: 'subhanallah', en: 'subhanallah' },
            meaning: { tr: 'anlam', en: 'meaning' },
            virtue: { tr: 'fazilet', en: 'virtue' },
            source: { tr: 'kaynak', en: 'source' },
            recommendedCount: 33,
          } as never,
          reason: 'Bu zikir niyetine uygun.',
        },
      ],
    };

    const { service, userId, aiCreditsService, aiRecommendationModel } =
      createHarness({ agentOutcome: outcome });

    const result = await service.createRecommendation(
      basePayload(userId),
      'tr',
    );

    expect(result.kind).toBe('recommendations');
    expect(result.recommendedIds).toEqual([dhikrId.toString()]);
    expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledTimes(1);
    expect(aiRecommendationModel.create).toHaveBeenCalledTimes(1);
    expect((result as { remainingCredits: number }).remainingCredits).toBe(4);
  });

  it('clarification → no debit, response carries needsClarification + legacy suggestedCategories', async () => {
    const { service, userId, aiCreditsService, aiRecommendationModel } =
      createHarness({
        agentOutcome: { kind: 'clarification', question: 'Hangi konuda?' },
      });

    const result = await service.createRecommendation(
      basePayload(userId),
      'tr',
    );

    expect(result).toMatchObject({
      kind: 'clarification',
      needsClarification: true,
      message: 'Hangi konuda?',
      suggestedCategories: [],
      recommendedIds: [],
      items: [],
    });
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    expect(aiRecommendationModel.create).not.toHaveBeenCalled();
  });

  it('offTopic → no debit, response carries the localized off-topic message', async () => {
    const { service, userId, aiCreditsService, aiRecommendationModel } =
      createHarness({ agentOutcome: { kind: 'offTopic' } });

    const result = await service.createRecommendation(
      basePayload(userId),
      'tr',
    );

    expect(result).toMatchObject({
      kind: 'offTopic',
      offTopic: true,
      recommendedIds: [],
      items: [],
    });
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    expect(aiRecommendationModel.create).not.toHaveBeenCalled();
  });

  it('agent throws AiPipelineError → propagates it, without debiting (access check still ran once)', async () => {
    const agentError = new AiRetrievalError(
      'retrieval_failed',
      'Aday zikir bulunamadı',
    );
    const { service, userId, aiCreditsService } = createHarness({
      agentError,
    });

    await expect(
      service.createRecommendation(basePayload(userId), 'tr'),
    ).rejects.toBe(agentError);

    expect(agentError).toBeInstanceOf(AiPipelineError);
    expect(aiCreditsService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
  });
});
