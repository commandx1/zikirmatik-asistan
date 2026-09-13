import { ForbiddenException } from '@nestjs/common';
import { Types } from 'mongoose';
import { AiVirdService } from './ai-vird.service';
import { AiPipelineError, AiRetrievalError } from './ai-errors';
import { OFF_TOPIC_MESSAGE } from './prompts';
import type { VirdAgentOutcome } from './vird-program-agent.service';
import type { CreateAiVirdProgramDto } from './dto/create-ai-vird-program.dto';

function chain<T>(resolve: () => T) {
  const api = {
    lean: () => api,
    exec: () => Promise.resolve(resolve()),
  };
  return api;
}

function basePayload(): CreateAiVirdProgramDto {
  return {
    flowId: '11111111-1111-4111-8111-111111111111',
    freeText: 'sınav dönemindeyim çok kaygılıyım',
    durationDays: 7,
    slots: ['morning', 'evening'],
  };
}

function createHarness(options?: {
  agentOutcome?: VirdAgentOutcome;
  agentError?: Error;
  existingDraft?: Record<string, unknown> | null;
}) {
  const userId = new Types.ObjectId();
  const user = { _id: userId, isPremium: false };

  const userModel = {
    findById: jest.fn(() => chain(() => user)),
  };

  const aiCreditsService = {
    computePromptHash: jest.fn(() => 'hash-123'),
    ensureCreditAccessForFlow: jest.fn(() => Promise.resolve()),
    debitCreditForFlow: jest.fn(() => Promise.resolve({ balance: 7 })),
    getCredits: jest.fn(() =>
      Promise.resolve({
        balance: 10,
        isPremium: false,
        dailyGrant: 1,
        monthlyGrant: 0,
      }),
    ),
  };

  const flowLogger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
    debug: jest.fn(),
  };
  const runtime = { flowLog: jest.fn(() => flowLogger) };

  const retrievalService = {
    getRecentDhikrIds: jest.fn(() => Promise.resolve([])),
    loadDhikrsByIds: jest.fn(() => Promise.resolve([])),
  };

  const agentError = options?.agentError;
  const agent = {
    run: agentError
      ? jest.fn(() => Promise.reject(agentError))
      : jest.fn(() =>
          Promise.resolve(options?.agentOutcome ?? { kind: 'offTopic' }),
        ),
  };

  const createdDraft = {
    _id: new Types.ObjectId(),
    title: { tr: 'Sınav Virdi', en: 'Sınav Virdi' },
    dayCount: 7,
    phases: [],
    ai: {
      flowId: basePayload().flowId,
      intent: 'sınav kaygısı',
      durationDays: 7,
      summary: 'Bu zor günlerde Allah’a sığınmak güzel.',
    },
  };

  const findAiDraftByFlowId = jest.fn<
    Promise<Record<string, unknown> | null>,
    [string, string]
  >();
  findAiDraftByFlowId.mockResolvedValue(options?.existingDraft ?? null);

  const createAiDraft = jest.fn<
    Promise<typeof createdDraft>,
    [Record<string, unknown>]
  >();
  createAiDraft.mockResolvedValue(createdDraft);

  const virdProgramsService = { findAiDraftByFlowId, createAiDraft };

  const service = new AiVirdService(
    userModel as never,
    aiCreditsService as never,
    runtime as never,
    retrievalService as never,
    agent as never,
    virdProgramsService as never,
  );

  return {
    service,
    userId,
    user,
    userModel,
    aiCreditsService,
    retrievalService,
    agent,
    virdProgramsService,
    createdDraft,
  };
}

describe('AiVirdService.createVirdProgram', () => {
  it('program → persists an AI draft, debits VIRD_PROGRAM_DEBIT with amount=3, returns preview + remainingCredits', async () => {
    const dhikrId = new Types.ObjectId();
    const outcome: VirdAgentOutcome = {
      kind: 'program',
      title: 'Sınav Virdi',
      summary: 'Bu zor günlerde Allah’a sığınmak güzel.',
      expandedQuery: 'sınav kaygısı, huzur arayışı',
      phases: [
        {
          fromDay: 1,
          toDay: 7,
          focus: 'Sabır ve tevekkül',
          slots: {
            morning: [
              {
                dhikr: {
                  _id: dhikrId,
                  name: { tr: 'Sübhanallah', en: 'Subhanallah' },
                } as never,
                target: 10,
              },
            ],
          },
        },
      ],
    };

    const { service, aiCreditsService, virdProgramsService, agent } =
      createHarness({ agentOutcome: outcome });

    const result = await service.createVirdProgram(
      '507f1f77bcf86cd799439011',
      basePayload(),
      'tr',
    );

    expect(agent.run).toHaveBeenCalledTimes(1);
    expect(virdProgramsService.createAiDraft).toHaveBeenCalledTimes(1);
    expect(virdProgramsService.createAiDraft.mock.calls[0][0]).toMatchObject({
      flowId: basePayload().flowId,
      durationDays: 7,
      intent: 'sınav kaygısı, huzur arayışı',
      summary: outcome.summary,
      title: 'Sınav Virdi',
    });
    // toProgramPhases: outcome'daki gömülü DhikrLean, şemanın beklediği
    // dhikrId-only şekle (ObjectId + target) doğru çevrilmiş olmalı; hiç
    // istenmeyen bir dilim (örn. 'night') eklenmemeli.
    const persistedPhases = (
      virdProgramsService.createAiDraft.mock.calls[0][0] as {
        phases: Array<{
          fromDay: number;
          toDay: number;
          note?: string;
          slots: Record<string, Array<{ dhikrId: unknown; target: number }>>;
        }>;
      }
    ).phases;
    expect(persistedPhases).toEqual([
      {
        fromDay: 1,
        toDay: 7,
        note: 'Sabır ve tevekkül',
        slots: { morning: [{ dhikrId, target: 10 }] },
      },
    ]);
    expect(aiCreditsService.debitCreditForFlow).toHaveBeenCalledWith(
      expect.anything(),
      basePayload().flowId,
      false,
      'hash-123',
      'VIRD_PROGRAM_DEBIT',
      3,
    );

    expect(result.kind).toBe('program');
    if (result.kind !== 'program') throw new Error('unexpected');
    expect(result.remainingCredits).toBe(7);
    expect(result.program.title).toBe('Sınav Virdi');
  });

  it('offTopic → no draft persisted, no debit, returns the localized off-topic message', async () => {
    const { service, aiCreditsService, virdProgramsService, agent } =
      createHarness({ agentOutcome: { kind: 'offTopic' } });

    const result = await service.createVirdProgram(
      '507f1f77bcf86cd799439011',
      basePayload(),
      'tr',
    );

    expect(result).toEqual({ kind: 'offTopic', message: OFF_TOPIC_MESSAGE.tr });
    expect(agent.run).toHaveBeenCalledTimes(1);
    expect(virdProgramsService.createAiDraft).not.toHaveBeenCalled();
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
  });

  it('agent throws AiPipelineError (→ 503 upstream) → propagates without debiting, access check still ran once', async () => {
    const agentError = new AiRetrievalError(
      'retrieval_failed',
      'Aday zikir bulunamadı',
    );
    const { service, aiCreditsService, virdProgramsService } = createHarness({
      agentError,
    });

    await expect(
      service.createVirdProgram(
        '507f1f77bcf86cd799439011',
        basePayload(),
        'tr',
      ),
    ).rejects.toBe(agentError);

    expect(agentError).toBeInstanceOf(AiPipelineError);
    expect(aiCreditsService.ensureCreditAccessForFlow).toHaveBeenCalledTimes(1);
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    expect(virdProgramsService.createAiDraft).not.toHaveBeenCalled();
  });

  it('idempotent retry: an existing ai.flowId draft short-circuits — agent never runs, no second debit', async () => {
    const existingDraft = {
      _id: new Types.ObjectId(),
      title: { tr: 'Eski Vird', en: 'Eski Vird' },
      dayCount: 7,
      phases: [],
      ai: { summary: 'eski özet', durationDays: 7 },
    };
    const { service, aiCreditsService, agent, virdProgramsService } =
      createHarness({ existingDraft });

    const result = await service.createVirdProgram(
      '507f1f77bcf86cd799439011',
      basePayload(),
      'tr',
    );

    expect(result.kind).toBe('program');
    if (result.kind !== 'program') throw new Error('unexpected');
    expect(result.programId).toBe(existingDraft._id.toString());
    expect(result.remainingCredits).toBe(10);
    expect(agent.run).not.toHaveBeenCalled();
    expect(virdProgramsService.createAiDraft).not.toHaveBeenCalled();
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
    expect(aiCreditsService.getCredits).toHaveBeenCalledTimes(1);
  });

  it('insufficient credits → 403 AI_CREDIT_INSUFFICIENT propagates before the agent ever runs', async () => {
    const { service, aiCreditsService, agent, virdProgramsService } =
      createHarness();
    aiCreditsService.ensureCreditAccessForFlow.mockRejectedValueOnce(
      new ForbiddenException({
        code: 'AI_CREDIT_INSUFFICIENT',
        message: 'AI Rehber için kredin yetersiz.',
      }),
    );

    await expect(
      service.createVirdProgram(
        '507f1f77bcf86cd799439011',
        basePayload(),
        'tr',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);

    expect(agent.run).not.toHaveBeenCalled();
    expect(virdProgramsService.createAiDraft).not.toHaveBeenCalled();
    expect(aiCreditsService.debitCreditForFlow).not.toHaveBeenCalled();
  });
});
