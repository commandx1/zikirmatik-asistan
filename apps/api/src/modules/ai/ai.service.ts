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

const KNOWN_CATEGORIES = [
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

  async createRecommendation(payload: CreateAiRecommendationDto) {
    const userId = this.asObjectId(
      payload.userId,
      'Geçersiz kullanıcı kimliği.',
    );
    const user = await this.ensureUserExists(userId);

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
      if (dailyFreeUsed >= 2) {
        throw new ForbiddenException({
          code: 'DAILY_LIMIT_REACHED',
          message:
            "Günlük ücretsiz öneri hakkın doldu. Premium'a geçerek sınırsız öneri alabilirsin.",
          used: dailyFreeUsed,
          limit: 2,
        });
      }
    }

    const maxRecommendations = payload.maxRecommendations ?? 5;
    const timeContext = payload.timeContext ?? this.defaultTimeContext();
    const freeText = payload.freeText?.trim() || undefined;

    const catalogVersion = await this.getCatalogVersion();
    const cacheKey = this.computeCacheKey({
      freeText,
      timeContext,
      maxRecommendations,
      catalogVersion,
    });

    // 1) Cache lookup — isabetli ve maliyetsiz dönüş.
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
        return { ...result, dailyFreeUsed: dailyFreeUsed + 1 };
      }
    }

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    // 2) Agent loop — tek LLM çağrısı zinciriyle arama + seçim.
    const agentResult = await this.runRecommendationAgent({
      freeText,
      timeContext,
      recentDhikrIds,
      maxRecommendations,
    });

    // 3) Off-topic tespiti.
    if (agentResult?.offTopic) {
      return {
        offTopic: true as const,
        message:
          'Ben yalnızca zikir ve dua önerisi yapabilen bir asistanım. Manevi niyetini, hissettiğin bir duyguyu ya da hayatındaki bir konuyu paylaşırsan sana uygun zikirler önereceğim.',
        recommendedIds: [],
        items: [],
        usedModel: 'openai' as const,
      };
    }

    // 4) Agent seçimini doğrula ve dhikr detaylarını yükle.
    let safeRecommendedIds: string[] = [];
    let dhikrMapById: Map<string, DhikrLean> = new Map();
    let reasoning = MONGO_FALLBACK_REASONING;
    let usedModel: UsedModel = 'fallback';

    if (agentResult && agentResult.ids.length > 0) {
      const selectedDhikrs = await this.loadDhikrsByIds(agentResult.ids);
      const tempMap = new Map(selectedDhikrs.map((d) => [d._id.toString(), d]));
      const validIds = agentResult.ids
        .filter((id) => tempMap.has(id))
        .slice(0, maxRecommendations);

      if (validIds.length > 0) {
        safeRecommendedIds = validIds;
        dhikrMapById = tempMap;
        reasoning = this.composeReasoning(
          agentResult.summary,
          agentResult.items,
          tempMap,
        );
        usedModel = 'openai';
      }
    }

    // 5) Fallback — agent boş dönerse zaman tabanlı MongoDB sorgusu.
    if (safeRecommendedIds.length === 0) {
      const fallbackCandidates = await this.getTimeBasedCandidates(
        timeContext,
        recentDhikrIds,
        maxRecommendations,
      );
      if (fallbackCandidates.length === 0) {
        throw new NotFoundException(
          'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
        );
      }
      safeRecommendedIds = fallbackCandidates.map((c) => c._id.toString());
      dhikrMapById = new Map(
        fallbackCandidates.map((c) => [c._id.toString(), c]),
      );
      reasoning = MONGO_FALLBACK_REASONING;
      usedModel = 'fallback';
    }

    const result = await this.finalizeRecommendation({
      userId,
      freeText,
      timeContext,
      reasoning,
      safeRecommendedIds,
      dhikrMapById,
      usedModel,
    });

    // 6) Cache write — off-topic olmayan başarılı sonuçlar.
    if (safeRecommendedIds.length > 0) {
      await this.writeCache(cacheKey, safeRecommendedIds, reasoning, usedModel);
    }

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
  }): Promise<AgentResult | null> {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, öneriler fallback ile üretilecek.',
      );
      return null;
    }

    const modelName =
      this.configService.get<string>('OPENAI_MODEL') ?? 'gpt-4.1-mini';
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
      '- summary: Kullanıcının niyetini samimiyetle kabul eden sıcak 2-3 cümle. "inşallah", "Allah kabul etsin", "maşallah" gibi ifadeler kullan. Zikir ismi yazma.',
      '- reason: Her zikir için fazilet/etiket içeriğinden türeyen 1-2 cümle. Doğrudan kullanıcıya yönelik, insani ve sıcak bir dil kullan.',
    ].join('\n');

    let agentResult: AgentResult | null = null;
    let offTopicDetected = false;

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
              return this.searchDhikrsForAgent(params, input.recentDhikrIds);
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
            execute: () => {
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

    return { used, limit: 2, isPremium: false };
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

function normalizeText(value: string): string {
  return value
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripObjectIds(text: string) {
  return text.replace(/\b[a-f0-9]{24}\b/gi, '').replace(/\s{2,}/g, ' ');
}
