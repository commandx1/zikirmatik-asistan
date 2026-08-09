import { createHash } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { generateObject, generateText, stepCountIs, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { EmbeddingService } from '../embedding/embedding.service';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiUsageService } from './ai-usage.service';
import {
  SourcePassage,
  type SourcePassageDocument,
} from './schemas/source-passage.schema';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { QueryAiRecommendationsDto } from './dto/query-ai-recommendations.dto';
import { SelectAiRecommendationDto } from './dto/select-ai-recommendation.dto';
import {
  AiRecommendation,
  type AiRecommendationDocument,
} from './schemas/ai-recommendation.schema';
import {
  RecommendationCache,
  type RecommendationCacheDocument,
} from './schemas/recommendation-cache.schema';
import {
  AiCreditWallet,
  type AiCreditWalletDocument,
} from './schemas/ai-credit-wallet.schema';
import {
  AiCreditLedger,
  type AiCreditLedgerDocument,
} from './schemas/ai-credit-ledger.schema';
import { fallbackRecommend } from './utils/fallback-recommender';
import type { LocalizedText } from '../../common/types/localized-text';
import { normalizeText } from './utils/text-normalize';
import type { SupportedAiLocale } from './utils/locale';
import {
  AI_CREDIT_DEFAULT_TOPUP_PRODUCTS,
  AI_CREDIT_INSUFFICIENT_CODE,
  AI_CREDIT_REASONS,
  type AiCreditReason,
  FREE_DAILY_CREDIT_AMOUNT,
  FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
  PREMIUM_MONTHLY_CREDIT_AMOUNT,
} from './credits.constants';

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

type UsedModel = 'openai' | 'fallback' | 'cache';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

type SourcePassageLean = SourcePassage & { _id: Types.ObjectId };

// Kaynak pasajı (kitap RAG) araması sonucu. Yalnızca vektör tabanlı arama
// sağlanır. AiChatService 'bilgi' modunda bunu kullanır.
export type SourcePassageResult = {
  sourceId: string;
  text: string;
  sourceTitle: string;
  // Pasajın kitap içindeki bölüm başlığı (varsa). Prompt'a gömüldüğünde
  // modelin pasajı doğru bağlamda okumasına yardım eder.
  sectionHeading?: string;
  pageStart: number;
  pageEnd: number;
  type: string;
  score?: number;
};

type CreditGrantStatus = {
  dailyGrant: number;
  monthlyGrant: number;
};

type CreditState = CreditGrantStatus & {
  balance: number;
  isPremium: boolean;
  wallet: AiCreditWalletDocument;
};

// Ajanın LLM'e döndürdüğü arama sonucu — LLM şu an Türkçe akıl yürütür, bu
// yüzden virtue yalnızca TR taşınır; name ise ileride İngilizce yanıt
// üretimine hazır olsun diye tam LocalizedText olarak taşınır.
export type SearchResult = {
  id: string;
  name: LocalizedText;
  virtue: string;
  tags: string[];
  categories: string[];
  timeOfDay: string;
  suitableFor: string[];
};

type AgentResult = {
  ids: string[];
  summary: string;
  items: Array<{ id: string; reason: string }>;
  offTopic?: boolean;
  /**
   * Faz F — ön-retrieval (RAG) ile summary'yi grounding etmek için kullanılan
   * siyer kaynak pasajları. Şimdilik yalnızca backend'de tutulur/loglanır;
   * client response'una taşınmaz (UI ayrı ele alınacak).
   */
  sources?: SourcePassageResult[];
};

const MONGO_FALLBACK_REASONING =
  'Niyetine en uygun zikirleri sana göre seçtim.';

/**
 * freeText'te tags/suitableFor/categories alanlarıyla hiçbir kelime örtüşmesi
 * bulunamadığında (fallbackRecommend.hasTextualSignal === false) kullanıcıya
 * sunulacak, geniş kitleye uygun genel kategoriler.
 */
const GENERAL_FALLBACK_CATEGORIES = ['genel', 'dua', 'şükür', 'sabır', 'huzur'];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private topupCatalogCache?: Map<string, number>;
  private topupCatalogCacheRaw?: string;

  constructor(
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
    @InjectModel(AiRecommendation.name)
    private readonly aiRecommendationModel: Model<AiRecommendationDocument>,
    @InjectModel(RecommendationCache.name)
    private readonly recommendationCacheModel: Model<RecommendationCacheDocument>,
    @InjectModel(AiCreditWallet.name)
    private readonly aiCreditWalletModel: Model<AiCreditWalletDocument>,
    @InjectModel(AiCreditLedger.name)
    private readonly aiCreditLedgerModel: Model<AiCreditLedgerDocument>,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    @InjectModel(SourcePassage.name)
    private readonly sourcePassageModel: Model<SourcePassageDocument>,
    private readonly embeddingService: EmbeddingService,
    private readonly usageService: AiUsageService,
  ) {}

  private emitStep(socketId: string | undefined, key: string, message: string) {
    if (socketId) {
      this.progressGateway.emitStep(socketId, key, message);
    }
  }

  async createRecommendation(
    payload: CreateAiRecommendationDto,
    locale: SupportedAiLocale = 'tr',
  ) {
    const startedAt = Date.now();
    const userId = this.asObjectId(
      payload.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    const flowId = payload.flowId?.trim();
    if (!flowId) {
      throw new BadRequestException('flowId zorunludur.');
    }
    const freeText = payload.freeText?.trim() || undefined;
    const selectedCategory = payload.selectedCategory?.trim() || undefined;
    const socketId = payload.socketId;
    this.emitStep(socketId, 'analyzing', 'Niyetin analiz ediliyor...');
    this.logger.log(
      `[start] userId=${userId.toString()} freeText=${freeText ? `"${freeText.slice(0, 60)}"` : '(yok)'}`,
    );

    const user = await this.ensureUserExists(userId);
    const promptHash = this.computePromptHash({ freeText, selectedCategory });
    await this.ensureCreditAccessForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
    );

    const maxRecommendations = payload.maxRecommendations ?? 5;
    const timeContext = payload.timeContext ?? this.defaultTimeContext();

    // ── Kullanıcı kategori seçti (clarification sonrası) ─────────────────────
    // Agent/cache devre dışı bırakılır: kullanıcının kendi seçimi en güvenilir
    // sinyaldir, tahmine gerek yoktur. "genel" seçilirse zaman tabanlı öneri.
    if (selectedCategory) {
      this.logger.log(`[category] kullanıcı seçimi: "${selectedCategory}"`);
      const recentDhikrIdsForCategory = await this.getRecentDhikrIds(userId);
      const categoryCandidates =
        selectedCategory === 'genel'
          ? await this.getTimeBasedCandidates(
              timeContext,
              recentDhikrIdsForCategory,
              maxRecommendations,
            )
          : await this.searchDhikrsByCategories(
              [selectedCategory],
              recentDhikrIdsForCategory,
              maxRecommendations,
            );

      const finalCandidates =
        categoryCandidates.length > 0
          ? categoryCandidates
          : await this.getTimeBasedCandidates(
              timeContext,
              recentDhikrIdsForCategory,
              maxRecommendations,
            );

      if (finalCandidates.length === 0) {
        throw new NotFoundException(
          'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
        );
      }

      const result = await this.finalizeRecommendation({
        userId,
        freeText,
        timeContext,
        reasoning: MONGO_FALLBACK_REASONING,
        safeRecommendedIds: finalCandidates.map((c) => c._id.toString()),
        dhikrMapById: new Map(
          finalCandidates.map((c) => [c._id.toString(), c]),
        ),
        usedModel: 'fallback',
        locale,
      });
      const wallet = await this.debitCreditForFlow(
        userId,
        flowId,
        user.isPremium,
        promptHash,
      );
      this.logger.log(`[done] category path — ${Date.now() - startedAt}ms`);
      return { ...result, remainingCredits: wallet.balance };
    }

    // ── Cache lookup ────────────────────────────────────────────────────────
    const catalogVersion = await this.getCatalogVersion();
    const cacheKey = this.computeCacheKey({
      freeText,
      timeContext,
      maxRecommendations,
      catalogVersion,
      locale,
    });
    this.logger.log(`[cache] lookup key=${cacheKey.slice(0, 12)}…`);

    const cached = await this.recommendationCacheModel
      .findOne({ cacheKey })
      .lean()
      .exec();
    if (cached) {
      const cachedIdStrings = cached.recommendedDhikrIds.map((id) =>
        id.toString(),
      );
      const cachedDhikrs = await this.loadDhikrsByIds(cachedIdStrings);
      if (cachedDhikrs.length > 0) {
        this.logger.log(
          `[cache] HIT → ${cachedDhikrs.length} zikir (${Date.now() - startedAt}ms)`,
        );
        const validIds = cachedIdStrings.filter((id) =>
          cachedDhikrs.some((d) => d._id.toString() === id),
        );
        const dhikrMapById = new Map(
          cachedDhikrs.map((d) => [d._id.toString(), d]),
        );
        const result = await this.finalizeRecommendation({
          userId,
          freeText,
          timeContext,
          reasoning: cached.reasoning || MONGO_FALLBACK_REASONING,
          safeRecommendedIds: validIds,
          dhikrMapById,
          usedModel: 'cache',
          locale,
        });
        const wallet = await this.debitCreditForFlow(
          userId,
          flowId,
          user.isPremium,
          promptHash,
        );
        this.logger.log(`[done] cache path — ${Date.now() - startedAt}ms`);
        return { ...result, remainingCredits: wallet.balance };
      }
    }
    this.logger.log(`[cache] MISS`);

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    // ── Agent ───────────────────────────────────────────────────────────────
    this.emitStep(socketId, 'thinking', 'Zikir veritabanı hazırlanıyor...');
    this.logger.log(`[agent] başlatılıyor…`);
    const agentResult = await this.runRecommendationAgent({
      freeText,
      timeContext,
      recentDhikrIds,
      maxRecommendations,
      socketId,
      locale,
      flowId,
      userId,
    });

    // ── Off-topic ───────────────────────────────────────────────────────────
    if (agentResult?.offTopic) {
      this.logger.log(
        `[off-topic] tespit edildi — ${Date.now() - startedAt}ms`,
      );
      return {
        offTopic: true as const,
        message:
          'Ben yalnızca zikir ve dua önerisi yapabilen bir asistanım. Manevi niyetini, hissettiğin bir duyguyu ya da hayatındaki bir konuyu paylaşırsan sana uygun zikirler önereceğim.',
        recommendedIds: [],
        items: [],
        usedModel: 'openai' as const,
      };
    }

    // ── Validate ────────────────────────────────────────────────────────────
    let safeRecommendedIds: string[] = [];
    let dhikrMapById: Map<string, DhikrLean> = new Map();
    let reasoning = MONGO_FALLBACK_REASONING;
    let usedModel: UsedModel = 'fallback';

    if (agentResult && agentResult.ids.length > 0) {
      this.logger.log(
        `[validate] agent ${agentResult.ids.length} id seçti → DB'de doğrulanıyor`,
      );
      const selectedDhikrs = await this.loadDhikrsByIds(agentResult.ids);
      const tempMap = new Map(selectedDhikrs.map((d) => [d._id.toString(), d]));
      const validIds = agentResult.ids
        .filter((id) => tempMap.has(id))
        .slice(0, maxRecommendations);

      if (validIds.length > 0) {
        this.logger.log(
          `[validate] ok — ${validIds.length}/${agentResult.ids.length} id geçerli`,
        );
        safeRecommendedIds = validIds;
        dhikrMapById = tempMap;
        reasoning = this.composeReasoning(
          agentResult.summary,
          agentResult.items,
          tempMap,
        );
        usedModel = 'openai';
      } else {
        this.logger.warn(`[validate] tüm id'ler geçersiz → fallback'e düşüyor`);
      }
    }

    // ── Fallback ────────────────────────────────────────────────────────────
    if (safeRecommendedIds.length === 0) {
      this.emitStep(socketId, 'fallback', 'Genel öneriler hazırlanıyor...');
      this.logger.log(`[fallback] akıllı fallback başlatılıyor`);
      const smartFallback = await this.getSmartFallbackCandidates(
        freeText,
        timeContext,
        recentDhikrIds,
        maxRecommendations,
      );

      if (smartFallback.kind === 'clarification') {
        this.logger.log(
          `[fallback] belirsiz → kullanıcıdan kategori seçimi isteniyor: [${smartFallback.suggestedCategories.join(', ')}]`,
        );
        return {
          needsClarification: true as const,
          message:
            'Niyetini biraz daha netleştirir misin? Sana en uygun olanı seçebilirsin:',
          suggestedCategories: [...smartFallback.suggestedCategories, 'genel'],
          recommendedIds: [],
          items: [],
          usedModel: 'fallback' as const,
        };
      }

      const fallbackCandidates = smartFallback.candidates;
      if (fallbackCandidates.length === 0) {
        throw new NotFoundException(
          'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
        );
      }
      this.logger.log(`[fallback] ${fallbackCandidates.length} zikir bulundu`);
      safeRecommendedIds = fallbackCandidates.map((c) => c._id.toString());
      dhikrMapById = new Map(
        fallbackCandidates.map((c) => [c._id.toString(), c]),
      );
      reasoning = MONGO_FALLBACK_REASONING;
      usedModel = 'fallback';
    }

    // ── Finalize ────────────────────────────────────────────────────────────
    this.emitStep(socketId, 'finalizing', 'Öneriler hazırlanıyor...');
    this.logger.log(
      `[finalize] model=${usedModel} count=${safeRecommendedIds.length}`,
    );
    const result = await this.finalizeRecommendation({
      userId,
      freeText,
      timeContext,
      reasoning,
      safeRecommendedIds,
      dhikrMapById,
      usedModel,
      locale,
    });

    // ── Cache write ─────────────────────────────────────────────────────────
    // Yalnızca OpenAI (agent) sonuçları cache'lenir — fallback çıktısı düşük
    // kaliteli olabilir ve cache'e yazılırsa aynı prompt için donup kalır.
    if (safeRecommendedIds.length > 0 && usedModel === 'openai') {
      await this.writeCache(cacheKey, safeRecommendedIds, reasoning, usedModel);
      this.logger.log(`[cache] yazıldı`);
    } else {
      this.logger.log(`[cache] atlandı (usedModel=${usedModel})`);
    }

    this.logger.log(
      `[done] model=${usedModel} count=${safeRecommendedIds.length} — ${Date.now() - startedAt}ms`,
    );
    const wallet = await this.debitCreditForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
    );
    return { ...result, remainingCredits: wallet.balance };
  }

  /**
   * Kullanıcının kısa/örtük ifadesini ("canım sıkkın") anlamsal aramaya
   * elverişli bir niyet cümlesine açar ve aynı turda off-topic tespitini yapar.
   * Etiket (tag/kategori) ÜRETMEZ — çıktı tek bir vektöre dönüşecek serbest
   * metindir; bu sayede eskiden LLM'in ürettiği etiketlerin rerank skorunu
   * domine etmesinden kaynaklanan çarpıtma ortadan kalkar.
   *
   * Hata/timeout durumunda sessizce {offTopic:false, expandedQuery:freeText}
   * döner — akış ham metinle devam eder, kullanıcı bir şey kaybetmez.
   */
  private async expandIntent(input: {
    freeText: string;
    timeOfDay: string;
    locale: SupportedAiLocale;
    modelName: string;
    openaiProvider: ReturnType<typeof createOpenAI>;
    flowId?: string;
    userId?: Types.ObjectId | string;
  }): Promise<{ offTopic: boolean; expandedQuery: string }> {
    const fallback = { offTopic: false, expandedQuery: input.freeText };
    const timeoutController = new AbortController();
    const timeout = setTimeout(() => timeoutController.abort(), 4000);

    try {
      const result = await generateObject({
        model: input.openaiProvider(input.modelName),
        abortSignal: timeoutController.signal,
        temperature: 0,
        schema: z.object({
          offTopic: z.boolean(),
          expandedQuery: z.string(),
        }),
        system: [
          'Sen bir İslami zikir öneri sisteminin niyet genişletme katmanısın.',
          'Kullanıcının serbest metnini alıp iki şey üretirsin.',
          '',
          '**offTopic — yalnızca şu durumlarda true:**',
          '- Anlamsız/rastgele karakter dizileri (ör. "sllsd", "asdfg", "123abc")',
          '- Genel sohbet, selamlama, kısa tepki veya iltifat (ör. "teşekkürler", "harikasın", "nasılsın")',
          '- Model, sistem veya teknik sorular',
          '- İslami yaşam, manevi hal, duygu veya niyetle HİÇBİR bağlantısı olmayan içerik',
          'Bunların dışındaki her şey (üzüntü, şükür, kaygı, hastalık, yolculuk, şükran, belirsiz manevi arayış) false olmalıdır.',
          '',
          '**expandedQuery — anlamsal vektör araması için niyet cümlesi:**',
          '- Kullanıcının kısa veya örtük ifadesini, altında yatan manevi ihtiyacı açan 1-2 cümleye genişlet.',
          '- Örnek: "canım sıkkın" → "iç sıkıntısı, keder ve daralma hali; gönül ferahlığı, teselli, sabır ve huzur arayışı".',
          '- Eş anlamlı ve yakın kavramları serbestçe kullan; arama kapsamını genişletmek amaçtır.',
          '- Düz metin yaz. Etiket listesi, kategori adı, JSON veya madde işareti KULLANMA.',
          '- offTopic true ise expandedQuery boş string olabilir.',
          '',
          `Bilgi: şu anki zaman dilimi "${input.timeOfDay}". Kullanıcı açıkça zaman belirtmediyse bunu expandedQuery'ye katma.`,
        ].join('\n'),
        prompt: `Kullanıcı metni: ${input.freeText}\n\nLocale: ${input.locale}`,
      });

      void this.usageService.record({
        kind: 'expand',
        model: input.modelName,
        usage: result.usage,
        flowId: input.flowId,
        userId: input.userId,
      });

      const expanded = result.object.expandedQuery?.trim();
      return {
        offTopic: result.object.offTopic,
        expandedQuery: expanded || input.freeText,
      };
    } catch (error) {
      this.logger.warn(
        `Niyet genişletme başarısız, ham metinle devam ediliyor: ${this.describeError(error)}`,
      );
      return fallback;
    } finally {
      clearTimeout(timeout);
    }
  }

  /**
   * Öneri akışı: (1) ucuz niyet genişletme + off-topic turu, (2) deterministik
   * aday çekme (saf $vectorSearch — LLM etiket üretmez), (3) tek LLM turunda
   * seçim + metin yazımı.
   *
   * OPENAI_API_KEY yoksa, aday bulunamazsa veya LLM çağrısı başarısız olursa
   * null döner → çağıran taraftaki fallback zinciri devreye girer.
   */
  private async runRecommendationAgent(input: {
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    maxRecommendations: number;
    socketId?: string;
    locale: SupportedAiLocale;
    flowId?: string;
    userId?: Types.ObjectId | string;
  }): Promise<AgentResult | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, öneriler fallback ile üretilecek.',
      );
      return null;
    }

    const modelName =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-5-mini';
    const openaiProvider = createOpenAI({ apiKey });
    const timeOfDay = this.resolveTimeOfDay(input.timeContext);
    // Denge kaldıraçları — env ile ayarlanabilir (default davranış değişmez).
    // ai_usage_log'daki gerçek step/token dağılımına göre tune edilir.
    const readIntEnv = (key: string, fallback: number): number => {
      const raw = Number(this.configService.get<string | number>(key));
      return Number.isInteger(raw) && raw > 0 ? raw : fallback;
    };
    const ragPassageLimit = readIntEnv('AI_RAG_PASSAGE_LIMIT', 4);
    const candidateLimit = Math.min(readIntEnv('AI_CANDIDATE_LIMIT', 15), 20);

    // ── 1. Niyet genişletme + off-topic ──────────────────────────────────────
    // freeText yoksa bu tur hiç çalışmaz (zaman tabanlı öneri yolu).
    const trimmedFreeText = input.freeText?.trim();
    let searchQuery = trimmedFreeText;
    if (trimmedFreeText) {
      this.emitStep(
        input.socketId,
        'expanding',
        'Niyetin derinleştiriliyor...',
      );
      const expansion = await this.expandIntent({
        freeText: trimmedFreeText,
        timeOfDay,
        locale: input.locale,
        modelName,
        openaiProvider,
        flowId: input.flowId,
        userId: input.userId,
      });
      if (expansion.offTopic) {
        this.logger.log(`[agent:expand] off-topic tespit edildi`);
        return { ids: [], summary: '', items: [], offTopic: true };
      }
      searchQuery = expansion.expandedQuery;
      this.logger.log(
        `[agent:expand] "${trimmedFreeText.slice(0, 40)}" → "${searchQuery.slice(0, 80)}"`,
      );
    }

    // ── 2. Faz F: Ön-retrieval (RAG) ─────────────────────────────────────────
    // Genişletilmiş niyetle siyer kaynaklarından ilgili pasajları çekip system
    // prompt'a grounding bağlamı olarak enjekte ederiz. Deterministik, tek tur.
    const sources: SourcePassageResult[] = searchQuery
      ? await this.searchSourcePassagesForAgent(searchQuery, ragPassageLimit)
      : [];
    if (sources.length > 0) {
      this.logger.log(
        `[agent:rag] ${sources.length} kaynak pasaj enjekte edildi (top skor=${sources[0].score?.toFixed(3) ?? '-'})`,
      );
    }

    const sourceBlock =
      sources.length > 0
        ? [
            '',
            '**KAYNAK BAĞLAMI (siyer/İslami kaynaklardan alınmıştır):**',
            'Aşağıdaki pasajları yalnızca summary/reason metnini zenginleştirmek ve',
            'doğru bağlamı yakalamak için kullan. Zikir ID üretme, pasajları birebir',
            'kopyalama; kendi sıcak ve samimi dilinle özetle.',
            ...sources.map(
              (s, i) =>
                `${i + 1}. [${s.sourceTitle}, s.${s.pageStart}-${s.pageEnd}] ${s.text}`,
            ),
          ].join('\n')
        : '';

    // ── 3. Deterministik aday çekme ──────────────────────────────────────────
    // freeText varsa params BOŞ geçilir → hasAnySignal false → _tagScore 0 →
    // sıralama tamamen $vectorSearch skoruna aittir (saf anlamsal arama).
    // freeText yoksa timeOfDay bonuslu $setIntersection yoluna düşülür.
    this.emitStep(input.socketId, 'searching', 'Zikirler taranıyor...');
    const candidates = await this.searchDhikrsForAgent(
      searchQuery
        ? { limit: candidateLimit }
        : { timeOfDay, limit: candidateLimit },
      input.recentDhikrIds,
      searchQuery,
    );
    this.logger.log(
      `[agent:retrieval] ${candidates.length} aday (mode=${searchQuery ? 'vector' : 'timeOfDay'})`,
    );
    if (candidates.length === 0) {
      this.logger.warn('[agent:retrieval] aday bulunamadı → fallback');
      return null;
    }

    const systemPrompt = [
      'Sen bir İslami zikir öneri asistanısın.',
      '',
      '**GÖREVİN:**',
      'Sana ADAY ZİKİRLER listesi verildi. Kullanıcının niyetine en uygun olanları seç ve selectRecommendations ile raporla. Başka araç yok, başka adım yok.',
      '',
      '**SEÇİM KRİTERLERİ:**',
      '- Niyete EN DOĞRUDAN hitap eden zikirleri öncele; dolaylı/teğet ilgilileri alta koy',
      "- YALNIZCA aday listesindeki id'leri kullan, liste dışından ID üretme",
      `- Maksimum ${input.maxRecommendations} zikir; doldurmak için alakasız ekleme yapma`,
      '- Listede niyete gerçekten uyan daha az zikir varsa daha az öner',
      '',
      '**selectRecommendations YAZIM KURALLARI:**',
      '- summary: Kullanıcının niyetini samimiyetle kabul eden sıcak 3-5 cümle. "inşallah", "Allah kabul etsin", "maşallah" gibi ifadeler kullan. Zikir ismi yazma.',
      '- reason: Her zikir için fazilet/etiket içeriğinden türeyen 1-2 cümle. Doğrudan kullanıcıya yönelik, insani ve sıcak bir dil kullan.',
      '',
      sourceBlock,
      input.locale === 'en'
        ? 'Write the summary and each reason in English.'
        : 'Write the summary and each reason in Turkish.',
    ].join('\n');

    const userPrompt = [
      `Kullanıcı niyeti: ${input.freeText ?? '(belirtilmedi — zaman tabanlı genel öneri yap)'}`,
      `Zaman dilimi: ${timeOfDay}`,
      '',
      'ADAY ZİKİRLER:',
      ...candidates.map((c) => JSON.stringify(c)),
    ].join('\n');

    let agentResult: AgentResult | null = null;

    try {
      const genResult = await generateText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(2),
        system: systemPrompt,
        prompt: userPrompt,
        onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
          const tools = toolCalls?.map((t) => t.toolName).join(', ') || '-';
          this.logger.debug(
            `[agent step ${stepNumber}] tools=[${tools}] finish=${finishReason}`,
          );
        },
        tools: {
          selectRecommendations: tool({
            description:
              'Seçilen zikirleri ve gerekçelerini raporla. Görev bu araçla tamamlanır.',
            inputSchema: z.object({
              dhikrIds: z.array(z.string()),
              summary: z.string(),
              items: z.array(z.object({ id: z.string(), reason: z.string() })),
            }),
            execute: (params) => {
              this.emitStep(
                input.socketId,
                'selecting',
                'Sana en uygun zikirler seçiliyor...',
              );
              this.logger.log(
                `[agent:selectRecommendations] ${params.dhikrIds.length} zikir seçildi`,
              );
              agentResult = {
                ids: params.dhikrIds,
                summary: params.summary,
                items: params.items,
              };
              return { success: true };
            },
          }),
        },
      });

      void this.usageService.record({
        kind: 'recommend',
        model: modelName,
        usage: genResult.totalUsage,
        steps: genResult.steps?.length,
        flowId: input.flowId,
        userId: input.userId,
      });
    } catch (error) {
      this.logger.warn(
        `Agent çalıştırılamadı, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return null;
    }

    // Faz F: ön-retrieval sonuçlarını backend sonucuna iliştir (UI'a taşınmaz).
    // agentResult closure içinde atandığından TS onu ana akışta 'null'a daraltır;
    // cast ile bu daralmayı kırıyoruz.
    const finalResult = agentResult as AgentResult | null;
    if (finalResult && sources.length > 0) {
      finalResult.sources = sources;
    }
    return finalResult;
  }

  /**
   * suitableFor/tags/categories için $setIntersection tabanlı ağırlıklı skor
   * (suitableFor×3, tags×2, categories×1) ve timeOfDay eşleşirse +2 bonus
   * üreten aggregation alanlarını kurar. hem literal kesişim yolunda hem de
   * vector search sonrası rerank katmanında paylaşılır. timeOfDay HİÇBİR
   * zaman sert filtre değildir, yalnızca bonus olarak eklenir.
   */
  private buildIntersectionScoreFields(params: {
    suitableFor?: string[];
    tags?: string[];
    categories?: string[];
    timeOfDay?: string;
  }): unknown[] {
    const scoreFields: unknown[] = [];
    const hasSuitableFor = (params.suitableFor?.length ?? 0) > 0;
    const hasTags = (params.tags?.length ?? 0) > 0;
    const hasCategories = (params.categories?.length ?? 0) > 0;
    const hasTimeOfDay = !!params.timeOfDay && params.timeOfDay !== 'any';

    if (hasSuitableFor) {
      scoreFields.push({
        $multiply: [
          3,
          {
            $size: {
              $ifNull: [
                {
                  $setIntersection: ['$suitableFor', params.suitableFor!],
                },
                [],
              ],
            },
          },
        ],
      });
    }
    if (hasTags) {
      scoreFields.push({
        $multiply: [
          2,
          {
            $size: {
              $ifNull: [{ $setIntersection: ['$tags', params.tags!] }, []],
            },
          },
        ],
      });
    }
    if (hasCategories) {
      scoreFields.push({
        $multiply: [
          1,
          {
            $size: {
              $ifNull: [
                {
                  $setIntersection: ['$categories', params.categories!],
                },
                [],
              ],
            },
          },
        ],
      });
    }
    if (hasTimeOfDay) {
      scoreFields.push({
        $cond: [{ $eq: ['$timeOfDay', params.timeOfDay] }, 2, 0],
      });
    }

    return scoreFields;
  }

  /**
   * Agent'ın searchDhikrs tool'unda çalışan MongoDB sorgusu.
   * freeText mevcutsa ve embedding üretilebiliyorsa önce Atlas
   * $vectorSearch (dhikr_vector_index) ile aday havuzu getirir, ardından bu
   * adaylar üzerine mevcut tag/kategori/timeOfDay skorunu (soft rerank
   * katmanı) uygular. freeText yoksa veya embedding üretilemezse (OpenAI
   * erişilemez/embed() null) mevcut $setIntersection tabanlı skor veya
   * parametresiz popülerlik sıralamasına sessizce düşer.
   */
  async searchDhikrsForAgent(
    params: {
      suitableFor?: string[];
      tags?: string[];
      categories?: string[];
      timeOfDay?: string;
      limit?: number;
    },
    recentDhikrIds: string[],
    freeText?: string,
  ): Promise<SearchResult[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const baseMatch: Record<string, unknown> = {
      isVerified: true,
      isActive: true,
      ...(recentObjectIds.length > 0 ? { _id: { $nin: recentObjectIds } } : {}),
    };

    // Tavan 20: $vectorSearch.limit = limit*3 = 60 olur ve numCandidates (100)
    // altında kaldığı için Atlas index'inde değişiklik gerekmez.
    const limit = Math.min(params.limit ?? 10, 20);
    const hasSuitableFor = (params.suitableFor?.length ?? 0) > 0;
    const hasTags = (params.tags?.length ?? 0) > 0;
    const hasCategories = (params.categories?.length ?? 0) > 0;
    const hasTimeOfDay = !!params.timeOfDay && params.timeOfDay !== 'any';
    const hasAnySignal =
      hasSuitableFor || hasTags || hasCategories || hasTimeOfDay;

    const trimmedFreeText = freeText?.trim();
    if (trimmedFreeText) {
      const { vector: queryVector, usage: embeddingUsage } =
        await this.embeddingService.embedWithUsage(trimmedFreeText);
      if (embeddingUsage) {
        void this.usageService.record({
          kind: 'embedding',
          model: this.embeddingService.model,
          usage: embeddingUsage,
        });
      }
      if (queryVector) {
        try {
          const scoreFields = this.buildIntersectionScoreFields(params);

          const results = await this.dhikrModel
            .aggregate<DhikrLean>([
              {
                $vectorSearch: {
                  index: 'dhikr_vector_index',
                  path: 'embedding',
                  queryVector,
                  numCandidates: 100,
                  limit: limit * 3,
                },
              },
              { $match: baseMatch },
              {
                $addFields: {
                  _vectorScore: { $meta: 'vectorSearchScore' },
                  _tagScore: scoreFields.length > 0 ? { $sum: scoreFields } : 0,
                },
              },
              {
                $addFields: {
                  _score: { $add: ['$_vectorScore', '$_tagScore'] },
                },
              },
              { $sort: { _score: -1, recommendedCount: -1 } },
              { $limit: limit },
            ])
            .exec();

          return results.map(toSearchResult);
        } catch (error) {
          this.logger.warn(
            `Vector search başarısız, tag/kategori kesişimine düşülüyor: ${this.describeError(error)}`,
          );
        }
      }
    }

    if (hasAnySignal) {
      const scoreFields = this.buildIntersectionScoreFields(params);

      const results = await this.dhikrModel
        .aggregate<DhikrLean>([
          { $match: baseMatch },
          { $addFields: { _score: { $sum: scoreFields } } },
          { $sort: { _score: -1, recommendedCount: -1 } },
          { $limit: limit },
        ])
        .exec();

      return results.map(toSearchResult);
    }

    const results = await this.dhikrModel
      .find(baseMatch)
      .sort({ recommendedCount: -1 })
      .limit(limit)
      .lean<DhikrLean[]>()
      .exec();

    return results.map(toSearchResult);
  }

  /**
   * Kaynak pasajı (kitap RAG) koleksiyonunda salt vektör tabanlı anlamsal
   * arama yapar (tag/kategori rerank yoktur — dhikr aramasından farklı
   * olarak burada skorlama tamamen $vectorSearch'e aittir).
   * AiChatService 'bilgi' modunda bu aramayı kullanır.
   */
  async searchSourcePassagesForAgent(
    query: string,
    limit = 4,
  ): Promise<SourcePassageResult[]> {
    const trimmedQuery = query?.trim();
    if (!trimmedQuery) {
      return [];
    }

    const { vector: queryVector, usage: embeddingUsage } =
      await this.embeddingService.embedWithUsage(trimmedQuery);
    if (embeddingUsage) {
      void this.usageService.record({
        kind: 'embedding',
        model: this.embeddingService.model,
        usage: embeddingUsage,
      });
    }
    if (!queryVector) {
      return [];
    }

    try {
      const results = await this.sourcePassageModel
        .aggregate<SourcePassageLean & { _vectorScore: number }>([
          {
            $vectorSearch: {
              index: 'source_passages_vector_index',
              path: 'embedding',
              queryVector,
              numCandidates: 100,
              limit,
            },
          },
          { $addFields: { _vectorScore: { $meta: 'vectorSearchScore' } } },
          { $sort: { _vectorScore: -1 } },
          { $limit: limit },
        ])
        .exec();

      return results.map((item) => ({
        sourceId: item.sourceId,
        text: item.text,
        sourceTitle: item.sourceTitle,
        sectionHeading: item.sectionHeading,
        pageStart: item.pageStart,
        pageEnd: item.pageEnd,
        type: item.type,
        score: item._vectorScore,
      }));
    } catch (error) {
      this.logger.warn(
        `Source passage vector search başarısız: ${this.describeError(error)}`,
      );
      return [];
    }
  }

  /** Agent başarısız olduğunda veya OPENAI_API_KEY yokken kullanılan zaman tabanlı fallback. */
  private async getTimeBasedCandidates(
    timeContext: TimeContext,
    recentDhikrIds: string[],
    limit: number,
  ): Promise<DhikrLean[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const timeOfDay = this.resolveTimeOfDay(timeContext);

    const timeOfDayValues: Array<'morning' | 'evening' | 'night' | 'any'> = [
      timeOfDay as 'morning' | 'evening' | 'night',
      'any',
    ];

    return this.dhikrModel
      .find({
        isVerified: true,
        isActive: true,
        timeOfDay: { $in: timeOfDayValues },
        ...(recentObjectIds.length > 0
          ? { _id: { $nin: recentObjectIds } }
          : {}),
      })
      .sort({ recommendedCount: -1 })
      .limit(limit)
      .lean<DhikrLean[]>()
      .exec();
  }

  /**
   * Fallback skorlaması için gereken alanlarla birlikte, aktif + doğrulanmış
   * tüm zikirleri (son gösterilenler hariç) lean olarak getirir.
   */
  private async getActiveDhikrPool(
    recentDhikrIds: string[],
  ): Promise<DhikrLean[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    return this.dhikrModel
      .find({
        isVerified: true,
        isActive: true,
        ...(recentObjectIds.length > 0
          ? { _id: { $nin: recentObjectIds } }
          : {}),
      })
      .lean<DhikrLean[]>()
      .exec();
  }

  /**
   * Agent kullanılamadığında (rate-limit, API key yok, agent hatası) devreye
   * giren akıllı fallback. LLM olmadan freeText'i kelime kelime (Türkçe
   * katlamalı) tokenize edip katalogdaki tags/suitableFor/categories
   * alanlarıyla ağırlıklı örtüşme skoruna göre eşleştirir
   * (bkz. fallbackRecommend, utils/fallback-recommender.ts):
   * - freeText yoksa → doğrudan zaman tabanlı öneri (mevcut davranış).
   * - freeText'te HİÇBİR aday alanla kelime örtüşmesi yoksa (hasTextualSignal
   *   false) → TAHMİN ETMEZ, kullanıcıya seçmesi için genel kategorileri
   *   döner. ("Yanlış zikir önerme lüksümüz yok" kuralı.)
   * - En az bir adayda örtüşme varsa → yalnızca örtüşmesi olan zikirler
   *   (sıfır örtüşmeli dolgular hariç) en yüksek skordan sıralanarak döner.
   */
  private async getSmartFallbackCandidates(
    freeText: string | undefined,
    timeContext: TimeContext,
    recentDhikrIds: string[],
    maxRecommendations: number,
  ): Promise<
    | { kind: 'candidates'; candidates: DhikrLean[] }
    | { kind: 'clarification'; suggestedCategories: string[] }
  > {
    if (!freeText) {
      const candidates = await this.getTimeBasedCandidates(
        timeContext,
        recentDhikrIds,
        maxRecommendations,
      );
      return { kind: 'candidates', candidates };
    }

    const pool = await this.getActiveDhikrPool(recentDhikrIds);
    if (pool.length === 0) {
      const candidates = await this.getTimeBasedCandidates(
        timeContext,
        recentDhikrIds,
        maxRecommendations,
      );
      return { kind: 'candidates', candidates };
    }

    const result = fallbackRecommend({
      freeText,
      timeContext,
      recentDhikrIds,
      maxRecommendations,
      availableDhikrs: pool.map((d) => ({
        _id: d._id.toString(),
        tags: d.tags,
        categories: d.categories,
        timeOfDay: d.timeOfDay,
        suitableFor: d.suitableFor,
      })),
    });

    if (!result.hasTextualSignal) {
      // freeText hiçbir zikrin tags/suitableFor/categories alanıyla
      // örtüşmüyor — güvenle karar veremeyiz, kullanıcıya soralım.
      return {
        kind: 'clarification',
        suggestedCategories: GENERAL_FALLBACK_CATEGORIES.slice(0, 5),
      };
    }

    this.logger.log(`[fallback] ${result.reasoning}`);

    const candidates = await this.loadDhikrsByIds(result.recommendedIds);

    if (candidates.length === 0) {
      // Beklenmedik durum (örn. id'ler arada silindi) — zaman tabanlıya düş.
      const fallback = await this.getTimeBasedCandidates(
        timeContext,
        recentDhikrIds,
        maxRecommendations,
      );
      return { kind: 'candidates', candidates: fallback };
    }

    // loadDhikrsByIds sıralamayı garanti etmiyor — skor sırasını koru.
    const order = new Map(
      result.recommendedIds.map((id, index) => [id, index]),
    );
    candidates.sort(
      (a, b) =>
        (order.get(a._id.toString()) ?? 0) - (order.get(b._id.toString()) ?? 0),
    );

    return { kind: 'candidates', candidates };
  }

  /** Belirtilen kategorilerden birine sahip, aktif ve doğrulanmış zikirleri döndürür. */
  private async searchDhikrsByCategories(
    categories: string[],
    recentDhikrIds: string[],
    limit: number,
  ): Promise<DhikrLean[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    return this.dhikrModel
      .find({
        isVerified: true,
        isActive: true,
        categories: { $in: categories },
        ...(recentObjectIds.length > 0
          ? { _id: { $nin: recentObjectIds } }
          : {}),
      })
      .sort({ recommendedCount: -1 })
      .limit(limit)
      .lean<DhikrLean[]>()
      .exec();
  }

  /** Belirli ID'lere sahip, aktif ve doğrulanmış dhikrleri döndürür. */
  private async loadDhikrsByIds(ids: string[]): Promise<DhikrLean[]> {
    const objectIds = ids
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));
    if (objectIds.length === 0) return [];

    return this.dhikrModel
      .find({ _id: { $in: objectIds }, isVerified: true, isActive: true })
      .lean<DhikrLean[]>()
      .exec();
  }

  /** Katalog sürümü: aggregate ile count + maxUpdatedAt (tüm dokümanları çekmez). */
  private async getCatalogVersion(): Promise<string> {
    const result = await this.dhikrModel
      .aggregate<{ count: number; maxUpdated: Date | null }>([
        { $match: { isVerified: true, isActive: true } },
        {
          $group: {
            _id: null,
            count: { $sum: 1 },
            maxUpdated: { $max: '$updatedAt' },
          },
        },
      ])
      .exec();
    const row = result[0];
    return row
      ? `${row.count}:${row.maxUpdated ? new Date(row.maxUpdated).getTime() : 0}`
      : '0:0';
  }

  /**
   * Öneriyi kalıcılaştırır: aiRecommendation kaydı oluşturur, lastSeenAt
   * günceller ve yanıt nesnesini kurar. Cache-hit ve normal akış paylaşır.
   */
  private async finalizeRecommendation(input: {
    userId: Types.ObjectId;
    freeText?: string;
    timeContext: TimeContext;
    reasoning: string;
    safeRecommendedIds: string[];
    dhikrMapById: Map<string, DhikrLean>;
    usedModel: UsedModel;
    locale: SupportedAiLocale;
  }) {
    await this.userModel
      .updateOne({ _id: input.userId }, { $set: { lastSeenAt: new Date() } })
      .exec();

    const created = await this.aiRecommendationModel.create({
      userId: input.userId,
      freeText: input.freeText,
      assistantNote: input.reasoning,
      locale: input.locale,
      timeContext: input.timeContext,
      recommendedDhikrIds: input.safeRecommendedIds.map(
        (id) => new Types.ObjectId(id),
      ),
    });

    const recommendedItems = input.safeRecommendedIds
      .map((id) => input.dhikrMapById.get(id))
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

    return {
      recommendationId: created._id.toString(),
      recommendedIds: input.safeRecommendedIds,
      reasoning: input.reasoning,
      items: recommendedItems,
      usedModel: input.usedModel,
      locale: input.locale,
    };
  }

  private computeCacheKey(input: {
    freeText?: string;
    timeContext: TimeContext;
    maxRecommendations: number;
    catalogVersion: string;
    locale: SupportedAiLocale;
  }): string {
    const normalizedFreeText = normalizeText(input.freeText ?? '');
    const timeBucket = this.resolveTimeBucket(input.timeContext);
    const raw = [
      normalizedFreeText,
      timeBucket,
      String(input.maxRecommendations),
      input.catalogVersion,
      input.locale,
    ].join('|');

    return createHash('sha256').update(raw).digest('hex');
  }

  private resolveTimeBucket(timeContext: TimeContext): string {
    if (timeContext.isSpecialDay) {
      return `special:${normalizeText(timeContext.specialDayName ?? 'ozel')}`;
    }

    return this.resolveTimeOfDay(timeContext);
  }

  private resolveTimeOfDay(timeContext: TimeContext): string {
    const hour = timeContext.hour;
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 19) return 'evening';
    return 'night';
  }

  private async writeCache(
    cacheKey: string,
    recommendedIds: string[],
    reasoning: string,
    usedModel: UsedModel,
  ) {
    try {
      await this.recommendationCacheModel.updateOne(
        { cacheKey },
        {
          $set: {
            recommendedDhikrIds: recommendedIds.map(
              (id) => new Types.ObjectId(id),
            ),
            reasoning,
            usedModel,
          },
          $setOnInsert: { cacheKey, createdAt: new Date() },
        },
        { upsert: true },
      );
    } catch (error) {
      this.logger.warn(
        `Öneri cache'i yazılamadı: ${this.describeError(error)}`,
      );
    }
  }

  async getDailyQuota(userId: string) {
    const credits = await this.getCredits(userId);
    if (credits.isPremium) {
      return { used: 0, limit: null, isPremium: true, deprecated: true };
    }

    const grantWindow = Math.max(0, credits.dailyGrant);
    const used = Math.max(
      0,
      grantWindow - Math.min(credits.balance, grantWindow),
    );

    return {
      used,
      limit: grantWindow,
      isPremium: false,
      deprecated: true,
    };
  }

  async getCredits(userId: string) {
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const user = await this.ensureUserExists(userObjectId);
    const creditState = await this.ensureCreditState(
      userObjectId,
      user.isPremium,
    );

    return {
      balance: creditState.balance,
      isPremium: creditState.isPremium,
      dailyGrant: creditState.dailyGrant,
      monthlyGrant: creditState.monthlyGrant,
    };
  }

  async applyTopupPurchase(input: {
    userId: string;
    productId: string;
    providerEventId: string;
  }) {
    const userObjectId = this.asObjectId(
      input.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    await this.ensureUserExists(userObjectId);

    const productId = input.productId?.trim();
    const providerEventId = input.providerEventId?.trim();
    if (!productId || !providerEventId) {
      return { applied: false as const, reason: 'missing_fields', credits: 0 };
    }

    const credits = this.resolveTopupCredits(productId);
    if (credits <= 0) {
      this.logger.error(
        `Topup UNKNOWN_PRODUCT: katalogda karşılığı olmayan ürün — ` +
          `productId=${productId} userId=${input.userId} ` +
          `providerEventId=${providerEventId}. Kredi UYGULANMADI; ` +
          `AI_CREDIT_TOPUP_PRODUCTS / AI_CREDIT_DEFAULT_TOPUP_PRODUCTS kataloğunu kontrol et.`,
      );
      return { applied: false as const, reason: 'unknown_product', credits: 0 };
    }

    try {
      await this.aiCreditLedgerModel.create({
        userId: userObjectId,
        reason: AI_CREDIT_REASONS.TOPUP_PURCHASE,
        delta: credits,
        providerEventId,
        metadata: { productId },
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        return { applied: false as const, reason: 'duplicate_event', credits };
      }
      throw error;
    }

    await this.aiCreditWalletModel
      .findOneAndUpdate(
        { userId: userObjectId },
        { $inc: { topupCredits: credits, balance: credits } },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      .exec();

    return { applied: true as const, reason: 'ok', credits };
  }

  async listRecommendations(query: QueryAiRecommendationsDto) {
    const filter: Record<string, unknown> = {};

    if (query.userId) {
      filter.userId = this.asObjectId(
        query.userId,
        'Geçersiz kullanıcı kimliği.',
      );
    }

    return this.aiRecommendationModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()
      .exec();
  }

  async selectRecommendation(
    id: string,
    payload: SelectAiRecommendationDto,
    userId: string,
  ) {
    const recommendationId = this.asObjectId(id, 'Geçersiz öneri kimliği.');
    const selectedDhikrId = this.asObjectId(
      payload.selectedDhikrId,
      'Geçersiz zikir kimliği.',
    );
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');

    const existing = await this.aiRecommendationModel
      .findOne({ _id: recommendationId, userId: userObjectId })
      .lean()
      .exec();

    if (!existing) {
      throw new NotFoundException('Asistan öneri kaydı bulunamadı.');
    }

    const isRecommended = existing.recommendedDhikrIds
      .map((value) => value.toString())
      .includes(selectedDhikrId.toString());

    if (!isRecommended) {
      throw new NotFoundException(
        'Seçilen zikir bu öneri listesinde bulunmuyor.',
      );
    }

    const updated = await this.aiRecommendationModel
      .findByIdAndUpdate(
        recommendationId,
        { $set: { selectedDhikrId } },
        { returnDocument: 'after' },
      )
      .lean()
      .exec();

    try {
      await this.dhikrModel
        .updateOne({ _id: selectedDhikrId }, { $inc: { recommendedCount: 1 } })
        .exec();
    } catch (error) {
      this.logger.warn(
        `recommendedCount artırılamadı (dhikr ${selectedDhikrId.toString()}): ${this.describeError(error)}`,
      );
    }

    return updated;
  }

  private async getRecentDhikrIds(userId: Types.ObjectId) {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fromDate = toDateString(from);

    const recent = await this.dhikrLogModel.distinct('dhikrId', {
      userId,
      date: { $gte: fromDate },
      dhikrId: { $ne: null },
    });

    return recent.map((value) => value.toString());
  }

  private composeReasoning(
    summary: string | undefined,
    items: Array<{ id: string; reason: string }>,
    dhikrMapById: Map<string, { name: LocalizedText }>,
  ): string {
    const lines = items
      .map((item) => {
        const name = dhikrMapById.get(item.id)?.name?.tr?.trim();
        const reason = item.reason ? stripObjectIds(item.reason).trim() : '';

        if (name && reason) return `- **${name}:** ${reason}`;
        if (name) return `- **${name}**`;
        return reason ? `- ${reason}` : null;
      })
      .filter((line): line is string => Boolean(line));

    const parts: string[] = [];
    const cleanSummary = summary?.trim();
    if (cleanSummary) parts.push(cleanSummary);
    if (lines.length > 0) parts.push(lines.join('\n'));

    return parts.join('\n\n');
  }

  private computePromptHash(input: {
    freeText?: string;
    selectedCategory?: string;
  }): string {
    return createHash('sha256')
      .update(
        JSON.stringify({
          freeText: input.freeText ?? null,
          selectedCategory: input.selectedCategory ?? null,
        }),
      )
      .digest('hex');
  }

  private assertPromptHashMatches(
    existingHash: string | undefined,
    promptHash: string,
  ) {
    // Eski kayıtlarda promptHash olmayabilir; yalnızca kayıtlı hash ile
    // gelen hash uyuşmuyorsa flowId yeniden kullanımı olarak reddet.
    if (existingHash && existingHash !== promptHash) {
      throw new ForbiddenException(
        'Bu flowId farklı bir istek içeriğiyle zaten kullanılmış.',
      );
    }
  }

  /**
   * `reason` opsiyoneldir ve varsayılan olarak RECOMMENDATION_DEBIT'tir —
   * mevcut çağrı yerleri (createRecommendation) davranışı değişmeden
   * çalışmaya devam eder. Chat akışı (ai-chat modülü) kendi
   * CHAT_MESSAGE_DEBIT reason'ını geçirerek aynı deseni yeniden kullanır.
   */
  async ensureCreditAccessForFlow(
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
    reason: AiCreditReason = AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
  ) {
    const existingDebit = await this.aiCreditLedgerModel
      .findOne({
        userId,
        reason,
        flowId,
      })
      .lean()
      .exec();

    if (existingDebit) {
      this.assertPromptHashMatches(existingDebit.promptHash, promptHash);
      return;
    }

    const creditState = await this.ensureCreditState(userId, isPremium);
    if (creditState.balance > 0) {
      return;
    }

    throw new ForbiddenException({
      code: AI_CREDIT_INSUFFICIENT_CODE,
      message:
        'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
    });
  }

  async debitCreditForFlow(
    userId: Types.ObjectId,
    flowId: string,
    isPremium: boolean,
    promptHash: string,
    reason: AiCreditReason = AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
  ): Promise<{ balance: number }> {
    const existingDebit = await this.aiCreditLedgerModel
      .findOne({
        userId,
        reason,
        flowId,
      })
      .lean()
      .exec();

    if (existingDebit) {
      this.assertPromptHashMatches(existingDebit.promptHash, promptHash);
      const wallet = await this.aiCreditWalletModel
        .findOne({ userId })
        .lean()
        .exec();
      return { balance: wallet?.balance ?? 0 };
    }

    const creditState = await this.ensureCreditState(userId, isPremium);
    if (creditState.balance <= 0) {
      throw new ForbiddenException({
        code: AI_CREDIT_INSUFFICIENT_CODE,
        message:
          'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
      });
    }

    // Önce ledger'a yaz: unique index (userId, reason, flowId) sayesinde
    // eşzamanlı istekler E11000 alır ve idempotent retry yoluna düşer.
    try {
      await this.aiCreditLedgerModel.create({
        userId,
        reason,
        delta: -1,
        flowId,
        promptHash,
      });
    } catch (error) {
      if (this.isDuplicateKeyError(error)) {
        const duplicateDebit = await this.aiCreditLedgerModel
          .findOne({
            userId,
            reason,
            flowId,
          })
          .lean()
          .exec();
        this.assertPromptHashMatches(duplicateDebit?.promptHash, promptHash);
        const currentWallet = await this.aiCreditWalletModel
          .findOne({ userId })
          .lean()
          .exec();
        return { balance: currentWallet?.balance ?? 0 };
      }
      throw error;
    }

    // Wallet'ı koşullu atomik $inc ile düşür: önce grant kovası, yoksa topup.
    let updatedWallet = await this.aiCreditWalletModel
      .findOneAndUpdate(
        { userId, grantCredits: { $gt: 0 } },
        { $inc: { grantCredits: -1, balance: -1 } },
        { new: true },
      )
      .exec();

    if (!updatedWallet) {
      updatedWallet = await this.aiCreditWalletModel
        .findOneAndUpdate(
          { userId, topupCredits: { $gt: 0 } },
          { $inc: { topupCredits: -1, balance: -1 } },
          { new: true },
        )
        .exec();
    }

    if (!updatedWallet) {
      // Düşülecek kredi kalmamış: ledger kaydını telafi olarak sil ve reddet.
      await this.aiCreditLedgerModel
        .deleteOne({
          userId,
          reason,
          flowId,
        })
        .exec();
      throw new ForbiddenException({
        code: AI_CREDIT_INSUFFICIENT_CODE,
        message:
          'AI Rehber için kredin yetersiz. Premium veya kredi paketi alarak devam edebilirsin.',
      });
    }

    // balanceAfter bilgilendirme amaçlı; başarısız olsa da akışı bozmasın.
    try {
      await this.aiCreditLedgerModel
        .updateOne(
          {
            userId,
            reason,
            flowId,
          },
          { $set: { balanceAfter: updatedWallet.balance } },
        )
        .exec();
    } catch (error) {
      this.logger.warn(
        `Ledger balanceAfter güncellenemedi (flow ${flowId}): ${this.describeError(error)}`,
      );
    }

    return { balance: updatedWallet.balance };
  }

  async ensureCreditState(
    userId: Types.ObjectId,
    isPremium: boolean,
  ): Promise<CreditState> {
    const initialWallet =
      (await this.aiCreditWalletModel.findOne({ userId }).exec()) ??
      (await this.aiCreditWalletModel.create({ userId }));

    const grant = await this.resolveGrantStatus(userId, isPremium);
    let wallet = initialWallet;

    if (
      wallet.grantReason !== grant.reason ||
      wallet.grantCycleKey !== grant.cycleKey
    ) {
      // Grant yalnızca ledger insert'i başarılıysa uygulanır: unique index
      // (dayKey/monthKey) aynı döngüde ikinci grant'i engeller. Böylece
      // premium⇄free toggle'ında aylık grant tekrar verilmez ve mevcut
      // bakiye korunur (downgrade'de krediler sıfırlanmaz). Yeni döngüde
      // grant uygulandığında ise grantCredits BİRİKMEZ: kullanılmayan
      // önceki grant döngü değişince sıfırlanır ($set), topupCredits'e
      // dokunulmaz.
      let grantApplied = false;
      try {
        await this.aiCreditLedgerModel.create({
          userId,
          reason: grant.reason,
          delta: grant.amount,
          ...(grant.dayKey ? { dayKey: grant.dayKey } : {}),
          ...(grant.monthKey ? { monthKey: grant.monthKey } : {}),
        });
        grantApplied = true;
      } catch (error) {
        if (!this.isDuplicateKeyError(error)) {
          throw error;
        }
      }

      wallet =
        (await this.aiCreditWalletModel
          .findOneAndUpdate(
            { userId },
            {
              $set: {
                grantReason: grant.reason,
                grantCycleKey: grant.cycleKey,
                ...(grantApplied
                  ? {
                      grantCredits: grant.amount,
                      balance: Math.max(0, wallet.topupCredits) + grant.amount,
                    }
                  : {}),
              },
            },
            { upsert: true, new: true, setDefaultsOnInsert: true },
          )
          .exec()) ?? wallet;
    } else {
      const nextBalance =
        Math.max(0, wallet.topupCredits) + Math.max(0, wallet.grantCredits);
      if (wallet.balance !== nextBalance) {
        wallet =
          (await this.aiCreditWalletModel
            .findOneAndUpdate(
              { userId },
              {
                $set: {
                  topupCredits: Math.max(0, wallet.topupCredits),
                  grantCredits: Math.max(0, wallet.grantCredits),
                  balance: nextBalance,
                },
              },
              { new: true },
            )
            .exec()) ?? wallet;
      }
    }

    return {
      balance: wallet.balance,
      isPremium,
      dailyGrant: isPremium ? 0 : Math.max(0, wallet.grantCredits),
      monthlyGrant: isPremium ? PREMIUM_MONTHLY_CREDIT_AMOUNT : 0,
      wallet,
    };
  }

  private async resolveGrantStatus(
    userId: Types.ObjectId,
    isPremium: boolean,
  ): Promise<{
    reason: AiCreditReason;
    cycleKey: string;
    amount: number;
    dayKey?: string;
    monthKey?: string;
  }> {
    const now = new Date();
    if (isPremium) {
      const monthKey = toUtcMonthKey(now);
      return {
        reason: AI_CREDIT_REASONS.PREMIUM_MONTHLY_GRANT,
        cycleKey: monthKey,
        amount: PREMIUM_MONTHLY_CREDIT_AMOUNT,
        monthKey,
      };
    }

    const dayKey = toUtcDayKey(now);
    // Kullanıcı hiç FREE_DAILY_GRANT almamışsa (ilk kez AI'ya dokunduğu gün)
    // karşılama bonusu olarak FREE_SIGNUP_BONUS_CREDIT_AMOUNT ver; sonraki
    // her gün normal FREE_DAILY_CREDIT_AMOUNT'a döner.
    const hasPriorFreeGrant = Boolean(
      await this.aiCreditLedgerModel
        .exists({ userId, reason: AI_CREDIT_REASONS.FREE_DAILY_GRANT })
        .exec(),
    );

    return {
      reason: AI_CREDIT_REASONS.FREE_DAILY_GRANT,
      cycleKey: dayKey,
      amount: hasPriorFreeGrant
        ? FREE_DAILY_CREDIT_AMOUNT
        : FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
      dayKey,
    };
  }

  private resolveTopupCredits(productId: string): number {
    const raw = this.configService
      .get<string>('AI_CREDIT_TOPUP_PRODUCTS')
      ?.trim();

    if (!raw) {
      // Env override yoksa tek kaynak: credits.constants.ts default kataloğu
      // (mobil CREDIT_TOPUP_CREDITS ile birebir aynı).
      return AI_CREDIT_DEFAULT_TOPUP_PRODUCTS[productId.trim()] ?? 0;
    }

    if (this.topupCatalogCacheRaw !== raw || !this.topupCatalogCache) {
      this.topupCatalogCacheRaw = raw;
      this.topupCatalogCache = parseTopupCatalog(raw);
    }

    const key = productId.trim();
    return this.topupCatalogCache.get(key) ?? 0;
  }

  private isDuplicateKeyError(error: unknown): boolean {
    if (!error || typeof error !== 'object') {
      return false;
    }

    return (error as { code?: unknown }).code === 11000;
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : 'bilinmeyen hata';
  }

  private defaultTimeContext(): TimeContext {
    const now = new Date();
    return {
      hour: now.getHours(),
      dayOfWeek: now.getDay(),
      isSpecialDay: false,
    };
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
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toSearchResult(item: DhikrLean): SearchResult {
  return {
    id: item._id.toString(),
    name: item.name,
    virtue: item.virtue.tr,
    tags: item.tags,
    categories: item.categories,
    timeOfDay: item.timeOfDay,
    suitableFor: item.suitableFor,
  };
}

function stripObjectIds(text: string) {
  return text.replace(/\b[a-f0-9]{24}\b/gi, '').replace(/\s{2,}/g, ' ');
}

function toUtcDayKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  const day = String(date.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function toUtcMonthKey(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

function parseTopupCatalog(raw: string): Map<string, number> {
  const bySku = new Map<string, number>();

  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    for (const [sku, amount] of Object.entries(parsed)) {
      const normalized = Number(amount);
      if (sku.trim() && Number.isFinite(normalized) && normalized > 0) {
        bySku.set(sku.trim(), Math.floor(normalized));
      }
    }
    return bySku;
  } catch {
    // json değilse csv formatına düş
  }

  raw
    .split(',')
    .map((part) => part.trim())
    .filter(Boolean)
    .forEach((part) => {
      const [skuRaw, amountRaw] = part.split(':');
      const sku = skuRaw?.trim();
      const amount = Number(amountRaw?.trim());
      if (sku && Number.isFinite(amount) && amount > 0) {
        bySku.set(sku, Math.floor(amount));
      }
    });

  return bySku;
}
