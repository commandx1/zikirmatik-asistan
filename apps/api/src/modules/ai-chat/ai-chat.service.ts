import { randomUUID, createHash } from 'node:crypto';
import {
  HttpException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import {
  generateText,
  generateObject,
  streamText,
  stepCountIs,
  tool,
} from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AiProgressGateway } from '../ai/ai-progress.gateway';
import { AiService, type SearchResult } from '../ai/ai.service';
import { AiUsageService } from '../ai/ai-usage.service';
import { AI_CREDIT_REASONS } from '../ai/credits.constants';
import type { SupportedAiLocale } from '../ai/utils/locale';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  AiChatMessage,
  type AiChatMessageDocument,
  type AiChatMessageRole,
} from './schemas/ai-chat-message.schema';
import {
  AiConversation,
  type AiConversationDocument,
} from './schemas/ai-conversation.schema';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

type ChatAgentResult = {
  replyText: string;
  recommendedDhikrIds: string[];
  usedModel: 'openai' | 'fallback';
};

/**
 * Intent sınıflandırıcının çıktısı — retrieval'i tetikleyip tetiklemeyeceğimizi
 * ve hangi sistem prompt'unun kullanılacağını belirler (bkz. classifyIntent).
 */
type ChatMode = 'recommend' | 'chat' | 'clarify' | 'out_of_scope';

const MAX_CONTEXT_MESSAGES = 10;
const MAX_RECOMMENDATIONS_PER_REPLY = 3;
const TITLE_MAX_LENGTH = 60;

const AGENT_UNAVAILABLE_FALLBACK_REPLY =
  'Şu anda seni tam olarak dinleyemiyorum ama bu vakte uygun birkaç zikir öneriyorum. Birazdan tekrar dener misin?';

/**
 * streamText çağrısı istemciye zaten bir miktar token yazdıktan SONRA hata
 * verirse fırlatılır. Bu durumda kısmi metin zaten ekranda göründüğü için
 * fallback metnine sessizce düşülemez — akış `event: error` ile sonlanır,
 * assistant mesajı persist edilmez, kredi düşülmez.
 */
class ChatStreamMidwayError extends Error {}

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
    private readonly aiService: AiService,
    private readonly usageService: AiUsageService,
    @InjectModel(AiConversation.name)
    private readonly conversationModel: Model<AiConversationDocument>,
    @InjectModel(AiChatMessage.name)
    private readonly messageModel: Model<AiChatMessageDocument>,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private emitStep(socketId: string | undefined, key: string, message: string) {
    if (socketId) {
      this.progressGateway.emitChatStep(socketId, key, message);
    }
  }

  /**
   * Yeni bir konuşma oluşturur ve ilk kullanıcı mesajını işler.
   * Kredi düşümü tek-atım öneri akışıyla aynı deseni izler: erken erişim
   * kontrolü + başarılı tamamlanmada debit (bkz. AiService.ensureCreditAccessForFlow).
   */
  async createConversation(
    userId: string,
    payload: {
      firstMessage: string;
      locale?: SupportedAiLocale;
      socketId?: string;
    },
  ) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const firstMessage = payload.firstMessage.trim();
    const locale: SupportedAiLocale = payload.locale ?? 'tr';
    const socketId = payload.socketId;

    const user = await this.ensureUserExists(userObjectId);
    const flowId = randomUUID();
    const promptHash = this.computePromptHash(firstMessage);

    await this.aiService.ensureCreditAccessForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    this.emitStep(socketId, 'creating', 'Sohbet başlatılıyor...');

    const now = new Date();
    const conversation = await this.conversationModel.create({
      userId: userObjectId,
      title: this.generateTitle(firstMessage),
      status: 'active',
      lastMessageAt: now,
      locale,
    });

    const userMessage = await this.messageModel.create({
      conversationId: conversation._id,
      userId: userObjectId,
      role: 'user',
      content: firstMessage,
    });

    const agentResult = await this.runChatAgent({
      history: [{ role: 'user', content: firstMessage }],
      locale,
      socketId,
      flowId,
      userId: userObjectId,
    });

    const assistantMessage = await this.persistAssistantReply(
      conversation._id,
      userObjectId,
      agentResult,
    );

    await this.conversationModel
      .updateOne(
        { _id: conversation._id },
        { $set: { lastMessageAt: new Date() } },
      )
      .exec();

    await this.aiService.debitCreditForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    const [dhikrItems, freshConversation] = await Promise.all([
      this.loadDhikrCards(agentResult.recommendedDhikrIds),
      this.conversationModel.findById(conversation._id).lean().exec(),
    ]);

    return {
      conversation: freshConversation,
      messages: [
        this.toMessageResponse(userMessage),
        this.toMessageResponse(assistantMessage, dhikrItems),
      ],
    };
  }

  /**
   * createConversation'ın SSE karşılığı: aynı erken kredi kontrolü + persist
   * + geç debit sırasını izler, ama assistant yanıtını `streamText` ile
   * token-token yazar. Event sırası: token×N → recommendations → done
   * (hata → error). REST createConversation korunur, bu yalnızca paralel
   * bir akış rotasıdır.
   */
  async streamCreateConversation(
    userId: string,
    payload: {
      firstMessage: string;
      locale?: SupportedAiLocale;
      socketId?: string;
    },
    req: Request,
    res: Response,
  ): Promise<void> {
    const firstMessage = payload.firstMessage.trim();
    const locale: SupportedAiLocale = payload.locale ?? 'tr';
    const socketId = payload.socketId;

    const access = await this.tryEnsureStreamAccess(res, userId, firstMessage);
    if (!access) return;
    const { userObjectId, user, flowId, promptHash } = access;

    const { clientAborted, abortSignal, finish } = this.beginSse(req, res);
    this.emitStep(socketId, 'creating', 'Sohbet başlatılıyor...');

    try {
      const now = new Date();
      const conversation = await this.conversationModel.create({
        userId: userObjectId,
        title: this.generateTitle(firstMessage),
        status: 'active',
        lastMessageAt: now,
        locale,
      });

      const userMessage = await this.messageModel.create({
        conversationId: conversation._id,
        userId: userObjectId,
        role: 'user',
        content: firstMessage,
      });

      const agentResult = await this.runChatAgentStream({
        history: [{ role: 'user', content: firstMessage }],
        locale,
        socketId,
        abortSignal,
        onToken: (delta) => this.writeSse(res, 'token', { delta }),
        flowId,
        userId: userObjectId,
      });

      if (clientAborted()) {
        finish();
        return;
      }

      const assistantMessage = await this.persistAssistantReply(
        conversation._id,
        userObjectId,
        agentResult,
      );

      await this.conversationModel
        .updateOne(
          { _id: conversation._id },
          { $set: { lastMessageAt: new Date() } },
        )
        .exec();

      const wallet = await this.aiService.debitCreditForFlow(
        userObjectId,
        flowId,
        user.isPremium,
        promptHash,
        AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
      );

      const [dhikrItems, freshConversation] = await Promise.all([
        this.loadDhikrCards(agentResult.recommendedDhikrIds),
        this.conversationModel.findById(conversation._id).lean().exec(),
      ]);

      this.writeSse(res, 'recommendations', {
        recommendedDhikrs: dhikrItems,
      });
      this.writeSse(res, 'done', {
        messageId: assistantMessage._id.toString(),
        remainingCredits: wallet.balance,
        conversationId: conversation._id.toString(),
        conversation: freshConversation,
        userMessage: this.toMessageResponse(userMessage),
      });
      finish();
    } catch (error) {
      if (!clientAborted()) {
        this.writeSse(res, 'error', {
          message: this.describeError(error),
        });
      }
      finish();
    }
  }

  /**
   * Var olan bir konuşmaya yeni kullanıcı mesajı ekler, ajanı son 10 mesajlık
   * pencereyle çalıştırır ve assistant yanıtını kalıcılaştırır.
   */
  async sendMessage(
    userId: string,
    conversationId: string,
    payload: { message: string; socketId?: string },
  ) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const conversationObjectId = this.asObjectId(
      conversationId,
      'Geçersiz konuşma kimliği.',
    );
    const message = payload.message.trim();
    const socketId = payload.socketId;

    const user = await this.ensureUserExists(userObjectId);
    const conversation = await this.ensureOwnedConversation(
      conversationObjectId,
      userObjectId,
    );

    const flowId = randomUUID();
    const promptHash = this.computePromptHash(message);

    await this.aiService.ensureCreditAccessForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    this.emitStep(socketId, 'thinking', 'Mesajın değerlendiriliyor...');

    const userMessage = await this.messageModel.create({
      conversationId: conversationObjectId,
      userId: userObjectId,
      role: 'user',
      content: message,
    });

    const history = await this.loadContextWindow(conversationObjectId);

    const agentResult = await this.runChatAgent({
      history,
      locale: (conversation.locale as SupportedAiLocale) ?? 'tr',
      socketId,
      flowId,
      userId: userObjectId,
    });

    const assistantMessage = await this.persistAssistantReply(
      conversationObjectId,
      userObjectId,
      agentResult,
    );

    await this.conversationModel
      .updateOne(
        { _id: conversationObjectId },
        { $set: { lastMessageAt: new Date() } },
      )
      .exec();

    const wallet = await this.aiService.debitCreditForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    const dhikrItems = await this.loadDhikrCards(
      agentResult.recommendedDhikrIds,
    );

    return {
      message: this.toMessageResponse(userMessage),
      reply: this.toMessageResponse(assistantMessage, dhikrItems),
      remainingCredits: wallet.balance,
    };
  }

  /** sendMessage'ın SSE karşılığı — bkz. streamCreateConversation dokümantasyonu. */
  async streamSendMessage(
    userId: string,
    conversationId: string,
    payload: { message: string; socketId?: string },
    req: Request,
    res: Response,
  ): Promise<void> {
    const message = payload.message.trim();
    const socketId = payload.socketId;

    let conversationObjectId: Types.ObjectId;
    try {
      conversationObjectId = this.asObjectId(
        conversationId,
        'Geçersiz konuşma kimliği.',
      );
    } catch (error) {
      this.sendHttpError(res, error);
      return;
    }

    const access = await this.tryEnsureStreamAccess(
      res,
      userId,
      message,
      conversationObjectId,
    );
    if (!access) return;
    const { userObjectId, user, flowId, promptHash, conversation } = access;

    const { clientAborted, abortSignal, finish } = this.beginSse(req, res);
    this.emitStep(socketId, 'thinking', 'Mesajın değerlendiriliyor...');

    try {
      const userMessage = await this.messageModel.create({
        conversationId: conversationObjectId,
        userId: userObjectId,
        role: 'user',
        content: message,
      });

      const history = await this.loadContextWindow(conversationObjectId);

      const agentResult = await this.runChatAgentStream({
        history,
        locale: (conversation!.locale as SupportedAiLocale) ?? 'tr',
        socketId,
        abortSignal,
        onToken: (delta) => this.writeSse(res, 'token', { delta }),
        flowId,
        userId: userObjectId,
      });

      if (clientAborted()) {
        finish();
        return;
      }

      const assistantMessage = await this.persistAssistantReply(
        conversationObjectId,
        userObjectId,
        agentResult,
      );

      await this.conversationModel
        .updateOne(
          { _id: conversationObjectId },
          { $set: { lastMessageAt: new Date() } },
        )
        .exec();

      const wallet = await this.aiService.debitCreditForFlow(
        userObjectId,
        flowId,
        user.isPremium,
        promptHash,
        AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
      );

      const dhikrItems = await this.loadDhikrCards(
        agentResult.recommendedDhikrIds,
      );

      this.writeSse(res, 'recommendations', {
        recommendedDhikrs: dhikrItems,
      });
      this.writeSse(res, 'done', {
        messageId: assistantMessage._id.toString(),
        remainingCredits: wallet.balance,
        conversationId: conversationObjectId.toString(),
        userMessage: this.toMessageResponse(userMessage),
      });
      finish();
    } catch (error) {
      if (!clientAborted()) {
        this.writeSse(res, 'error', {
          message: this.describeError(error),
        });
      }
      finish();
    }
  }

  async listConversations(userId: string, page: number, limit: number) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const skip = (page - 1) * limit;

    const [rawItems, total] = await Promise.all([
      this.conversationModel
        .find({ userId: userObjectId })
        .sort({ lastMessageAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.conversationModel.countDocuments({ userId: userObjectId }).exec(),
    ]);

    const items = rawItems.map((item) => ({
      id: item._id.toString(),
      title: item.title,
      status: item.status,
      lastMessageAt: item.lastMessageAt,
      locale: item.locale,
    }));

    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  async listMessages(
    userId: string,
    conversationId: string,
    page: number,
    limit: number,
  ) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const conversationObjectId = this.asObjectId(
      conversationId,
      'Geçersiz konuşma kimliği.',
    );

    await this.ensureOwnedConversation(conversationObjectId, userObjectId);

    const skip = (page - 1) * limit;
    const [rawItems, total] = await Promise.all([
      this.messageModel
        .find({ conversationId: conversationObjectId })
        .sort({ createdAt: 1 })
        .skip(skip)
        .limit(limit)
        .lean()
        .exec(),
      this.messageModel
        .countDocuments({ conversationId: conversationObjectId })
        .exec(),
    ]);

    const allDhikrIds = rawItems.flatMap((item) =>
      (item.recommendedDhikrIds ?? []).map((id) => id.toString()),
    );
    const dhikrItems = await this.loadDhikrCards(allDhikrIds);
    const dhikrMapById = new Map(dhikrItems.map((d) => [d.id, d]));

    const items = rawItems.map((item) => ({
      id: item._id.toString(),
      conversationId: item.conversationId.toString(),
      role: item.role,
      content: item.content,
      usedModel: item.usedModel,
      createdAt: item.createdAt,
      recommendedDhikrs: (item.recommendedDhikrIds ?? [])
        .map((id) => dhikrMapById.get(id.toString()))
        .filter((value): value is NonNullable<typeof value> => Boolean(value)),
    }));

    return {
      items,
      page,
      limit,
      total,
      hasMore: skip + items.length < total,
    };
  }

  // ─────────────────────────────────────────────────────────────────────────
  // Agent
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * Çok turlu sohbet ajanı: searchDhikrs (AiService.searchDhikrsForAgent'ı
   * yeniden kullanır) ve attachRecommendations tool'larıyla çalışır. Ajanın
   * ürettiği SON metin (result.text) doğrudan sohbet cevabı olarak kullanılır
   * — tek-atım akıştaki gibi ayrı bir summary/reason birleştirme adımı yok,
   * çünkü burada model zaten doğal bir sohbet cevabı üretiyor.
   */
  private async runChatAgent(input: {
    history: Array<{ role: AiChatMessageRole; content: string }>;
    locale: SupportedAiLocale;
    socketId?: string;
    flowId?: string;
    userId?: Types.ObjectId | string;
  }): Promise<ChatAgentResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, sohbet fallback ile cevaplanacak.',
      );
      return this.buildFallbackResult();
    }

    const modelName =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
    const openaiProvider = createOpenAI({ apiKey });

    const latestUserMessage = [...input.history]
      .reverse()
      .find((m) => m.role === 'user')?.content;

    this.emitStep(input.socketId, 'thinking', 'Mesajın değerlendiriliyor...');
    const mode = await this.classifyIntent(
      input.history,
      input.locale,
      undefined,
      {
        flowId: input.flowId,
        userId: input.userId,
      },
    );
    let candidates: SearchResult[] = [];
    if (mode === 'recommend') {
      this.emitStep(input.socketId, 'searching', 'Zikirler taranıyor...');
      candidates = await this.fetchRecommendationCandidates(latestUserMessage);
    }
    if (mode !== 'recommend') {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }
    const systemPrompt = this.selectPrompt(mode, input.locale, candidates);
    let recommendedIds: string[] = [];

    const tools =
      mode === 'recommend'
        ? {
            attachRecommendations: tool({
              description:
                "Sohbet cevabında somut zikir/dua önerdiğinde, önerdiğin id'leri buraya raporla (en fazla 3). Sadece ADAYLAR listesinden gelen id kullan.",
              inputSchema: z.object({
                dhikrIds: z
                  .array(z.string())
                  .max(MAX_RECOMMENDATIONS_PER_REPLY),
              }),
              execute: (params) => {
                this.emitStep(
                  input.socketId,
                  'selecting',
                  'Öneriler hazırlanıyor...',
                );
                recommendedIds = params.dhikrIds.slice(
                  0,
                  MAX_RECOMMENDATIONS_PER_REPLY,
                );
                return { success: true };
              },
            }),
          }
        : undefined;

    try {
      const result = await generateText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(mode === 'recommend' ? 2 : 1),
        system: systemPrompt,
        messages: input.history.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
          const tools = toolCalls?.map((t) => t.toolName).join(', ') || '-';
          this.logger.debug(
            `[chat-agent step ${stepNumber}] tools=[${tools}] finish=${finishReason}`,
          );
        },
        tools,
      });

      void this.usageService.record({
        kind: mode === 'recommend' ? 'recommend' : 'chat',
        model: modelName,
        usage: result.totalUsage,
        steps: result.steps?.length,
        flowId: input.flowId,
        userId: input.userId,
      });

      const replyText = result.text?.trim();
      if (!replyText) {
        return this.buildFallbackResult();
      }

      const validIds = await this.filterValidDhikrIds(recommendedIds);

      return {
        replyText,
        recommendedDhikrIds: validIds,
        usedModel: 'openai',
      };
    } catch (error) {
      this.logger.warn(
        `Chat agent çalıştırılamadı, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return this.buildFallbackResult();
    }
  }

  /**
   * runChatAgent'ın stream'li karşılığı: `generateText` yerine `streamText`
   * kullanır, tool-calling (searchDhikrs/attachRecommendations) davranışı ve
   * step-emit yan etkileri birebir aynıdır. Fark: metin `onToken` callback'i
   * ile parça parça dışarı akıtılır.
   *
   * Hata semantiği: OPENAI_API_KEY yoksa ya da hiç token akıtılmadan hata
   * oluşursa (ör. rate limit) — generateText yolundaki gibi sessizce
   * fallback metnine düşer ve onToken'a TEK parça olarak yazar (akış normal
   * biter → persist + debit devam eder). Bir miktar token zaten akıtıldıktan
   * SONRA hata olursa artık geri dönülemez — ChatStreamMidwayError fırlatılır
   * ve çağıran taraf `event: error` ile akışı sonlandırıp persist/debit'i
   * atlamalıdır.
   */
  private async runChatAgentStream(input: {
    history: Array<{ role: AiChatMessageRole; content: string }>;
    locale: SupportedAiLocale;
    socketId?: string;
    abortSignal?: AbortSignal;
    onToken: (delta: string) => void;
    flowId?: string;
    userId?: Types.ObjectId | string;
  }): Promise<ChatAgentResult> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, sohbet fallback ile cevaplanacak.',
      );
      const fallback = this.buildFallbackResult();
      input.onToken(fallback.replyText);
      return fallback;
    }

    const modelName =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
    const openaiProvider = createOpenAI({ apiKey });

    const latestUserMessage = [...input.history]
      .reverse()
      .find((m) => m.role === 'user')?.content;

    this.emitStep(input.socketId, 'thinking', 'Mesajın değerlendiriliyor...');
    const mode = await this.classifyIntent(
      input.history,
      input.locale,
      input.abortSignal,
      { flowId: input.flowId, userId: input.userId },
    );
    let candidates: SearchResult[] = [];
    if (mode === 'recommend') {
      this.emitStep(input.socketId, 'searching', 'Zikirler taranıyor...');
      candidates = await this.fetchRecommendationCandidates(latestUserMessage);
    }
    if (mode !== 'recommend') {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }
    const systemPrompt = this.selectPrompt(mode, input.locale, candidates);
    let recommendedIds: string[] = [];
    let anyTokenSent = false;

    const tools =
      mode === 'recommend'
        ? {
            attachRecommendations: tool({
              description:
                "Sohbet cevabında somut zikir/dua önerdiğinde, önerdiğin id'leri buraya raporla (en fazla 3). Sadece ADAYLAR listesinden gelen id kullan.",
              inputSchema: z.object({
                dhikrIds: z
                  .array(z.string())
                  .max(MAX_RECOMMENDATIONS_PER_REPLY),
              }),
              execute: (params) => {
                this.emitStep(
                  input.socketId,
                  'selecting',
                  'Öneriler hazırlanıyor...',
                );
                recommendedIds = params.dhikrIds.slice(
                  0,
                  MAX_RECOMMENDATIONS_PER_REPLY,
                );
                return { success: true };
              },
            }),
          }
        : undefined;

    try {
      const result = streamText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(mode === 'recommend' ? 2 : 1),
        system: systemPrompt,
        messages: input.history.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        abortSignal: input.abortSignal,
        onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
          const tools = toolCalls?.map((t) => t.toolName).join(', ') || '-';
          this.logger.debug(
            `[chat-agent-stream step ${stepNumber}] tools=[${tools}] finish=${finishReason}`,
          );
        },
        onFinish: ({ totalUsage, steps }) => {
          void this.usageService.record({
            kind: 'chat_stream',
            model: modelName,
            usage: totalUsage,
            steps: steps?.length,
            flowId: input.flowId,
            userId: input.userId,
          });
        },
        tools,
      });

      for await (const delta of result.textStream) {
        if (!delta) continue;
        anyTokenSent = true;
        input.onToken(delta);
      }

      const replyText = (await result.text)?.trim();
      if (!replyText) {
        if (anyTokenSent) {
          throw new ChatStreamMidwayError('Boş yanıt üretildi.');
        }
        const fallback = this.buildFallbackResult();
        input.onToken(fallback.replyText);
        return fallback;
      }

      const validIds = await this.filterValidDhikrIds(recommendedIds);

      return {
        replyText,
        recommendedDhikrIds: validIds,
        usedModel: 'openai',
      };
    } catch (error) {
      if (error instanceof ChatStreamMidwayError) {
        throw error;
      }
      if (input.abortSignal?.aborted) {
        throw error;
      }
      if (anyTokenSent) {
        throw new ChatStreamMidwayError(this.describeError(error));
      }

      this.logger.warn(
        `Chat agent (stream) çalıştırılamadı, fallback kullanılacak: ${this.describeError(error)}`,
      );
      const fallback = this.buildFallbackResult();
      input.onToken(fallback.replyText);
      return fallback;
    }
  }

  /**
   * Retrieval'den ÖNCE çalışan hafif niyet sınıflandırıcısı. Vektör aramayı
   * yalnızca gerçekten bir zikir/dua önerisi gerektiren mesajlarda tetikler;
   * genel sohbet/belirsiz/kapsam-dışı mesajlarda arama hiç yapılmaz.
   *
   * Hata semantiği: sınıflandırma herhangi bir nedenle başarısız olursa
   * (timeout, API hatası, parse hatası) sessizce 'recommend'e düşülür —
   * mevcut retrieval-first davranışla geriye dönük uyumluluk için en güvenli
   * varsayılan budur (asla sohbeti kesmez, en kötü ihtimalle gereksiz arama
   * yapılır).
   */
  private async classifyIntent(
    history: Array<{ role: AiChatMessageRole; content: string }>,
    locale: SupportedAiLocale,
    abortSignal?: AbortSignal,
    attribution?: { flowId?: string; userId?: Types.ObjectId | string },
  ): Promise<ChatMode> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return 'recommend';
    }

    const modelName =
      this.configService.get<string>('OPENAI_CLASSIFIER_MODEL') ??
      'gpt-4o-mini';
    const openaiProvider = createOpenAI({ apiKey });

    const tail = history.slice(-5);
    const conversationTail = tail
      .map(
        (m) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`,
      )
      .join('\n');

    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 4000);
    const combinedSignal =
      typeof AbortSignal.any === 'function'
        ? AbortSignal.any(
            [abortSignal, timeoutController.signal].filter(
              (s): s is AbortSignal => !!s,
            ),
          )
        : timeoutController.signal;

    try {
      const result = await generateObject({
        model: openaiProvider(modelName),
        abortSignal: combinedSignal,
        temperature: 0,
        schema: z.object({
          mode: z.enum(['recommend', 'chat', 'clarify', 'out_of_scope']),
        }),
        system: [
          'Sen bir İslami zikir/dua sohbet asistanının niyet sınıflandırıcısısın.',
          'Kullanıcının son mesajını (ve varsa kısa bağlamı) tam olarak dört moddan birine ata:',
          '',
          '- recommend: kullanıcı bir zikir/dua önerisine ihtiyaç duyacak bir hal/duygu/niyet belirtmiş (üzüntü, stres, şükür/pozitif duygu dahil, huzur arayışı, "ne okuyayım" vb.). Pozitif duygu/şükür ifadeleri de recommend sayılır (şükür zikri önerilebilir).',
          '- chat: genel sohbet/selam/teşekkür/hafif muhabbet/dertleşme — spesifik bir zikir önerisi gerekmiyor.',
          '- clarify: niyet belirsiz, öneri yapmak için daha fazla bilgiye ihtiyaç var.',
          '- out_of_scope: fetva/hüküm soruları ("haram mı, caiz mi"), kitap/kaynak pasajı isteği, ya da zikir/duayla hiçbir ilgisi olmayan teknik/genel bilgi soruları.',
          '',
          'Yalnızca tek bir mod döndür.',
        ].join('\n'),
        prompt: `Konuşma (son turlar):\n${conversationTail}\n\nLocale: ${locale}`,
      });

      void this.usageService.record({
        kind: 'classify',
        model: modelName,
        usage: result.usage,
        flowId: attribution?.flowId,
        userId: attribution?.userId,
      });

      return result.object.mode;
    } catch (error) {
      this.logger.warn(
        `Intent sınıflandırması başarısız, 'recommend' varsayılanına düşülüyor: ${this.describeError(error)}`,
      );
      return 'recommend';
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * mode → sistem prompt dispatcher'ı. Her modun kendine ait, dar kapsamlı
   * bir prompt'u vardır; yalnızca 'recommend' adayları (ve attachRecommendations
   * tool'unu) görür.
   */
  private selectPrompt(
    mode: ChatMode,
    locale: SupportedAiLocale,
    candidates: SearchResult[],
  ): string {
    switch (mode) {
      case 'recommend':
        return this.buildRecommendPrompt(locale, candidates);
      case 'chat':
        return this.buildChatPrompt(locale);
      case 'clarify':
        return this.buildClarifyPrompt(locale);
      case 'out_of_scope':
        return this.buildBoundaryPrompt(locale);
    }
  }

  /**
   * Retrieval-first mimari: arama artık modelin çağırdığı bir tool değil,
   * `runChatAgent(Stream)` başında deterministik olarak yapılan bir adım
   * (bkz. fetchRecommendationCandidates). Sonuçlar burada prompt'a gömülür,
   * böylece model ilk turdan itibaren doğrudan metin üretmeye başlayabilir —
   * tool-call turlarını bekleyip token akışını geciktirmez.
   */
  private buildRecommendPrompt(
    locale: SupportedAiLocale,
    candidates: SearchResult[],
  ): string {
    const candidatesBlock =
      candidates.length === 0
        ? 'Aday bulunamadı — kullanıcının niyetini netleştirici bir soru sor, öneri yapma.'
        : candidates
            .map((c) =>
              JSON.stringify({
                id: c.id,
                name: c.name,
                virtue: c.virtue,
                suitableFor: c.suitableFor,
                timeOfDay: c.timeOfDay,
              }),
            )
            .join('\n');

    return [
      'Sen sıcak, samimi ve dinî hassasiyeti olan bir İslami zikir/dua rehberi asistanısın (Zikirmatik Asistan).',
      '',
      '**KAPSAM — YALNIZCA:**',
      "Kullanıcının niyetine/duygusal durumuna uygun zikir/dua önerisi yap. Somut öneri verdiğinde attachRecommendations ile hangi id'leri önerdiğini raporla (en fazla 3 zikir).",
      '',
      '**ADAYLAR (aşağıdaki listeden gelen zikir/dua adayları):**',
      candidatesBlock,
      '',
      "Yalnızca bu listedeki id'leri kullan, id uydurma. Aday yoksa veya kullanıcının niyeti belirsizse önce netleştirici bir soru sor, öneri yapma.",
      '',
      '**KAPSAM DIŞI — nazikçe sınır koy, alime yönlendir:**',
      '- Fetva / hüküm soruları ("bu haram mı, caiz mi" vb.)',
      '- Kitap/kaynak pasajı isteyen genel dini bilgi soruları',
      '- Zikir/dua ile hiçbir ilgisi olmayan genel sohbet, teknik/sistem soruları',
      'Bu durumlarda kısaca "bu konuda bir alime danışman daha doğru olur" de ve sohbeti nazikçe zikir/dua önerisine geri çevir.',
      '',
      '**BELİRSİZLİK:**',
      'Kullanıcının niyeti belirsizse doğal bir karşı-soru sor (ör. "Şu an neye ihtiyacın var — huzur mu, sabır mı, şükür mü?"). Asla tahmin ederek yanlış zikir önerme.',
      '',
      '**HER ÖNERİDE ZORUNLU:**',
      'Önerdiğin her zikir için fazilet/hadis bilgisini ve ne zaman/niçin okunacağını (kullanım amacını) cevabında açıkça belirt. Zikir adını uydurma, yalnızca ADAYLAR listesinden gelenleri kullan.',
      '',
      '**ÜSLUP:**',
      'Sıcak, kısa-orta uzunlukta, "inşallah", "Allah kabul etsin" gibi ifadelerle samimi bir dil kullan. Bu bir sohbet — cevabın doğrudan kullanıcıya yazılmış son mesaj olacak.',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * mode='chat': genel sohbet — sıcak bir İslami arkadaş üslubu, ama somut
   * zikir/dua adı UYDURMAZ ve öneri baskısı yapmaz (candidates yok).
   */
  private buildChatPrompt(locale: SupportedAiLocale): string {
    return [
      'Sen sıcak, samimi ve dinî hassasiyeti olan bir İslami sohbet arkadaşısın (Zikirmatik Asistan).',
      '',
      'Kullanıcı şu an spesifik bir zikir/dua önerisi istemiyor — genel sohbet, selamlaşma, teşekkür ya da hafif bir dertleşme içinde. Sıcak, içten ve kısa-orta uzunlukta bir cevap ver; "inşallah", "Allah kolaylık versin" gibi ifadeler kullanabilirsin.',
      '',
      'KESİNLİKLE zikir/dua adı ya da id uydurma, somut bir öneri dayatma — elinde aday listesi yok. Fetva/hüküm verme, bir alim değilsin.',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * mode='clarify': niyet belirsiz. Tek, doğal bir netleştirici soru sor —
   * öneri yok, id uydurma yok.
   */
  private buildClarifyPrompt(locale: SupportedAiLocale): string {
    return [
      'Sen sıcak, samimi bir İslami zikir/dua rehberi asistanısın (Zikirmatik Asistan).',
      '',
      'Kullanıcının niyeti/duygusal durumu henüz belirsiz. Şu an bir zikir/dua önerisi YAPMA, id uydurma. Bunun yerine kısa ve doğal TEK bir karşı-soru sorarak niyetini netleştir (ör. "Şu an neye ihtiyacın var — huzur mu, sabır mı, şükür mü?").',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * mode='out_of_scope': fetva/hüküm, kitap/kaynak pasajı ya da zikir/duayla
   * ilgisiz sorular. Kısaca sınır koy ve nazikçe konuya geri çevir.
   */
  private buildBoundaryPrompt(locale: SupportedAiLocale): string {
    return [
      'Sen sıcak, samimi bir İslami zikir/dua rehberi asistanısın (Zikirmatik Asistan).',
      '',
      'Kullanıcının sorusu kapsam dışı: fetva/hüküm ("haram mı, caiz mi" vb.), kitap/kaynak pasajı isteği ya da zikir/duayla ilgisi olmayan genel/teknik bir soru olabilir.',
      '',
      'Kısaca "bu konuda bir alime danışman daha doğru olur" de (fetva verme, hüküm bildirme) ve sohbeti nazikçe zikir/dua konusuna geri çevir.',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * Retrieval adımı: yalnızca mode='recommend' iken, sohbet ajanı
   * çalışmaya başlamadan ÖNCE deterministik olarak çağrılır. Arama hatası
   * sohbeti asla kesmemeli — boş adaylarla devam edilir (bu durumda çağıran
   * taraf mode'u 'clarify'e düşürür, bkz. runChatAgent/runChatAgentStream).
   */
  private async fetchRecommendationCandidates(
    latestUserMessage?: string,
  ): Promise<SearchResult[]> {
    try {
      return await this.aiService.searchDhikrsForAgent(
        { limit: 8 },
        [],
        latestUserMessage,
      );
    } catch (error) {
      this.logger.warn(
        `Retrieval adayları getirilemedi, boş listeyle devam edilecek: ${this.describeError(error)}`,
      );
      return [];
    }
  }

  private buildFallbackResult(): ChatAgentResult {
    return {
      replyText: AGENT_UNAVAILABLE_FALLBACK_REPLY,
      recommendedDhikrIds: [],
      usedModel: 'fallback',
    };
  }

  private async filterValidDhikrIds(ids: string[]): Promise<string[]> {
    if (ids.length === 0) return [];
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    const valid = await this.dhikrModel
      .find({ _id: { $in: objectIds }, isVerified: true, isActive: true })
      .select('_id')
      .lean<{ _id: Types.ObjectId }[]>()
      .exec();

    const validSet = new Set(valid.map((v) => v._id.toString()));
    return ids.filter((id) => validSet.has(id));
  }

  private async loadDhikrCards(ids: string[]) {
    if (ids.length === 0) return [];
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    const dhikrs = await this.dhikrModel
      .find({ _id: { $in: objectIds } })
      .lean<DhikrLean[]>()
      .exec();

    const orderedById = new Map(dhikrs.map((d) => [d._id.toString(), d]));

    return ids
      .map((id) => orderedById.get(id))
      .filter((item): item is DhikrLean => Boolean(item))
      .map((item) => ({
        id: item._id.toString(),
        name: item.name,
        nameArabic: item.nameArabic,
        transliteration: item.transliteration,
        meaning: item.meaning,
        virtue: item.virtue,
        source: item.source,
        recommendedCount: item.recommendedCount,
      }));
  }

  // ─────────────────────────────────────────────────────────────────────────
  // SSE altyapısı
  // ─────────────────────────────────────────────────────────────────────────

  /**
   * streamCreateConversation/streamSendMessage için ortak "erken erişim"
   * kontrolü: kullanıcı/konuşma doğrulama + ensureCreditAccessForFlow — SSE
   * başlıkları yazılmadan ÖNCE çalışır ki kredi yoksa akış hiç başlamasın ve
   * hata normal bir HTTP JSON yanıtı (Nest exception filter'ının ürettiğine
   * yakın şekilde) olarak dönebilsin. Başarısızlıkta `sendHttpError` ile
   * yanıtı yazıp `null` döner; çağıran taraf bunu görüp erken çıkmalıdır.
   */
  private async tryEnsureStreamAccess(
    res: Response,
    userId: string,
    promptText: string,
    conversationId?: Types.ObjectId,
  ): Promise<{
    userObjectId: Types.ObjectId;
    user: { isPremium: boolean };
    flowId: string;
    promptHash: string;
    conversation?: { locale?: string };
  } | null> {
    try {
      const userObjectId = this.asObjectId(
        userId,
        'Geçersiz kullanıcı kimliği.',
      );
      const user = await this.ensureUserExists(userObjectId);
      const conversation = conversationId
        ? await this.ensureOwnedConversation(conversationId, userObjectId)
        : undefined;

      const flowId = randomUUID();
      const promptHash = this.computePromptHash(promptText);

      await this.aiService.ensureCreditAccessForFlow(
        userObjectId,
        flowId,
        user.isPremium,
        promptHash,
        AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
      );

      return { userObjectId, user, flowId, promptHash, conversation };
    } catch (error) {
      this.sendHttpError(res, error);
      return null;
    }
  }

  /**
   * SSE başlıklarını yazar ve istemci bağlantı kopması (AbortController) ile
   * normal bitiş (`finish()`) arasında ayrım yapan yardımcıları döner.
   * `clientAborted()` true ise persist/debit adımları atlanmalıdır (bkz.
   * streamCreateConversation/streamSendMessage).
   */
  private beginSse(
    req: Request,
    res: Response,
  ): {
    abortSignal: AbortSignal;
    clientAborted: () => boolean;
    finish: () => void;
  } {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders?.();

    const abortController = new AbortController();
    let aborted = false;
    let finished = false;

    const onClose = () => {
      if (!finished) {
        aborted = true;
        abortController.abort();
      }
    };
    req.on('close', onClose);

    return {
      abortSignal: abortController.signal,
      clientAborted: () => aborted,
      finish: () => {
        finished = true;
        req.off('close', onClose);
        if (!res.writableEnded) {
          res.end();
        }
      },
    };
  }

  private writeSse(res: Response, event: string, data: unknown) {
    if (res.writableEnded) return;
    try {
      res.write(`event: ${event}\n`);
      res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      this.logger.warn(`SSE yazımı başarısız: ${this.describeError(error)}`);
    }
  }

  /**
   * SSE başlamadan önceki (henüz normal HTTP yanıtı olan) hataları, Nest'in
   * varsayılan exception filter'ının ürettiğine yakın bir gövdeyle döner —
   * @Res() kullanıldığı için filter zinciri devre dışı, bu yüzden manuel.
   */
  private sendHttpError(res: Response, error: unknown) {
    if (error instanceof HttpException) {
      res.status(error.getStatus()).json(error.getResponse());
      return;
    }
    this.logger.error(
      `Beklenmeyen stream hazırlık hatası: ${this.describeError(error)}`,
    );
    res.status(500).json({
      statusCode: 500,
      message: 'Beklenmeyen bir hata oluştu.',
    });
  }

  private async persistAssistantReply(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
    agentResult: ChatAgentResult,
  ) {
    return this.messageModel.create({
      conversationId,
      userId,
      role: 'assistant',
      content: agentResult.replyText,
      recommendedDhikrIds: agentResult.recommendedDhikrIds.map(
        (id) => new Types.ObjectId(id),
      ),
      usedModel: agentResult.usedModel,
    });
  }

  private async loadContextWindow(conversationId: Types.ObjectId) {
    const messages = await this.messageModel
      .find({ conversationId })
      .sort({ createdAt: -1 })
      .limit(MAX_CONTEXT_MESSAGES)
      .lean()
      .exec();

    return messages
      .reverse()
      .map((m) => ({ role: m.role, content: m.content }));
  }

  private async ensureOwnedConversation(
    conversationId: Types.ObjectId,
    userId: Types.ObjectId,
  ) {
    const conversation = await this.conversationModel
      .findOne({ _id: conversationId, userId })
      .lean()
      .exec();

    if (!conversation) {
      throw new NotFoundException('Konuşma bulunamadı.');
    }

    return conversation;
  }

  private generateTitle(firstMessage: string): string {
    const trimmed = firstMessage.trim();
    if (trimmed.length <= TITLE_MAX_LENGTH) return trimmed;
    return `${trimmed.slice(0, TITLE_MAX_LENGTH).trimEnd()}…`;
  }

  private toMessageResponse(
    doc: AiChatMessageDocument,
    dhikrItems?: Awaited<ReturnType<AiChatService['loadDhikrCards']>>,
  ) {
    return {
      id: doc._id.toString(),
      conversationId: doc.conversationId.toString(),
      role: doc.role,
      content: doc.content,
      usedModel: doc.usedModel,
      createdAt: doc.createdAt,
      recommendedDhikrs: dhikrItems ?? [],
    };
  }

  private computePromptHash(message: string): string {
    return createHash('sha256').update(message).digest('hex');
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) throw new NotFoundException(message);
    return new Types.ObjectId(rawId);
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : 'bilinmeyen hata';
  }
}
