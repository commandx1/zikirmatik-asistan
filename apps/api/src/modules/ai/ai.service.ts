import { createHash } from 'node:crypto';
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import OpenAI from 'openai';
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

type UsedModel = 'openai' | 'fallback' | 'retrieval' | 'cache';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

type DhikrIntent = {
  suitableFor: string[];
  tags: string[];
  categories: string[];
  timeOfDay: string | null;
};

type Candidate = {
  id: string;
  nameTurkish: string;
  virtue: string;
  tags: string[];
  categories: string[];
  timeOfDay: string;
  suitableFor: string[];
};

const MONGO_FALLBACK_REASONING =
  'Niyetine en uygun zikirleri sana göre seçtim.';

// Dhikr suitableFor alanındaki bilinen değerler — intent extraction prompt'unda kullanılır.
const KNOWN_SUITABLE_FOR = [
  'sabah',
  'akşam',
  'uyku öncesi',
  'uyandıktan sonra',
  'yemek öncesi',
  'yemek sonrası',
  'yolculuk',
  'hastalık',
  'şifa',
  'kaygı',
  'üzüntü',
  'korku',
  'haset',
  'öfke',
  'namaz sonrası',
  'cuma',
  'zilhicce',
  'muharrem',
  'cenaze',
  'hac',
  'umre',
  'evlilik',
  'rızık',
  'sınav',
  'istiğfar',
  'tevbe',
  'sabır',
  'şükür',
  'koruma',
  'bereket',
];

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openAiClient: OpenAI | null = null;
  private openAiClientResolved = false;

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
    await this.ensureUserExists(userId);

    const maxRecommendations = payload.maxRecommendations ?? 5;
    const timeContext = payload.timeContext ?? this.defaultTimeContext();
    const freeText = payload.freeText?.trim() || undefined;

    // Cache anahtarı katalog sürümünü içerir; katalog değişince doğal invalidasyon.
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
        return this.finalizeRecommendation({
          userId,
          freeText,
          timeContext,
          reasoning: cached.reasoning || MONGO_FALLBACK_REASONING,
          safeRecommendedIds: validIds,
          dhikrMapById,
          usedModel: 'cache',
        });
      }
    }

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    // 2) freeText'ten yapılandırılmış intent çıkar (LLM çağrısı #1).
    const intent = freeText ? await this.extractIntent(freeText) : null;

    // 3) MongoDB aggregation ile aday getirimi.
    const candidates = await this.getMongodbCandidates(
      intent,
      timeContext,
      recentDhikrIds,
    );

    if (candidates.length === 0) {
      throw new NotFoundException(
        'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
      );
    }

    const candidateIdSet = new Set(candidates.map((c) => c._id.toString()));
    const dhikrMapById = new Map(candidates.map((c) => [c._id.toString(), c]));

    // 4) LLM rerank + off-topic tespiti (LLM çağrısı #2).
    const openAiResult = await this.generateViaOpenAi({
      freeText,
      timeContext,
      recentDhikrIds,
      candidateDhikrs: candidates.map(toCandidate),
      maxRecommendations,
    });

    if (openAiResult?.offTopic) {
      return {
        offTopic: true as const,
        message:
          'Ben yalnızca zikir ve dua önerisi yapabilen bir asistanım. Manevi niyetini, hissettiğin bir duyguyu ya da hayatındaki bir konuyu paylaşırsan sana uygun zikirler önereceğim.',
        recommendedIds: [],
        items: [],
        usedModel: 'openai' as const,
      };
    }

    const rankedRecs = dedupeById(openAiResult?.recommendations ?? [])
      .filter((rec) => candidateIdSet.has(rec.id))
      .slice(0, maxRecommendations);

    let safeRecommendedIds = rankedRecs.map((rec) => rec.id);
    let reasoning =
      this.composeReasoning(openAiResult?.summary, rankedRecs, dhikrMapById) ||
      'Niyet metnine uygun bir zikir listesi hazırladım.';
    let usedModel: UsedModel = 'openai';

    // LLM sonuç üretemezse MongoDB sırasını doğrudan kullan.
    if (safeRecommendedIds.length === 0) {
      safeRecommendedIds = candidates
        .map((c) => c._id.toString())
        .slice(0, maxRecommendations);
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

    // 5) Cache write — off-topic olmayan başarılı sonuçlar.
    if (safeRecommendedIds.length > 0) {
      await this.writeCache(cacheKey, safeRecommendedIds, reasoning, usedModel);
    }

    return result;
  }

  /**
   * LLM'e tek bir çağrıyla kullanıcı metninden yapılandırılmış intent çıkarır.
   * Hata veya OPENAI_API_KEY eksikliğinde null döner; çağıran MongoDB
   * zaman tabanlı fallback'e geçer.
   */
  private async extractIntent(freeText: string): Promise<DhikrIntent | null> {
    const client = this.getOpenAiClient();
    if (!client) return null;

    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    const supportsTemperature = !/^(gpt-5|o\d)/i.test(model);

    const systemPrompt = [
      'Sen bir İslami zikir arama asistanısın.',
      'Kullanıcının Türkçe metninden zikir arama niyetini çıkar.',
      `suitableFor için yalnızca şu listeden eşleşenleri kullan: ${KNOWN_SUITABLE_FOR.join(', ')}.`,
      'timeOfDay: sabah (05-12) → "morning", öğle-akşam (12-19) → "evening", gece (19-05) → "night", belirsiz → null.',
      'tags ve categories için metinde geçen İslami temaları Türkçe yaz (ör. "şükür", "namaz", "hac").',
      'Yalnızca JSON döndür: { "suitableFor": string[], "tags": string[], "categories": string[], "timeOfDay": string|null }',
    ].join(' ');

    try {
      const response = await client.chat.completions.create({
        model,
        ...(supportsTemperature ? { temperature: 0 } : {}),
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: freeText },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) return null;

      const parsed = JSON.parse(text) as Partial<DhikrIntent>;
      return {
        suitableFor: Array.isArray(parsed.suitableFor)
          ? parsed.suitableFor.filter((v): v is string => typeof v === 'string')
          : [],
        tags: Array.isArray(parsed.tags)
          ? parsed.tags.filter((v): v is string => typeof v === 'string')
          : [],
        categories: Array.isArray(parsed.categories)
          ? parsed.categories.filter((v): v is string => typeof v === 'string')
          : [],
        timeOfDay:
          typeof parsed.timeOfDay === 'string' ? parsed.timeOfDay : null,
      };
    } catch (error) {
      this.logger.warn(
        `Intent çıkarılamadı, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return null;
    }
  }

  /**
   * MongoDB aggregation ile intent'e göre skorlayarak top-10 aday döndürür.
   * intent null ise (freeText yok veya çıkarım başarısız) zaman tabanlı filtre uygular.
   */
  private async getMongodbCandidates(
    intent: DhikrIntent | null,
    timeContext: TimeContext,
    recentDhikrIds: string[],
  ): Promise<DhikrLean[]> {
    const recentObjectIds = recentDhikrIds
      .filter((id) => Types.ObjectId.isValid(id))
      .map((id) => new Types.ObjectId(id));

    const baseMatch: Record<string, unknown> = {
      isVerified: true,
      isActive: true,
      ...(recentObjectIds.length > 0 ? { _id: { $nin: recentObjectIds } } : {}),
    };

    const hasIntent =
      intent &&
      (intent.suitableFor.length > 0 ||
        intent.tags.length > 0 ||
        intent.categories.length > 0 ||
        intent.timeOfDay);

    if (hasIntent) {
      const scoreFields: unknown[] = [
        {
          $multiply: [
            3,
            {
              $size: {
                $ifNull: [
                  { $setIntersection: ['$suitableFor', intent.suitableFor] },
                  [],
                ],
              },
            },
          ],
        },
        {
          $multiply: [
            2,
            {
              $size: {
                $ifNull: [{ $setIntersection: ['$tags', intent.tags] }, []],
              },
            },
          ],
        },
        {
          $multiply: [
            1,
            {
              $size: {
                $ifNull: [
                  { $setIntersection: ['$categories', intent.categories] },
                  [],
                ],
              },
            },
          ],
        },
      ];

      if (intent.timeOfDay) {
        scoreFields.push({
          $cond: [{ $eq: ['$timeOfDay', intent.timeOfDay] }, 2, 0],
        });
      }

      return this.dhikrModel
        .aggregate<DhikrLean>([
          { $match: baseMatch },
          { $addFields: { _score: { $sum: scoreFields } } },
          { $sort: { _score: -1, recommendedCount: -1 } },
          { $limit: 10 },
        ])
        .exec();
    }

    // Zaman tabanlı fallback: timeOfDay filtresi + popülerlik sırası.
    const timeOfDay = this.resolveTimeOfDay(timeContext);
    const fallbackFilter = {
      ...baseMatch,
      timeOfDay: { $in: [timeOfDay, 'any'] },
    };
    return this.dhikrModel

      .find(fallbackFilter as Record<string, unknown>)
      .sort({ recommendedCount: -1 })
      .limit(10)
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
    recs: Array<{ id: string; reason?: string }>,
    dhikrMapById: Map<string, { nameTurkish: string }>,
  ): string {
    const lines = recs
      .map((rec) => {
        const name = dhikrMapById.get(rec.id)?.nameTurkish?.trim();
        const reason = rec.reason ? stripObjectIds(rec.reason).trim() : '';

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

  private async generateViaOpenAi(input: {
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    candidateDhikrs: Candidate[];
    maxRecommendations: number;
  }) {
    const client = this.getOpenAiClient();
    if (!client) return null;

    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4.1-mini';
    const supportsTemperature = !/^(gpt-5|o\d)/i.test(model);

    const systemInstruction = [
      'Sen bir İslami zikir öneri asistanısın.',
      'İLK ADIM — konu tespiti: freeText zikir, dua, manevi hal, niyet veya İslami yaşamla (huzur, şükür, bağışlanma, kaygı, rızık, şifa, koruma, sabır, tövbe vb.) alakalı mı?',
      'Aşağıdaki durumlarda off_topic: true döndür, recommendations dizisini boş bırak, summary yazma: (1) anlamsız/rastgele karakter dizisi (ör. "sllsd", "asdfg", "123abc"), (2) genel sohbet veya selamlama, (3) model/sistem/teknik soru, (4) İslami yaşamla hiç ilgisi olmayan herhangi bir içerik.',
      'Konu ilgiliyse → off_topic: false yap ve devam et.',
      'YALNIZCA verilen candidateDhikrs listesinden seçim yap; liste dışından ID üretme.',
      'Niyeti adayların fazilet (virtue), etiket (tags) ve kategori (categories) alanlarıyla eşleştirerek en uygunları seç.',
      'Niyete EN DOĞRUDAN hitap eden duaları öncele (ör. şifa isteyene doğrudan şifa/afiyet duaları). İstiğfar, tövbe veya genel zikir gibi yalnızca dolaylı/teğet ilgili olanları üst sıralara koyma; ancak doğrudan adaylar yetersizse alt sıralarda ekle.',
      'Duanın kime yönelik olduğuna dikkat et: kullanıcı kendisi için istiyorsa birinci şahıs duaları tercih et; başkası için olanları kullanıcı bunu açıkça belirtmedikçe önceleme.',
      'Zaman bağlamını (timeOfDay, suitableFor) ikincil kriter olarak kullan.',
      `En fazla ${input.maxRecommendations} zikir seç ve en uygundan başlayarak sırala. ${input.maxRecommendations} bir üst sınırdır, doldurulması gereken bir hedef değildir.`,
      'Sırf listeyi doldurmak için alakası zayıf bir duayı EKLEME.',
      'Her seçtiğin zikir için recommendations dizisine bir nesne ekle: id (candidate id) ve reason.',
      "Her reason yalnızca o id'nin kendi fazilet/etiket/kategori içeriğinden türemeli.",
      'reason ve summary doğrudan kullanıcıya gösterilecek; insanî, sıcak ve empatik bir dil kullan; id veya teknik alan adı yazma.',
      'summary, kullanıcının niyetini anlayan 2-3 cümlelik sıcak bir girişdir: önce niyeti/hissi kabul et, sonra bu seçimlerin neden yardımcı olabileceğini kısaca belirt. Belirli zikir/dua isimleri içermez.',
      'Yalnızca JSON döndür.',
    ].join(' ');

    const promptPayload = {
      freeText: input.freeText,
      timeContext: input.timeContext,
      recentDhikrIds: input.recentDhikrIds,
      candidateDhikrs: input.candidateDhikrs,
      outputFormat: {
        off_topic: 'boolean',
        recommendations: [{ id: 'string (candidate id)', reason: 'string' }],
        summary: 'string',
      },
    };

    try {
      const response = await client.chat.completions.create({
        model,
        ...(supportsTemperature
          ? { temperature: this.readNumberConfig('OPENAI_TEMPERATURE', 0.2) }
          : {}),
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: JSON.stringify(promptPayload) },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        this.logger.warn('OpenAI yanıtı boş döndü, fallback kullanılacak.');
        return null;
      }

      let parsed: {
        off_topic?: unknown;
        recommendations?: unknown;
        summary?: unknown;
      };
      try {
        parsed = JSON.parse(text) as typeof parsed;
      } catch (error) {
        this.logger.warn(
          `OpenAI yanıtı JSON olarak ayrıştırılamadı: ${this.describeError(error)}`,
        );
        return null;
      }

      if (parsed.off_topic === true) {
        return { recommendations: [], summary: undefined, offTopic: true };
      }

      if (!Array.isArray(parsed.recommendations)) {
        this.logger.warn(
          'OpenAI yanıtında geçerli recommendations dizisi yok, fallback kullanılacak.',
        );
        return null;
      }

      const recommendations = parsed.recommendations
        .map((item) => parseRecommendation(item))
        .filter((item): item is { id: string; reason?: string } =>
          Boolean(item),
        );

      const summary =
        typeof parsed.summary === 'string' && parsed.summary.trim().length > 0
          ? stripObjectIds(parsed.summary).trim() || undefined
          : undefined;

      return { recommendations, summary, offTopic: false };
    } catch (error) {
      this.logger.warn(
        `OpenAI öneri çağrısı başarısız oldu, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return null;
    }
  }

  private getOpenAiClient(): OpenAI | null {
    if (this.openAiClientResolved) return this.openAiClient;

    this.openAiClientResolved = true;
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, öneriler fallback ile üretilecek.',
      );
      this.openAiClient = null;
      return null;
    }

    const timeout = this.readNumberConfig('OPENAI_TIMEOUT_MS', 15_000);
    const maxRetries = this.readNumberConfig('OPENAI_MAX_RETRIES', 2);

    this.openAiClient = new OpenAI({ apiKey, timeout, maxRetries });
    return this.openAiClient;
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
    const exists = await this.userModel.exists({ _id: userId });
    if (!exists) throw new NotFoundException('Kullanıcı bulunamadı.');
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

function toCandidate(item: DhikrLean): Candidate {
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

function dedupeById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  const result: T[] = [];
  for (const item of items) {
    if (seen.has(item.id)) continue;
    seen.add(item.id);
    result.push(item);
  }
  return result;
}

function parseRecommendation(
  value: unknown,
): { id: string; reason?: string } | null {
  if (!value || typeof value !== 'object') return null;

  const candidate = value as { id?: unknown; reason?: unknown };
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
  if (!id) return null;

  const reason =
    typeof candidate.reason === 'string' && candidate.reason.trim().length > 0
      ? candidate.reason.trim()
      : undefined;

  return { id, reason };
}
