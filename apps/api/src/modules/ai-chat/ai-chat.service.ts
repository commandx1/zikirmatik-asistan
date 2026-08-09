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
import { generateText, generateObject, streamText, stepCountIs } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import type { Request, Response } from 'express';
import { z } from 'zod';
import { AiProgressGateway } from '../ai/ai-progress.gateway';
import { AiService, type SourcePassageResult } from '../ai/ai.service';
import { AiUsageService } from '../ai/ai-usage.service';
import { AI_CREDIT_REASONS } from '../ai/credits.constants';
import type { SupportedAiLocale } from '../ai/utils/locale';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  AiChatMessage,
  type AiChatMessageDocument,
  type AiChatMessageRole,
  type AiSourceCitation,
} from './schemas/ai-chat-message.schema';
import {
  AiConversation,
  type AiConversationDocument,
} from './schemas/ai-conversation.schema';

type ChatAgentResult = {
  replyText: string;
  usedModel: 'openai' | 'fallback';
  sourceCitations?: AiSourceCitation[];
};

/**
 * Intent sınıflandırıcının çıktısı — retrieval'i tetikleyip tetiklemeyeceğimizi
 * ve hangi sistem prompt'unun kullanılacağını belirler (bkz. classifyIntent).
 *
 * - 'chat'  : selamlaşma/dertleşme/hâl hatır — kaynak araması yapılmaz.
 * - 'bilgi' : dini bilgi, ibadet, siyer, ilmihal, fetva/hüküm soruları ve
 *             "bana bir dua öner" tarzı talepler — source_passages araması
 *             yapılır, cevap yalnızca bulunan pasajlara dayandırılır.
 */
type ChatMode = 'chat' | 'bilgi';

/** classifyIntent çıktısı: mod + retrieval için bağlamdan arındırılmış sorgu. */
type ChatIntent = {
  mode: ChatMode;
  searchQuery: string;
};

const MAX_CONTEXT_MESSAGES = 10;
const MAX_SOURCE_CITATIONS = 3;
const MAX_SOURCE_PASSAGES = 6;
const TITLE_MAX_LENGTH = 60;

const AGENT_UNAVAILABLE_FALLBACK_REPLY =
  'Şu anda sana cevap veremiyorum, kusura bakma. Birazdan tekrar dener misin?';

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

    const freshConversation = await this.conversationModel
      .findById(conversation._id)
      .lean()
      .exec();

    return {
      conversation: freshConversation,
      messages: [
        this.toMessageResponse(userMessage),
        this.toMessageResponse(assistantMessage),
      ],
    };
  }

  /**
   * createConversation'ın SSE karşılığı: aynı erken kredi kontrolü + persist
   * + geç debit sırasını izler, ama assistant yanıtını `streamText` ile
   * token-token yazar. Event sırası: token×N → done (hata → error).
   * REST createConversation korunur, bu yalnızca paralel
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

      const freshConversation = await this.conversationModel
        .findById(conversation._id)
        .lean()
        .exec();

      this.writeSse(res, 'done', {
        messageId: assistantMessage._id.toString(),
        remainingCredits: wallet.balance,
        conversationId: conversation._id.toString(),
        conversation: freshConversation,
        userMessage: this.toMessageResponse(userMessage),
        sourceCitations: agentResult.sourceCitations ?? [],
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

    return {
      message: this.toMessageResponse(userMessage),
      reply: this.toMessageResponse(assistantMessage),
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

      this.writeSse(res, 'done', {
        messageId: assistantMessage._id.toString(),
        remainingCredits: wallet.balance,
        conversationId: conversationObjectId.toString(),
        userMessage: this.toMessageResponse(userMessage),
        sourceCitations: agentResult.sourceCitations ?? [],
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

    const items = rawItems.map((item) => ({
      id: item._id.toString(),
      conversationId: item.conversationId.toString(),
      role: item.role,
      content: item.content,
      usedModel: item.usedModel,
      createdAt: item.createdAt,
      sourceCitations: item.sourceCitations ?? [],
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
   * Çok turlu sohbet ajanı. Tool kullanmaz: önce classifyIntent ile mod +
   * arama sorgusu belirlenir, 'bilgi' modunda source_passages araması
   * deterministik olarak yapılır ve sonuçlar prompt'a gömülür. Modelin
   * ürettiği metin (result.text) doğrudan sohbet cevabı olarak kullanılır.
   *
   * Zikir önerisi ARTIK BURADA YOK — o akış tamamen AI Rehber'e
   * (AiService.getRecommendation) aittir.
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
    const intent = await this.classifyIntent(
      input.history,
      input.locale,
      latestUserMessage,
      undefined,
      {
        flowId: input.flowId,
        userId: input.userId,
      },
    );

    let passages: SourcePassageResult[] = [];
    if (intent.mode === 'bilgi') {
      this.emitStep(
        input.socketId,
        'searchingKaynak',
        'Kaynaklar taranıyor...',
      );
      passages = await this.fetchSourcePassages(intent.searchQuery);
    } else {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }

    const systemPrompt = this.selectPrompt(intent.mode, input.locale, passages);

    try {
      const result = await generateText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(1),
        system: systemPrompt,
        messages: input.history.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        onStepFinish: ({ stepNumber, finishReason }) => {
          this.logger.debug(
            `[chat-agent step ${stepNumber}] mode=${intent.mode} finish=${finishReason}`,
          );
        },
      });

      void this.usageService.record({
        kind: 'chat',
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

      return {
        replyText,
        usedModel: 'openai',
        sourceCitations:
          intent.mode === 'bilgi'
            ? this.buildSourceCitations(passages)
            : undefined,
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
   * kullanır, sınıflandırma/retrieval ve step-emit yan etkileri birebir
   * aynıdır. Fark: metin `onToken` callback'i ile parça parça dışarı
   * akıtılır.
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
    const intent = await this.classifyIntent(
      input.history,
      input.locale,
      latestUserMessage,
      input.abortSignal,
      { flowId: input.flowId, userId: input.userId },
    );

    let passages: SourcePassageResult[] = [];
    if (intent.mode === 'bilgi') {
      this.emitStep(
        input.socketId,
        'searchingKaynak',
        'Kaynaklar taranıyor...',
      );
      passages = await this.fetchSourcePassages(intent.searchQuery);
    } else {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }

    const systemPrompt = this.selectPrompt(intent.mode, input.locale, passages);
    let anyTokenSent = false;

    try {
      const result = streamText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(1),
        system: systemPrompt,
        messages: input.history.map((entry) => ({
          role: entry.role,
          content: entry.content,
        })),
        abortSignal: input.abortSignal,
        onStepFinish: ({ stepNumber, finishReason }) => {
          this.logger.debug(
            `[chat-agent-stream step ${stepNumber}] mode=${intent.mode} finish=${finishReason}`,
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

      return {
        replyText,
        usedModel: 'openai',
        sourceCitations:
          intent.mode === 'bilgi'
            ? this.buildSourceCitations(passages)
            : undefined,
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
   * Retrieval'den ÖNCE çalışan hafif niyet sınıflandırıcısı. İki iş yapar:
   *
   * 1. mode: kaynak aramasını yalnızca gerçekten bilgi/hüküm sorusu olan
   *    mesajlarda tetikler; selamlaşma/dertleşmede arama hiç yapılmaz.
   * 2. searchQuery: son 5 turu gördüğü için "peki ya sigara?" gibi bağlama
   *    yaslanan takip sorularını kendi başına anlaşılır bir arama sorgusuna
   *    çevirir ("oruçluyken sigara içmek orucu bozar mı"). Ham kullanıcı
   *    mesajıyla embedding almak bu tür turlarda alakasız pasaj getiriyordu.
   *
   * İkisi tek generateObject çağrısında üretilir — ek LLM turu maliyeti yok.
   *
   * Hata semantiği: sınıflandırma herhangi bir nedenle başarısız olursa
   * (timeout, API hatası, parse hatası) sessizce 'bilgi' + ham kullanıcı
   * mesajına düşülür — en kötü ihtimalle gereksiz bir arama yapılır ve
   * prompt zaten alakasız pasajı yok saymayı söyler; sohbet asla kesilmez.
   */
  private async classifyIntent(
    history: Array<{ role: AiChatMessageRole; content: string }>,
    locale: SupportedAiLocale,
    latestUserMessage?: string,
    abortSignal?: AbortSignal,
    attribution?: { flowId?: string; userId?: Types.ObjectId | string },
  ): Promise<ChatIntent> {
    const fallbackIntent: ChatIntent = {
      mode: 'bilgi',
      searchQuery: latestUserMessage?.trim() ?? '',
    };

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return fallbackIntent;
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
          mode: z.enum(['chat', 'bilgi']),
          searchQuery: z.string(),
        }),
        system: [
          'Sen bir İslami sohbet asistanının niyet sınıflandırıcısısın. İki alan üret: mode ve searchQuery.',
          '',
          'MODE — kullanıcının SON mesajını iki moddan birine ata:',
          '',
          '- bilgi: cevabı dini bir kaynakta aranması gereken her mesaj. Buna şunlar dahildir:',
          '  * İbadet ve ilmihal soruları (namaz nasıl kılınır, abdest nasıl alınır, orucun şartları...)',
          '  * Fetva/hüküm soruları ("haram mı", "caiz mi", "orucu bozar mı", "günah mı", "farz mı")',
          '  * Siyer-i Nebi / Peygamber Efendimizin hayatı, sahabe, İslam tarihi',
          '  * Akide/inanç soruları',
          '  * "Bana bir dua/zikir öner", "ne okuyayım", "şu durumda hangi dua okunur" gibi talepler',
          '  * Bir ayet, hadis, dua ya da kavramın anlamının sorulması',
          '',
          '- chat: kaynak gerektirmeyen mesajlar. Selamlaşma, teşekkür, hâl hatır sorma, iltifat,',
          '  duygu paylaşımı ve dertleşme (üzgünüm, yorgunum, bugün iyiyim, canım sıkkın),',
          '  asistanın kendisiyle ilgili sorular, kısa onaylar ("tamam", "peki").',
          '',
          'Kararsız kaldığında bilgi seç — gereksiz arama zararsızdır, eksik arama cevabı zayıflatır.',
          '',
          'SEARCHQUERY — kaynak veritabanında anlamsal arama için kullanılacak sorgu:',
          '- Son mesajı, konuşma bağlamını kullanarak KENDİ BAŞINA anlaşılır tek bir cümleye çevir.',
          '  Örnek: önceki tur oruçla ilgiliyken kullanıcı "peki ya sigara?" derse',
          '  searchQuery = "oruçluyken sigara içmek orucu bozar mı".',
          '- Soruyu genişletme, yorumlama veya cevaplama; yalnızca eksik bağlamı yerine koy.',
          '- mode "chat" ise searchQuery boş string olsun.',
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

      const { mode, searchQuery } = result.object;

      return {
        mode,
        // Model boş/eksik sorgu üretirse ham mesaja düş — 'bilgi' modunda
        // arama sorgusuz kalırsa retrieval sessizce boş döner.
        searchQuery:
          mode === 'bilgi'
            ? searchQuery?.trim() || fallbackIntent.searchQuery
            : '',
      };
    } catch (error) {
      this.logger.warn(
        `Intent sınıflandırması başarısız, 'bilgi' varsayılanına düşülüyor: ${this.describeError(error)}`,
      );
      return fallbackIntent;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * mode → sistem prompt dispatcher'ı. Yalnızca 'bilgi' modu kaynak
   * pasajlarını görür; 'chat' modunda modelin elinde hiç kaynak yoktur ve
   * bu yüzden dini bilgi/hüküm üretmesi açıkça yasaklanır.
   */
  private selectPrompt(
    mode: ChatMode,
    locale: SupportedAiLocale,
    passages: SourcePassageResult[] = [],
  ): string {
    return mode === 'bilgi'
      ? this.buildKnowledgePrompt(locale, passages)
      : this.buildChatPrompt(locale);
  }

  /**
   * mode='chat': selamlaşma, dertleşme, hâl hatır. Elinde hiç kaynak pasajı
   * yoktur — bu yüzden dini bilgi/hüküm üretmesi ve zikir/dua adı uydurması
   * açıkça yasaklanır; böyle bir soru gelirse kullanıcıyı tekrar sormaya
   * davet eder (bir sonraki turda 'bilgi' moduna düşer ve kaynak aranır).
   */
  private buildChatPrompt(locale: SupportedAiLocale): string {
    return [
      'Sen sıcak, samimi ve dinî hassasiyeti olan bir İslami sohbet arkadaşısın (Zikirmatik Asistan).',
      '',
      'Kullanıcı şu an bir bilgi sorusu sormuyor — selamlaşma, teşekkür, hâl hatır ya da içini dökme içinde. Onu gerçekten dinlediğini hissettiren, sıcak ve kısa-orta uzunlukta bir cevap ver. "İnşallah", "Allah kolaylık versin" gibi ifadeler doğal biçimde kullanılabilir.',
      '',
      'SINIRLAR:',
      '- Elinde şu an hiçbir kaynak metni YOK. Bu yüzden dini bilgi, hüküm, ayet, hadis ya da dua metni AKTARMA; hafızandan zikir/dua adı ve içeriği UYDURMA.',
      '- Kullanıcı bu turda dini bir soru sorarsa, kısaca cevaplayabileceğini söyle ve sorusunu biraz daha açık yazmasını iste — kaynaklara bakıp cevaplayacaksın.',
      '- Kendiliğinden zikir/dua önerisi dayatma. Kullanıcı isterse zaten isteyecektir.',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * mode='bilgi': ibadet/ilmihal, siyer, akide, fetva-hüküm soruları ve
   * "bana bir dua öner" tarzı talepler. Cevap YALNIZCA aşağıya gömülen
   * onaylı kaynak pasajlarına dayanmalı — pasajlarda olmayan bilgi
   * uydurulmamalı, ilgili pasaj yoksa bu açıkça söylenmeli.
   *
   * Önceki 'kaynak' prompt'undan farkı: pasajları özetlemek yerine
   * kullanıcının sorusuna DOĞRUDAN cevap vermesi isteniyor ve fetva/hüküm
   * soruları artık reddedilmiyor — kaynaktaki hüküm aktarılıp sonuna kısa
   * bir "kesin hüküm için alime danış" notu ekleniyor.
   */
  private buildKnowledgePrompt(
    locale: SupportedAiLocale,
    passages: SourcePassageResult[],
  ): string {
    const passagesBlock = passages.length
      ? passages
          .map((p, i) => {
            const pages =
              p.pageEnd !== p.pageStart
                ? `s. ${p.pageStart}-${p.pageEnd}`
                : `s. ${p.pageStart}`;
            const heading = p.sectionHeading ? ` — ${p.sectionHeading}` : '';
            return `#${i + 1} [${p.sourceTitle}${heading}, ${pages}]\n${p.text}`;
          })
          .join('\n\n')
      : null;

    return [
      'Sen sıcak, samimi ve dinî hassasiyeti olan bir İslami asistansın (Zikirmatik Asistan). Kullanıcı dini bir soru sordu; aşağıdaki onaylı KAYNAK PASAJLARI bölümüne dayanarak cevaplayacaksın.',
      '',
      '**NASIL CEVAP VERİLİR:**',
      '- Pasajları sırayla özetleme veya "kaynakta şöyle geçiyor" diye aktarma. Kullanıcının SORUSUNA doğrudan, net bir cevapla BAŞLA; ardından bu cevabın dayanağını pasajlardaki bilgiyle kısaca açıkla.',
      '- Kullanıcı "sakız çiğnemek orucu bozar mı" gibi somut bir soru sorduysa, cevabın da somut olsun. Kaynakta karşılığı varken "bu konuda bir alime danışmalısın" deyip geçme — bu, kullanıcıyı cevapsız bırakmaktır.',
      '- Sade ve anlaşılır konuş. Terim kullanman gerekiyorsa parantez içinde kısaca açıkla.',
      '- Bu bir sohbet ekranı: kısa yaz. Basit bir soruya birkaç cümle yeter; madde işaretlerini yalnızca gerçekten liste gereken yerde kullan.',
      '- "Kısa cevap:", "Açıklama:", "Dayanak:", "Not:" gibi şablon başlıklar KULLANMA. Bir insanla konuşur gibi akıcı yaz; cevap zaten ilk cümlede verilmiş olsun.',
      '',
      '**HÜKÜM (fetva) SORULARI:**',
      '- Kaynakta hüküm açıkça geçiyorsa aktar; "şunu diyemem" diye kaçma.',
      '- Kaynaklar arasında görüş farkı ya da mezhep ayrımı varsa bunu belirt, görüşleri birlikte aktar.',
      '- Böyle cevapların SONUNA tek cümlelik kısa bir not ekle: kişisel durum ve mezhebe göre değişebileceğini, kesin hüküm için bir alime danışmasının daha doğru olacağını söyle. Bu notu her cevaba değil, yalnızca hüküm/fetva içeren cevaplara ekle.',
      '',
      '**DUA/ZİKİR TALEPLERİ:**',
      '- Kullanıcı dua/zikir istediyse, pasajlarda geçen dua ve zikirleri düz metin olarak anlat: ne zaman/niçin okunduğunu ve varsa fazileti pasajda yazdığı kadarıyla aktar.',
      '- Pasajda olmayan bir duayı hafızandan yazma; Arapça metin, meal veya fazilet UYDURMA.',
      '',
      '**KAYNAK DIŞINA ÇIKMA (en önemli kural):**',
      '- Pasajlarda olmayan hiçbir bilgiyi ekleme. Emin olmadığında emin olmadığını söyle.',
      '- Gelen pasajlar soruyla ilgisizse onları YOK SAY ve elinde bu konuda kaynak olmadığını dürüstçe söyle, bir alime veya güvenilir bir kaynağa yönlendir.',
      '- Pasajlar soruyu kısmen karşılıyorsa, karşıladığı kadarını cevapla ve hangi kısmı cevaplayamadığını açıkça belirt.',
      '- KIYAS YAPMA: Sorulan mesele pasajlarda DOĞRUDAN ele alınmıyorsa, genel kurallardan yola çıkıp kendi başına hüküm ÇIKARMA. Bu özellikle kaynakların yazıldığı dönemde var olmayan çağdaş meseleler için geçerlidir (kripto para, modern finans ürünleri, yeni tıbbi uygulamalar, yeni teknolojiler vb.).',
      '  Böyle bir soruda: konunun elindeki kaynaklarda doğrudan geçmediğini açıkça söyle, kaynakta bulunan genel ilkeyi yalnızca "bilgi olarak" aktarabilirsin ama bunu o meseleye UYGULAMA, ve mutlaka bir alime yönlendir. Hüküm çıkarmak bir alimin işidir, senin değil.',
      '',
      '**BİÇİM:**',
      'Cevabın sonuna kaynak adı/sayfa notu EKLEME (ör. "(Kaynak: ...)"). Bu bilgi kullanıcıya ayrı bir kart olarak zaten gösteriliyor. Pasaj numaralarına ("#2 numaralı pasaj") da atıf yapma.',
      '',
      passagesBlock
        ? `KAYNAK PASAJLARI:\n${passagesBlock}`
        : 'KAYNAK PASAJLARI: (bu soru için ilgili pasaj bulunamadı — elinde kaynak olmadığını kullanıcıya açıkça söyle, bir alime veya güvenilir bir kaynağa yönlendir, bilgi uydurma.)',
      '',
      // Bu üç kural prompt'un ortasında kaldığında model bunlara uymuyordu
      // (canlı denemede "Kısa cevap:" başlığı ve metin içi "(Kaynak: ...)"
      // notu üretti). Pasajlardan SONRA tekrarlanınca uyum düzeliyor.
      'SON HATIRLATMA — bunlara mutlaka uy:',
      '1. Cevaba ASLA "Kısa cevap:", "Açıklama:", "Dayanak:", "Not:" gibi bir başlıkla başlama. İlk kelimen doğrudan cevabın kendisi olsun.',
      '   YANLIŞ: "Kısa cevap: Sakız orucu bozmaz. Açıklama: ..."',
      '   DOĞRU: "Sakız çiğnemek orucu bozmaz, ama oruçluyken mekruh sayılmış — çünkü ..."',
      '2. Metnin içinde ya da sonunda kitap adı, yazar adı veya sayfa numarası YAZMA. Bu bilgi kullanıcıya ayrı bir kart olarak zaten gösteriliyor.',
      '3. Sorulan mesele pasajlarda kendi adıyla DOĞRUDAN geçmiyorsa: o meselenin nasıl hesaplanacağını/uygulanacağını ANLATMA, adım adım yöntem verme, örnek hesap yapma. Yalnızca kaynaklarında bu konunun doğrudan geçmediğini söyle, varsa ilgili genel ilkeyi bir-iki cümleyle aktar ve alime yönlendir. Genel ilkeyi o meseleye uygulamak senin işin değil.',
      '',
      locale === 'en' ? 'Reply in English.' : 'Türkçe cevap ver.',
    ].join('\n');
  }

  /**
   * Retrieval adımı: yalnızca mode='bilgi' iken, sohbet ajanı çalışmaya
   * başlamadan ÖNCE deterministik olarak çağrılır. Sorgu, classifyIntent'in
   * ürettiği bağlamdan arındırılmış searchQuery'dir. Arama hatası sohbeti
   * asla kesmemeli — boş pasaj listesiyle devam edilir; bu durumda prompt
   * modele "elinde kaynak yok, uydurma" der.
   */
  private async fetchSourcePassages(
    searchQuery?: string,
  ): Promise<SourcePassageResult[]> {
    const query = searchQuery?.trim();
    if (!query) {
      return [];
    }
    try {
      return await this.aiService.searchSourcePassagesForAgent(
        query,
        MAX_SOURCE_PASSAGES,
      );
    } catch (error) {
      this.logger.warn(
        `Kaynak pasajları getirilemedi, boş listeyle devam edilecek: ${this.describeError(error)}`,
      );
      return [];
    }
  }

  /**
   * mode='bilgi' pasajlarını mesaja iliştirilecek kısa kaynak referanslarına
   * (kitap adı + sayfa aralığı) indirger. Aynı sourceTitle'dan gelen birden
   * fazla pasaj tek kayda birleştirilir (en düşük pageStart / en yüksek
   * pageEnd), passages'ın geliş sırası (retrieval skoruna göre) korunur.
   */
  private buildSourceCitations(
    passages: SourcePassageResult[],
  ): AiSourceCitation[] {
    const bySourceTitle = new Map<string, AiSourceCitation>();

    for (const passage of passages) {
      if (!passage.sourceTitle) continue;

      const existing = bySourceTitle.get(passage.sourceTitle);
      if (!existing) {
        bySourceTitle.set(passage.sourceTitle, {
          sourceId: passage.sourceId,
          sourceTitle: passage.sourceTitle,
          pageStart: passage.pageStart,
          pageEnd: passage.pageEnd,
        });
        continue;
      }

      existing.pageStart = Math.min(existing.pageStart, passage.pageStart);
      existing.pageEnd = Math.max(existing.pageEnd, passage.pageEnd);
    }

    return Array.from(bySourceTitle.values()).slice(0, MAX_SOURCE_CITATIONS);
  }

  private buildFallbackResult(): ChatAgentResult {
    return {
      replyText: AGENT_UNAVAILABLE_FALLBACK_REPLY,
      usedModel: 'fallback',
    };
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
      usedModel: agentResult.usedModel,
      sourceCitations: agentResult.sourceCitations,
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

  private toMessageResponse(doc: AiChatMessageDocument) {
    return {
      id: doc._id.toString(),
      conversationId: doc.conversationId.toString(),
      role: doc.role,
      content: doc.content,
      usedModel: doc.usedModel,
      createdAt: doc.createdAt,
      sourceCitations: doc.sourceCitations ?? [],
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
