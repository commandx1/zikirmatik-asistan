import { createHash } from 'node:crypto';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { generateText, stepCountIs, tool } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { z } from 'zod';
import {
  DhikrLog,
  type DhikrLogDocument,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { AiProgressGateway } from './ai-progress.gateway';
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
import { fallbackRecommend } from './utils/fallback-recommender';
import { normalizeText } from './utils/text-normalize';

const FREE_DAILY_LIMIT = 1;

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

type UsedModel = 'openai' | 'fallback' | 'cache';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

type SearchResult = {
  id: string;
  nameTurkish: string;
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
};

const MONGO_FALLBACK_REASONING =
  'Niyetine en uygun zikirleri sana göre seçtim.';

/**
 * freeText'te tags/suitableFor/categories alanlarıyla hiçbir kelime örtüşmesi
 * bulunamadığında (fallbackRecommend.hasTextualSignal === false) kullanıcıya
 * sunulacak, geniş kitleye uygun genel kategoriler.
 */
const GENERAL_FALLBACK_CATEGORIES = ['genel', 'dua', 'şükür', 'sabır', 'huzur'];

const KNOWN_CATEGORIES = [
  'tehlikeli canlılardan korunma',
  'acil dua',
  'adab',
  'adalet',
  'afet',
  'ahlak',
  'aile',
  'aile ilişkisi',
  'akşam',
  'arefe',
  'ayet',
  'basiret',
  'bayram',
  'başarı',
  'bereket',
  'cami',
  'cemaat',
  'cenaze',
  'cennet',
  'dua',
  'egitim',
  'esma',
  'esmaul husna',
  'ev',
  'ev hayatı',
  'evlat',
  'evlilik',
  'ezan',
  'eğitim',
  'farz',
  'gece namazı',
  'gelecek kaygısı',
  'genel',
  'günlük',
  'günlük hayat',
  'günlük sünnet',
  'güzel ahlak',
  'hac',
  'hacet',
  'haksızlık',
  'hamd',
  'hastalık',
  'hidayet',
  'hikmet',
  'huzur',
  'ibadet',
  'ilim',
  'ilişkiler',
  'iman',
  'ismi azam',
  'istiaze',
  'istikamet',
  'istiğfar',
  'itibar',
  'iş hayatı',
  'iş kariyer',
  'kalp',
  'kandil',
  'kapsamlı',
  'karakter',
  'kariyer',
  'kaygı yönetimi',
  'koruma',
  'korunma',
  'koruyucu',
  'kulluk',
  "kur'an",
  'kuran',
  'kuran duası',
  'kurân',
  'liderlik',
  'manevi arınma',
  'manevi destek',
  'manevi gelişim',
  'maneviyat',
  'muhabbet',
  'muharrem',
  'mülk',
  'nafile',
  'namaz',
  'nazar',
  'nefis terbiyesi',
  'oruç',
  'rahmet',
  'ramazan',
  'rukye',
  'rızık',
  'rızık bereket',
  'sabah akşam',
  'sabır',
  'salavat',
  'sevgi',
  'sinav',
  'sosyal',
  'sure',
  'sünnet duaları',
  'sıkıntı',
  'sınav',
  'tefekkür',
  'teheccüd',
  'temel',
  'tesbih',
  'teselli',
  'tevbe',
  'tevekkül',
  'tevhid',
  'tövbe',
  'umut',
  'uyku uyanış',
  'vesvese',
  'vitir',
  'yardım',
  'yemek',
  'yolculuk',
  'zikir',
  'zilhicce',
  'âfiyet',
  'ölüm',
  'özel gün',
  'özel günler',
  'özlü dualar',
  'şifa',
  'şükür',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
    @InjectModel(AiRecommendation.name)
    private readonly aiRecommendationModel: Model<AiRecommendationDocument>,
    @InjectModel(RecommendationCache.name)
    private readonly recommendationCacheModel: Model<RecommendationCacheDocument>,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(DhikrLog.name)
    private readonly dhikrLogModel: Model<DhikrLogDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
  ) {}

  private emitStep(socketId: string | undefined, key: string, message: string) {
    if (socketId) {
      this.progressGateway.emitStep(socketId, key, message);
    }
  }

  async createRecommendation(payload: CreateAiRecommendationDto) {
    const startedAt = Date.now();
    const userId = this.asObjectId(
      payload.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    const freeText = payload.freeText?.trim() || undefined;
    const selectedCategory = payload.selectedCategory?.trim() || undefined;
    const socketId = payload.socketId;
    this.emitStep(socketId, 'analyzing', 'Niyetin analiz ediliyor...');
    this.logger.log(
      `[start] userId=${userId.toString()} freeText=${freeText ? `"${freeText.slice(0, 60)}"` : '(yok)'}`,
    );

    const user = await this.ensureUserExists(userId);

    // ── Quota ──────────────────────────────────────────────────────────────
    let dailyFreeUsed = 0;
    if (!user.isPremium) {
      const now = new Date();
      const todayStart = new Date(
        Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
      );
      dailyFreeUsed = await this.aiRecommendationModel.countDocuments({
        userId,
        createdAt: { $gte: todayStart },
      });
      if (dailyFreeUsed >= FREE_DAILY_LIMIT) {
        this.logger.log(
          `[quota] LIMIT_REACHED used=${dailyFreeUsed}/${FREE_DAILY_LIMIT}`,
        );
        throw new ForbiddenException({
          code: 'DAILY_LIMIT_REACHED',
          message:
            "Günlük ücretsiz öneri hakkın doldu. Premium'a geçerek sınırsız öneri alabilirsin.",
          used: dailyFreeUsed,
          limit: FREE_DAILY_LIMIT,
        });
      }
      this.logger.log(
        `[quota] ok free=${dailyFreeUsed + 1}/${FREE_DAILY_LIMIT}`,
      );
    } else {
      this.logger.log(`[quota] ok premium — sınırsız`);
    }

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
      });
      this.logger.log(`[done] category path — ${Date.now() - startedAt}ms`);
      return { ...result, dailyFreeUsed: dailyFreeUsed + 1 };
    }

    // ── Cache lookup ────────────────────────────────────────────────────────
    const catalogVersion = await this.getCatalogVersion();
    const cacheKey = this.computeCacheKey({
      freeText,
      timeContext,
      maxRecommendations,
      catalogVersion,
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
        });
        this.logger.log(`[done] cache path — ${Date.now() - startedAt}ms`);
        return { ...result, dailyFreeUsed: dailyFreeUsed + 1 };
      }
    }
    this.logger.log(`[cache] MISS`);

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    // ── Agent ───────────────────────────────────────────────────────────────
    this.emitStep(socketId, 'thinking', 'Zikir veritabanı hazırlanıyor...');
    this.logger.log(`[agent] başlatılıyor…`);
    const agentResult = {
      ids: [],
      summary: '',
      items: [],
      offTopic: false,
    };

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
          dailyFreeUsed,
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
    });

    // ── Cache write ─────────────────────────────────────────────────────────
    if (safeRecommendedIds.length > 0) {
      await this.writeCache(cacheKey, safeRecommendedIds, reasoning, usedModel);
      this.logger.log(`[cache] yazıldı`);
    }

    this.logger.log(
      `[done] model=${usedModel} count=${safeRecommendedIds.length} — ${Date.now() - startedAt}ms`,
    );
    return { ...result, dailyFreeUsed: dailyFreeUsed + 1 };
  }

  /**
   * Vercel AI SDK ile tek LLM turunda arama + seçim döngüsü çalıştırır.
   * LLM üç araçtan birini (searchDhikrs / selectRecommendations / reportOffTopic) kullanarak
   * kendi stratejisini belirler; gerekirse searchDhikrs'i farklı parametrelerle tekrar çağırabilir.
   * OPENAI_API_KEY yoksa veya çağrı başarısız olursa null döner → fallback devreye girer.
   */
  private async runRecommendationAgent(input: {
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    maxRecommendations: number;
    socketId?: string;
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

    const systemPrompt = [
      'Sen bir İslami zikir öneri asistanısın.',
      '',
      '**GÖREVİN:**',
      'Kullanıcının niyetine, haline veya duygusal durumuna göre searchDhikrs aracıyla uygun zikirleri bul; ardından selectRecommendations ile seçimini raporla.',
      '',
      '**OFF-TOPIC TESPİTİ — yalnızca şu durumlarda reportOffTopic çağır:**',
      '- Anlamsız/rastgele karakter dizileri (ör. "sllsd", "asdfg", "123abc")',
      '- Genel sohbet, selamlama, kısa tepki veya iltifat (ör. "teşekkürler", "harikasın", "nasılsın")',
      '- Model, sistem veya teknik sorular',
      '- İslami yaşam, manevi hal, duygu veya niyetle HİÇBİR bağlantısı olmayan içerik',
      '',
      '**NORMAL AKIŞ:**',
      "1. freeText null ise → searchDhikrs'i timeOfDay ile çağır, genel zaman önerisi yap.",
      '2. freeText varsa → niyeti analiz et, uygun parametrelerle searchDhikrs çağır.',
      "3. Sonuç zayıfsa (3'ten az veya alakasız) → farklı/daha geniş parametrelerle tekrar searchDhikrs çağır.",
      '4. En uygun zikirleri seç → selectRecommendations çağır.',
      '',
      '**searchDhikrs PARAMETRELERİ:**',
      '- suitableFor: Zikrin uygun olduğu durumlar (ör. "hasta", "yolcu", "anne")',
      '- tags: Metinde geçen İslami temalar (ör. "şükür", "sabır", "şifa")',
      `- categories: Yalnızca şu listeden eşleşenleri kullan: ${KNOWN_CATEGORIES.join(', ')}`,
      `- timeOfDay: Şu anki zaman dilimi "${timeOfDay}" — niyete göre arama yapıyorsan öncelik niyette; yalnızca zaman tabanlı öneride bu alanı kullan`,
      '',
      '**SEÇİM KRİTERLERİ:**',
      '- Niyete EN DOĞRUDAN hitap eden zikirleri öncele; dolaylı/teğet ilgilileri alta koy',
      "- YALNIZCA searchDhikrs'ten dönen id'leri kullan, liste dışından ID üretme",
      `- Maksimum ${input.maxRecommendations} zikir; doldurmak için alakasız ekleme yapma`,
      '',
      '**selectRecommendations YAZIM KURALLARI:**',
      '- summary: Kullanıcının niyetini samimiyetle kabul eden sıcak 3-5 cümle. "inşallah", "Allah kabul etsin", "maşallah" gibi ifadeler kullan. Zikir ismi yazma.',
      '- reason: Her zikir için fazilet/etiket içeriğinden türeyen 1-2 cümle. Doğrudan kullanıcıya yönelik, insani ve sıcak bir dil kullan.',
    ].join('\n');

    let agentResult: AgentResult | null = null;
    let offTopicDetected = false;
    let searchCallCount = 0;

    try {
      await generateText({
        model: openaiProvider(modelName),
        stopWhen: stepCountIs(4),
        system: systemPrompt,
        prompt: JSON.stringify({
          freeText: input.freeText ?? null,
          timeContext: input.timeContext,
          recentDhikrIds: input.recentDhikrIds,
          maxRecommendations: input.maxRecommendations,
        }),
        onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
          const tools = toolCalls?.map((t) => t.toolName).join(', ') || '-';
          this.logger.debug(
            `[agent step ${stepNumber}] tools=[${tools}] finish=${finishReason}`,
          );
        },
        tools: {
          searchDhikrs: tool({
            description:
              "MongoDB'den niyete göre zikir ara. Sonuç yetersizse farklı parametrelerle tekrar çağır.",
            inputSchema: z.object({
              suitableFor: z.array(z.string()).optional(),
              tags: z.array(z.string()).optional(),
              categories: z.array(z.string()).optional(),
              timeOfDay: z
                .enum(['morning', 'evening', 'night', 'any'])
                .optional(),
              limit: z.number().int().min(1).max(10).optional(),
            }),
            execute: async (params) => {
              const stepKey = searchCallCount === 0 ? 'searching' : 'widening';
              const stepMsg =
                searchCallCount === 0
                  ? 'Zikirler taranıyor...'
                  : 'Arama genişletiliyor...';
              this.emitStep(input.socketId, stepKey, stepMsg);
              searchCallCount++;
              this.logger.log(
                `[agent:searchDhikrs] categories=[${params.categories?.join(', ') ?? ''}] tags=[${params.tags?.join(', ') ?? ''}] suitableFor=[${params.suitableFor?.join(', ') ?? ''}] timeOfDay=${params.timeOfDay ?? '-'}`,
              );
              const results = await this.searchDhikrsForAgent(
                params,
                input.recentDhikrIds,
              );
              this.logger.log(`[agent:searchDhikrs] → ${results.length} sonuç`);
              return results;
            },
          }),
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
          reportOffTopic: tool({
            description:
              'Kullanıcı içeriği zikir/dua/manevi konularla ilgili değilse çağır.',
            inputSchema: z.object({ reason: z.string().optional() }),
            execute: (params) => {
              this.logger.log(
                `[agent:reportOffTopic] reason="${params.reason ?? '-'}"`,
              );
              offTopicDetected = true;
              return { acknowledged: true };
            },
          }),
        },
      });
    } catch (error) {
      this.logger.warn(
        `Agent çalıştırılamadı, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return null;
    }

    if (offTopicDetected) {
      return { ids: [], summary: '', items: [], offTopic: true };
    }
    return agentResult;
  }

  /**
   * Agent'ın searchDhikrs tool'unda çalışan MongoDB sorgusu.
   * LLM'in verdiği parametrelere göre skor tabanlı aggregation veya
   * parametresiz popülerlik sıralaması döndürür.
   */
  private async searchDhikrsForAgent(
    params: {
      suitableFor?: string[];
      tags?: string[];
      categories?: string[];
      timeOfDay?: string;
      limit?: number;
    },
    recentDhikrIds: string[],
  ): Promise<SearchResult[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const baseMatch: Record<string, unknown> = {
      isVerified: true,
      isActive: true,
      ...(recentObjectIds.length > 0 ? { _id: { $nin: recentObjectIds } } : {}),
    };

    const limit = Math.min(params.limit ?? 10, 10);
    const hasSuitableFor = (params.suitableFor?.length ?? 0) > 0;
    const hasTags = (params.tags?.length ?? 0) > 0;
    const hasCategories = (params.categories?.length ?? 0) > 0;
    const hasTimeOfDay = !!params.timeOfDay && params.timeOfDay !== 'any';

    if (hasSuitableFor || hasTags || hasCategories || hasTimeOfDay) {
      const scoreFields: unknown[] = [];

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
   * - freeText'te hiçbir alanla kelime örtüşmesi yoksa (hasTextualSignal
   *   false) → TAHMİN ETMEZ, kullanıcıya seçmesi için genel kategorileri
   *   döner. ("Yanlış zikir önerme lüksümüz yok" kuralı.)
   * - En az bir alanla örtüşme varsa → en yüksek skorlu zikirler önerilir.
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
        nameTurkish: d.nameTurkish,
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
  }) {
    await this.userModel
      .updateOne({ _id: input.userId }, { $set: { lastSeenAt: new Date() } })
      .exec();

    const created = await this.aiRecommendationModel.create({
      userId: input.userId,
      freeText: input.freeText,
      assistantNote: input.reasoning,
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
        nameTurkish: item.nameTurkish,
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
    };
  }

  private computeCacheKey(input: {
    freeText?: string;
    timeContext: TimeContext;
    maxRecommendations: number;
    catalogVersion: string;
  }): string {
    const normalizedFreeText = normalizeText(input.freeText ?? '');
    const timeBucket = this.resolveTimeBucket(input.timeContext);
    const raw = [
      normalizedFreeText,
      timeBucket,
      String(input.maxRecommendations),
      input.catalogVersion,
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
    const userObjectId = this.asObjectId(userId, 'Geçersiz kullanıcı kimliği.');
    const user = await this.userModel.findById(userObjectId).lean().exec();
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');

    if (user.isPremium) {
      return { used: 0, limit: null, isPremium: true };
    }

    const now = new Date();
    const todayStart = new Date(
      Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()),
    );
    const used = await this.aiRecommendationModel.countDocuments({
      userId: userObjectId,
      createdAt: { $gte: todayStart },
    });

    return { used, limit: FREE_DAILY_LIMIT, isPremium: false };
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
    dhikrMapById: Map<string, { nameTurkish: string }>,
  ): string {
    const lines = items
      .map((item) => {
        const name = dhikrMapById.get(item.id)?.nameTurkish?.trim();
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

  private readNumberConfig(key: string, fallback: number): number {
    const raw = this.configService.get<string | number>(key);
    const parsed = typeof raw === 'number' ? raw : Number(raw);
    return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
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
    nameTurkish: item.nameTurkish,
    virtue: item.virtue,
    tags: item.tags,
    categories: item.categories,
    timeOfDay: item.timeOfDay,
    suitableFor: item.suitableFor,
  };
}

function stripObjectIds(text: string) {
  return text.replace(/\b[a-f0-9]{24}\b/gi, '').replace(/\s{2,}/g, ' ');
}
