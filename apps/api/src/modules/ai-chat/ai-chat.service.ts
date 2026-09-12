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
  Output,
  generateText,
  generateObject,
  streamText,
  stepCountIs,
} from 'ai';
import type { Request, Response } from 'express';
import { AiCreditsService } from '../ai/ai-credits.service';
import {
  AI_UNAVAILABLE_CODE,
  AI_UNAVAILABLE_MESSAGE,
  AiInvalidOutputError,
  AiPipelineError,
  AiStreamInterruptedError,
} from '../ai/ai-errors';
import { AiProgressGateway } from '../ai/ai-progress.gateway';
import { AiRuntimeService } from '../ai/ai-runtime.service';
import { AiUsageService } from '../ai/ai-usage.service';
import {
  RetrievalService,
  type SourcePassageResult,
} from '../ai/retrieval.service';
import { AI_CREDIT_REASONS } from '../ai/credits.constants';
import type { SupportedAiLocale } from '../ai/utils/locale';
import { User, type UserDocument } from '../users/schemas/user.schema';
import {
  CHAT_PASSAGE_LIMIT_DEFAULT,
  buildChatPrompt,
  buildClassifyPrompt,
  buildKnowledgePrompt,
  classifyIntentSchema,
  knowledgeAnswerSchema,
  renderPassageRef,
  type ChatMode,
} from './prompts';
import {
  AiChatMessage,
  type AiChatMessageCoverage,
  type AiChatMessageDocument,
  type AiChatMessageRole,
  type AiSourceCitation,
} from './schemas/ai-chat-message.schema';
import {
  AiConversation,
  type AiConversationDocument,
} from './schemas/ai-conversation.schema';

type ChatAgentResult = {
  content: string;
  usedModel: 'openai';
  mode: ChatMode;
  coverage?: AiChatMessageCoverage;
  sourceCitations?: AiSourceCitation[];
  // Yalnızca eval harness'i (bkz. evaluateReply) tüketir — normal persist
  // akışı (persistAssistantReply/toMessageResponse) bu alanları okumaz, bu
  // yüzden eklenmeleri mevcut davranışı etkilemez. mode='bilgi' iken dolar:
  // usedPassages modelin knowledgeAnswerSchema çıktısındaki ham ref listesi
  // (sourceCitations'ın aksine dedup/sourceTitle birleştirmesi YAPILMAMIŞ),
  // retrievedPassages ise retrieval'in döndürdüğü TÜM pasajlardır (skor
  // kalibrasyonu için).
  usedPassages?: string[];
  retrievedPassages?: SourcePassageResult[];
  // classifyIntent'in ürettiği arama sorgusu (retrieval teşhisi için).
  searchQuery?: string;
};

/** classifyIntent çıktısı: mod + retrieval için bağlamdan arındırılmış sorgu. */
type ChatIntent = {
  mode: ChatMode;
  searchQuery: string;
};

const MAX_CONTEXT_MESSAGES = 10;
const MAX_SOURCE_CITATIONS = 3;
const TITLE_MAX_LENGTH = 60;

@Injectable()
export class AiChatService {
  private readonly logger = new Logger(AiChatService.name);

  constructor(
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
    private readonly runtime: AiRuntimeService,
    private readonly aiCreditsService: AiCreditsService,
    private readonly usageService: AiUsageService,
    private readonly retrievalService: RetrievalService,
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
   *
   * Persist sırası: ajan BAŞARIYLA tamamlanmadan konuşma/mesaj hiç
   * yaratılmaz — AI-only akışta fallback yok, bu yüzden başarısız bir
   * denemenin yarım kalmış kaydı olmamalı (bkz. AiPipelineError).
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

    await this.aiCreditsService.ensureCreditAccessForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    this.emitStep(socketId, 'creating', 'Sohbet başlatılıyor...');

    const agentResult = await this.runChatAgent({
      history: [{ role: 'user', content: firstMessage }],
      locale,
      socketId,
      flowId,
      userId: userObjectId,
    });

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

    await this.aiCreditsService.debitCreditForFlow(
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
   * createConversation'ın SSE karşılığı: aynı erken kredi kontrolü + geç
   * persist/debit sırasını izler, ama assistant yanıtını `streamText` ile
   * token-token yazar. Event sırası: token×N → done (hata → error).
   * REST createConversation korunur, bu yalnızca paralel bir akış rotasıdır.
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

      const wallet = await this.aiCreditsService.debitCreditForFlow(
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
        content: assistantMessage.content,
        remainingCredits: wallet.balance,
        conversationId: conversation._id.toString(),
        conversation: freshConversation,
        userMessage: this.toMessageResponse(userMessage),
        mode: agentResult.mode,
        coverage: agentResult.coverage,
        sourceCitations: agentResult.sourceCitations ?? [],
      });
      finish();
    } catch (error) {
      this.handleStreamFailure(
        res,
        flowId,
        locale,
        error,
        clientAborted,
        finish,
      );
    }
  }

  /**
   * Var olan bir konuşmaya yeni kullanıcı mesajı ekler, ajanı son 10 mesajlık
   * pencereyle çalıştırır ve — SADECE ajan başarıyla tamamlanırsa — kullanıcı
   * ve assistant mesajlarını birlikte kalıcılaştırır.
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

    await this.aiCreditsService.ensureCreditAccessForFlow(
      userObjectId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
    );

    this.emitStep(socketId, 'thinking', 'Mesajın değerlendiriliyor...');

    const priorHistory = await this.loadContextWindow(conversationObjectId);
    const history = [
      ...priorHistory,
      { role: 'user' as const, content: message },
    ].slice(-MAX_CONTEXT_MESSAGES);

    const agentResult = await this.runChatAgent({
      history,
      locale: (conversation.locale as SupportedAiLocale) ?? 'tr',
      socketId,
      flowId,
      userId: userObjectId,
    });

    const userMessage = await this.messageModel.create({
      conversationId: conversationObjectId,
      userId: userObjectId,
      role: 'user',
      content: message,
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

    const wallet = await this.aiCreditsService.debitCreditForFlow(
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
    const locale: SupportedAiLocale =
      (conversation?.locale as SupportedAiLocale) ?? 'tr';

    const { clientAborted, abortSignal, finish } = this.beginSse(req, res);
    this.emitStep(socketId, 'thinking', 'Mesajın değerlendiriliyor...');

    try {
      const priorHistory = await this.loadContextWindow(conversationObjectId);
      const history = [
        ...priorHistory,
        { role: 'user' as const, content: message },
      ].slice(-MAX_CONTEXT_MESSAGES);

      const agentResult = await this.runChatAgentStream({
        history,
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

      const userMessage = await this.messageModel.create({
        conversationId: conversationObjectId,
        userId: userObjectId,
        role: 'user',
        content: message,
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

      const wallet = await this.aiCreditsService.debitCreditForFlow(
        userObjectId,
        flowId,
        user.isPremium,
        promptHash,
        AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
      );

      this.writeSse(res, 'done', {
        messageId: assistantMessage._id.toString(),
        content: assistantMessage.content,
        remainingCredits: wallet.balance,
        conversationId: conversationObjectId.toString(),
        userMessage: this.toMessageResponse(userMessage),
        mode: agentResult.mode,
        coverage: agentResult.coverage,
        sourceCitations: agentResult.sourceCitations ?? [],
      });
      finish();
    } catch (error) {
      this.handleStreamFailure(
        res,
        flowId,
        locale,
        error,
        clientAborted,
        finish,
      );
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
      mode: item.mode,
      coverage: item.coverage,
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
   * YALNIZCA EVAL HARNESS'İ İÇİNDİR (bkz. `apps/api/scripts/eval/`).
   * `runChatAgent`'ı REST/SSE katmanlarından bağımsız çalıştırır: classify →
   * (gerekirse) retrieval → agent. Konuşma/mesaj PERSIST ETMEZ, kredi
   * DÜŞMEZ — yalnızca `AiUsageService.record` fire-and-forget kaydı (normal
   * akışta da olduğu gibi) `ai_usage_log`'a düşer, bu sayede eval runner'ı
   * `flowId` üzerinden gerçek maliyeti raporlayabilir.
   */
  async evaluateReply(input: {
    history: Array<{ role: AiChatMessageRole; content: string }>;
    locale: SupportedAiLocale;
    flowId: string;
    userId: string;
  }): Promise<{
    mode: ChatMode;
    coverage?: AiChatMessageCoverage;
    answer: string;
    sourceCitations: AiSourceCitation[];
    usedPassages: string[];
    retrievedPassages: SourcePassageResult[];
    searchQuery?: string;
  }> {
    const result = await this.runChatAgent({
      history: input.history,
      locale: input.locale,
      flowId: input.flowId,
      userId: input.userId,
    });

    return {
      mode: result.mode,
      coverage: result.coverage,
      answer: result.content,
      sourceCitations: result.sourceCitations ?? [],
      usedPassages: result.usedPassages ?? [],
      retrievedPassages: result.retrievedPassages ?? [],
      searchQuery: result.searchQuery,
    };
  }

  /**
   * Çok turlu sohbet ajanı. Tool kullanmaz: önce classifyIntent ile mod +
   * arama sorgusu belirlenir, 'bilgi' modunda source_passages araması
   * deterministik olarak yapılır ve sonuçlar prompt'a gömülür.
   *
   * AI-ONLY: burada hiçbir fallback metni yoktur. classifyIntent, retrieval
   * veya generateText herhangi bir noktada başarısız olursa AiPipelineError
   * (ya da alt sınıfı) doğrudan çağırana fırlatılır — çağıran taraf hiçbir
   * şey persist etmemeli/kredi düşmemelidir.
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
    const latestUserMessage = [...input.history]
      .reverse()
      .find((m) => m.role === 'user')?.content;

    this.emitStep(input.socketId, 'thinking', 'Mesajın değerlendiriliyor...');
    const intent = await this.classifyIntent(
      input.history,
      input.locale,
      latestUserMessage,
      undefined,
      { flowId: input.flowId, userId: input.userId },
    );

    let passages: SourcePassageResult[] = [];
    if (intent.mode === 'bilgi') {
      this.emitStep(
        input.socketId,
        'searchingKaynak',
        'Kaynaklar taranıyor...',
      );
      passages = await this.fetchSourcePassages(
        intent.searchQuery,
        input.flowId,
        input.userId,
      );
    } else {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }

    const messages = input.history.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    if (intent.mode === 'bilgi') {
      const system = buildKnowledgePrompt({ locale: input.locale, passages });

      const result = await this.runtime.withAiRetry(
        'chat',
        () =>
          generateText({
            model: this.runtime.model('chat'),
            ...this.runtime.settings('chat'),
            stopWhen: stepCountIs(1),
            system,
            messages,
            output: Output.object({ schema: knowledgeAnswerSchema }),
          }),
        { flowId: input.flowId },
      );

      void this.usageService.record({
        kind: 'chat',
        model: this.runtime.modelName('chat'),
        usage: result.totalUsage,
        steps: result.steps?.length,
        flowId: input.flowId,
        userId: input.userId,
      });

      return this.finalizeKnowledgeAnswer(
        result.output,
        passages,
        input.flowId,
        intent.searchQuery,
      );
    }

    const system = buildChatPrompt(input.locale);
    const result = await this.runtime.withAiRetry(
      'chat',
      () =>
        generateText({
          model: this.runtime.model('chat'),
          ...this.runtime.settings('chat'),
          stopWhen: stepCountIs(1),
          system,
          messages,
        }),
      { flowId: input.flowId },
    );

    void this.usageService.record({
      kind: 'chat',
      model: this.runtime.modelName('chat'),
      usage: result.totalUsage,
      steps: result.steps?.length,
      flowId: input.flowId,
      userId: input.userId,
    });

    const content = result.text?.trim();
    if (!content) {
      throw new AiInvalidOutputError('Sohbet modu için boş cevap üretildi.');
    }

    return { content, usedModel: 'openai', mode: 'chat' };
  }

  /**
   * runChatAgent'ın stream'li karşılığı: `generateText`/`generateObject`
   * yerine `streamText` kullanır, sınıflandırma/retrieval ve step-emit yan
   * etkileri birebir aynıdır. 'bilgi' modunda yapılandırılmış çıktı
   * (knowledgeAnswerSchema) `partialOutputStream` üzerinden akıtılır —
   * yalnızca `answer` alanının büyüyen kısmı `onToken`'a yazılır.
   *
   * Hata semantiği: hiç token akıtılmadan hata olursa `withAiRetry` bir kez
   * daha deneyebilir (bkz. canRetry). Token akıtıldıktan SONRA hata olursa
   * artık geri dönülemez — `AiStreamInterruptedError` fırlatılır (retryable
   * değildir) ve çağıran taraf `event: error` ile akışı sonlandırıp
   * persist/debit'i atlamalıdır. İstemci bağlantıyı keserse (`abortSignal`)
   * hata sınıflandırılıp fırlatılır ama çağıran taraf `clientAborted()`
   * bayrağına bakıp bunu sessizce yutar.
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
      passages = await this.fetchSourcePassages(
        intent.searchQuery,
        input.flowId,
        input.userId,
      );
    } else {
      this.emitStep(input.socketId, 'typing', 'Yazıyor...');
    }

    const messages = input.history.map((entry) => ({
      role: entry.role,
      content: entry.content,
    }));

    // İlk token akıtılana kadar tekrar deneme yapılabilir; sonrasında hayır.
    let anyTokenSent = false;
    const canRetry = () => !anyTokenSent && !input.abortSignal?.aborted;

    if (intent.mode === 'bilgi') {
      const system = buildKnowledgePrompt({ locale: input.locale, passages });

      return this.runtime.withAiRetry(
        'chat_stream',
        async () => {
          const result = streamText({
            model: this.runtime.model('chat'),
            ...this.runtime.settings('chat', { stream: true }),
            stopWhen: stepCountIs(1),
            system,
            messages,
            abortSignal: input.abortSignal,
            output: Output.object({ schema: knowledgeAnswerSchema }),
            onFinish: ({ totalUsage, steps }) => {
              void this.usageService.record({
                kind: 'chat_stream',
                model: this.runtime.modelName('chat'),
                usage: totalUsage,
                steps: steps?.length,
                flowId: input.flowId,
                userId: input.userId,
              });
            },
          });

          let emitted = '';
          try {
            for await (const partial of result.partialOutputStream) {
              const answer = (partial as { answer?: unknown }).answer;
              if (typeof answer !== 'string' || !answer.startsWith(emitted)) {
                // Model bazen ara adımda tutarsız/kısmi JSON üretebilir —
                // öncekiyle uyuşmayan parçalar sessizce atlanır, `emitted`
                // yalnızca geçerli (öneki koruyan) parçalarla ilerler.
                continue;
              }
              const delta = answer.slice(emitted.length);
              if (delta) {
                anyTokenSent = true;
                input.onToken(delta);
              }
              emitted = answer;
            }
          } catch (error) {
            if (anyTokenSent) {
              throw new AiStreamInterruptedError(
                this.describeError(error),
                error,
              );
            }
            throw error;
          }

          const final = await result.output;
          return this.finalizeKnowledgeAnswer(
            final,
            passages,
            input.flowId,
            intent.searchQuery,
          );
        },
        { flowId: input.flowId, canRetry },
      );
    }

    const system = buildChatPrompt(input.locale);
    return this.runtime.withAiRetry(
      'chat_stream',
      async () => {
        const result = streamText({
          model: this.runtime.model('chat'),
          ...this.runtime.settings('chat', { stream: true }),
          stopWhen: stepCountIs(1),
          system,
          messages,
          abortSignal: input.abortSignal,
          onFinish: ({ totalUsage, steps }) => {
            void this.usageService.record({
              kind: 'chat_stream',
              model: this.runtime.modelName('chat'),
              usage: totalUsage,
              steps: steps?.length,
              flowId: input.flowId,
              userId: input.userId,
            });
          },
        });

        try {
          for await (const delta of result.textStream) {
            if (!delta) continue;
            anyTokenSent = true;
            input.onToken(delta);
          }
        } catch (error) {
          if (anyTokenSent) {
            throw new AiStreamInterruptedError(
              this.describeError(error),
              error,
            );
          }
          throw error;
        }

        const content = (await result.text)?.trim();
        if (!content) {
          throw new AiInvalidOutputError(
            'Sohbet modu için boş cevap üretildi.',
          );
        }

        return { content, usedModel: 'openai' as const, mode: 'chat' as const };
      },
      { flowId: input.flowId, canRetry },
    );
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
   * Hata semantiği: AI-ONLY — sınıflandırma başarısız olursa (retry'lar
   * tükendikten sonra) AiPipelineError doğrudan fırlatılır, sessiz bir
   * moda düşülmez. Yalnızca BAŞARILI ama boş searchQuery döndüğü durumda
   * ham kullanıcı mesajına düşülür (bu retrieval kalitesi için, hata
   * toleransı için değil).
   */
  private async classifyIntent(
    history: Array<{ role: AiChatMessageRole; content: string }>,
    locale: SupportedAiLocale,
    latestUserMessage?: string,
    abortSignal?: AbortSignal,
    attribution?: { flowId?: string; userId?: Types.ObjectId | string },
  ): Promise<ChatIntent> {
    const tail = history.slice(-5);
    const conversationTail = tail
      .map(
        (m) => `${m.role === 'user' ? 'Kullanıcı' : 'Asistan'}: ${m.content}`,
      )
      .join('\n');

    const system = buildClassifyPrompt(locale);
    const prompt = `Konuşma (son turlar):\n${conversationTail}\n\nLocale: ${locale}`;

    const result = await this.runtime.withAiRetry(
      'classify',
      () =>
        generateObject({
          model: this.runtime.model('classify'),
          ...this.runtime.settings('classify'),
          schema: classifyIntentSchema,
          system,
          prompt,
          abortSignal,
        }),
      {
        flowId: attribution?.flowId,
        canRetry: () => !abortSignal?.aborted,
      },
    );

    void this.usageService.record({
      kind: 'classify',
      model: this.runtime.modelName('classify'),
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
          ? searchQuery?.trim() || latestUserMessage?.trim() || ''
          : '',
    };
  }

  /**
   * Retrieval adımı: yalnızca mode='bilgi' iken, sohbet ajanı çalışmaya
   * başlamadan ÖNCE deterministik olarak çağrılır. Sorgu, classifyIntent'in
   * ürettiği bağlamdan arındırılmış searchQuery'dir.
   *
   * AI-ONLY: retrieval hatası (AiRetrievalError) artık YUTULMAZ — çağırana
   * fırlatılır, akış hiçbir uydurma cevap üretmeden 503 ile sonlanır.
   */
  private async fetchSourcePassages(
    searchQuery: string | undefined,
    flowId?: string,
    userId?: Types.ObjectId | string,
  ): Promise<SourcePassageResult[]> {
    const query = searchQuery?.trim();
    if (!query) {
      return [];
    }
    return this.retrievalService.searchSourcePassages(
      query,
      this.passageLimit(),
      { flowId, userId: userId?.toString() },
    );
  }

  private passageLimit(): number {
    const raw = this.configService.get<string | number>(
      'AI_CHAT_PASSAGE_LIMIT',
    );
    const parsed = typeof raw === 'number' ? raw : parseInt(String(raw), 10);
    return Number.isFinite(parsed) && parsed > 0
      ? parsed
      : CHAT_PASSAGE_LIMIT_DEFAULT;
  }

  /**
   * knowledgeAnswerSchema çıktısını ({coverage, usedPassages, answer})
   * kalıcılaştırılabilir ChatAgentResult'a indirger: answer sanitize edilir,
   * coverage/citations tutarlılığı doğrulanır (bkz. resolveCoverageAndCitations).
   */
  private finalizeKnowledgeAnswer(
    parsed: {
      coverage: AiChatMessageCoverage;
      usedPassages: string[];
      answer: string;
    },
    passages: SourcePassageResult[],
    flowId?: string,
    searchQuery?: string,
  ): ChatAgentResult {
    const answer = this.sanitizeAnswer(parsed?.answer);
    if (!answer) {
      throw new AiInvalidOutputError('Bilgi modu için boş cevap üretildi.');
    }

    const { coverage, sourceCitations } = this.resolveCoverageAndCitations(
      parsed.coverage,
      parsed.usedPassages,
      passages,
      flowId,
    );

    return {
      content: answer,
      usedModel: 'openai',
      mode: 'bilgi',
      coverage,
      sourceCitations,
      usedPassages: parsed.usedPassages ?? [],
      retrievedPassages: passages,
      searchQuery,
    };
  }

  /**
   * Modelin bildirdiği coverage'ı, gerçekten kullanılan (usedPassages)
   * pasajlara göre doğrular. `coverage==='none'` ise pasaj referansı ne
   * olursa olsun citations boştur. `coverage!=='none'` ama hiçbir geçerli
   * ref yoksa (model tutarsız davranmış) coverage 'none'a düşürülür —
   * dayanaksız bir "full"/"partial" kullanıcıya asla gösterilmez.
   */
  private resolveCoverageAndCitations(
    coverage: AiChatMessageCoverage,
    usedPassages: string[] | undefined,
    passages: SourcePassageResult[],
    flowId?: string,
  ): { coverage: AiChatMessageCoverage; sourceCitations: AiSourceCitation[] } {
    if (coverage === 'none') {
      return { coverage: 'none', sourceCitations: [] };
    }

    const sourceCitations = this.buildSourceCitations(
      passages,
      usedPassages ?? [],
      flowId,
    );

    if (sourceCitations.length === 0) {
      this.runtime
        .flowLog(flowId)
        .warn(
          `coverage='${coverage}' bildirildi ama geçerli usedPassages yok; coverage 'none'a düşürülüyor.`,
        );
      return { coverage: 'none', sourceCitations: [] };
    }

    return { coverage, sourceCitations };
  }

  /**
   * mode='bilgi' pasajlarını mesaja iliştirilecek kısa kaynak referanslarına
   * (kitap adı + sayfa aralığı) indirger — ama SADECE modelin `usedPassages`
   * alanında gerçekten işaretlediği ref'ler için (bkz. renderPassageRef).
   * Tanınmayan ref'ler (modelin var olmayan bir "P9" üretmesi gibi) sessizce
   * düşürülür + loglanır. Aynı sourceTitle'dan gelen birden fazla pasaj tek
   * kayda birleştirilir (en düşük pageStart / en yüksek pageEnd).
   */
  private buildSourceCitations(
    passages: SourcePassageResult[],
    usedRefs: string[],
    flowId?: string,
  ): AiSourceCitation[] {
    const refToPassage = new Map<string, SourcePassageResult>();
    passages.forEach((passage, i) => {
      refToPassage.set(renderPassageRef(i), passage);
    });

    const unknownRefs = usedRefs.filter((ref) => !refToPassage.has(ref));
    if (unknownRefs.length > 0) {
      this.runtime
        .flowLog(flowId)
        .warn(
          `Tanınmayan pasaj referansları atlandı: ${unknownRefs.join(', ')}`,
        );
    }

    const bySourceTitle = new Map<string, AiSourceCitation>();
    for (const ref of usedRefs) {
      const passage = refToPassage.get(ref);
      if (!passage || !passage.sourceTitle) continue;

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

  /**
   * Modelin answer alanına sızdırabileceği pasaj referanslarını ("P3",
   * "#P3", "(P3)") temizler — prompt bunu yasaklar ama yapılandırılmış
   * çıktıda garanti yok, bu yüzden son bir savunma hattı olarak sanitize
   * edilir. Ardından temizlik nedeniyle oluşan çift boşluk/boşluk+noktalama
   * artıkları düzeltilir.
   */
  private sanitizeAnswer(answer: string | undefined | null): string {
    if (!answer) return '';

    return answer
      .replace(/\(\s*#?P\d+\s*\)/gi, '')
      .replace(/(^|\s)#?P\d+(?=$|[\s.,;:!?])/gi, '$1')
      .replace(/[ \t]+([.,;:!?])/g, '$1')
      .replace(/[ \t]{2,}/g, ' ')
      .trim();
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

      await this.aiCreditsService.ensureCreditAccessForFlow(
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

  /**
   * SSE akışı sırasında (başlıklar zaten yazıldıktan sonra) oluşan her
   * hatayı standardize eder: istemci zaten bağlantıyı kesmişse yalnızca
   * loglanır; `AiPipelineError` ise `AI_UNAVAILABLE` + `reason`, aksi halde
   * `INTERNAL` koduyla `event: error` yazılır. Mesaj her durumda
   * `AI_UNAVAILABLE_MESSAGE[locale]` — gerçek neden asla istemciye
   * sızdırılmaz (yalnızca `reason` alanına, telemetri için).
   */
  private handleStreamFailure(
    res: Response,
    flowId: string,
    locale: SupportedAiLocale,
    error: unknown,
    clientAborted: () => boolean,
    finish: () => void,
  ) {
    const { error: logError } = this.runtime.flowLog(flowId);

    if (clientAborted()) {
      logError(
        `Stream istemci tarafından kesildi: ${this.describeError(error)}`,
      );
      finish();
      return;
    }

    if (error instanceof AiPipelineError) {
      logError(`AI pipeline hatası (reason=${error.reason}): ${error.message}`);
      this.writeSse(res, 'error', {
        code: AI_UNAVAILABLE_CODE,
        reason: error.reason,
        requestId: flowId,
        message: AI_UNAVAILABLE_MESSAGE[locale],
      });
    } else {
      logError(`Beklenmeyen stream hatası: ${this.describeError(error)}`);
      this.writeSse(res, 'error', {
        code: 'INTERNAL',
        requestId: flowId,
        message: AI_UNAVAILABLE_MESSAGE[locale],
      });
    }
    finish();
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
      content: agentResult.content,
      usedModel: agentResult.usedModel,
      mode: agentResult.mode,
      coverage: agentResult.coverage,
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
      mode: doc.mode,
      coverage: doc.coverage,
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
