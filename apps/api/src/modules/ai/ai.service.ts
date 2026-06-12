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
import {
  EmbeddingService,
  cosineSimilarity,
} from '../embedding/embedding.service';
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
import { fallbackRecommend } from './utils/fallback-recommender';

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

type UsedModel = 'openai' | 'fallback' | 'retrieval' | 'cache';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

type Candidate = {
  id: string;
  nameTurkish: string;
  virtue: string;
  tags: string[];
  categories: string[];
  timeOfDay: string;
  suitableFor: string[];
};

const SEMANTIC_FALLBACK_REASONING =
  'Niyetine en yakın bulduğum zikirleri benzerliklerine göre sıraladım.';

@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);
  private openAiClient: OpenAI | null = null;
  private openAiClientResolved = false;

  // Katalog embedding'lerinin bellek-içi cache'i. Her istekte 360×1536 float
  // DB'den çekmemek için TTL ile yenilenir.
  private catalogVectors: Array<{ id: string; vector: number[] }> = [];
  private catalogVectorsLoadedAt = 0;

  constructor(
    private readonly configService: ConfigService,
    private readonly embeddingService: EmbeddingService,
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

    const availableDhikrs = await this.dhikrModel
      .find({ isVerified: true, isActive: true })
      .lean<DhikrLean[]>()
      .exec();

    if (availableDhikrs.length === 0) {
      throw new NotFoundException(
        'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
      );
    }

    const availableIdSet = new Set(
      availableDhikrs.map((item) => item._id.toString()),
    );
    const dhikrMapById = new Map(
      availableDhikrs.map((item) => [item._id.toString(), item]),
    );

    // Cache anahtarı katalog sürümünü içerir; katalog değişince doğal invalidasyon.
    const catalogVersion = this.computeCatalogVersion(availableDhikrs);
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
      const cachedIds = cached.recommendedDhikrIds
        .map((id) => id.toString())
        .filter((id) => availableIdSet.has(id));
      if (cachedIds.length > 0) {
        return this.finalizeRecommendation({
          userId,
          freeText,
          timeContext,
          reasoning: cached.reasoning || SEMANTIC_FALLBACK_REASONING,
          safeRecommendedIds: cachedIds,
          dhikrMapById,
          usedModel: 'cache',
        });
      }
    }

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    // 2) Stage A — aday getirimi (embedding veya keyword/zaman tabanlı).
    const retrieval = await this.retrieveCandidates({
      freeText,
      timeContext,
      recentDhikrIds,
      availableDhikrs,
      availableIdSet,
      dhikrMapById,
    });

    // 3) Stage B — yalnız daralan aday kümesi üzerinde LLM rerank + off-topic.
    const openAiResult = await this.generateViaOpenAi({
      freeText,
      timeContext,
      recentDhikrIds,
      candidateDhikrs: retrieval.candidates,
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

    // OpenAI önerilerini yalnızca geçerli adaylarla, id bazında tekilleştirerek
    // süz. Geçersiz/uydurma bir id düşerse gerekçesi de onunla birlikte düşer;
    // böylece assistantNote ile recommendedDhikrIds asla ıraksamaz.
    const rankedRecs = dedupeById(openAiResult?.recommendations ?? [])
      .filter((rec) => availableIdSet.has(rec.id))
      .slice(0, maxRecommendations);

    let safeRecommendedIds = rankedRecs.map((rec) => rec.id);
    let reasoning =
      this.composeReasoning(openAiResult?.summary, rankedRecs, dhikrMapById) ||
      'Niyet metnine uygun bir zikir listesi hazırladım.';
    let usedModel: UsedModel = 'openai';

    // LLM sonuç üretemezse Stage A getirim sırasını doğrudan kullan.
    if (safeRecommendedIds.length === 0) {
      safeRecommendedIds = retrieval.candidates
        .map((candidate) => candidate.id)
        .filter((id) => availableIdSet.has(id))
        .slice(0, maxRecommendations);
      reasoning = retrieval.reasoning || reasoning;
      usedModel = retrieval.source === 'semantic' ? 'retrieval' : 'fallback';
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

    // 4) Cache write — off-topic olmayan başarılı sonuçlar.
    if (safeRecommendedIds.length > 0) {
      await this.writeCache(cacheKey, safeRecommendedIds, reasoning, usedModel);
    }

    return result;
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

  /**
   * Stage A — niyet metnine en uygun ~K adayı getirir. Önce embedding
   * (anlamsal) dener; embedding/sorgu yoksa keyword + zaman tabanlı sıraya düşer.
   */
  private async retrieveCandidates(input: {
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    availableDhikrs: DhikrLean[];
    availableIdSet: Set<string>;
    dhikrMapById: Map<string, DhikrLean>;
  }): Promise<{
    candidates: Candidate[];
    source: 'semantic' | 'keyword';
    reasoning: string;
  }> {
    const topK = this.readNumberConfig('AI_RETRIEVAL_TOP_K', 20);

    if (input.freeText) {
      const queryVector = await this.embeddingService.embed(input.freeText);
      if (queryVector) {
        const vectors = await this.getCatalogVectors();
        const scored = vectors
          .filter((entry) => input.availableIdSet.has(entry.id))
          .map((entry) => ({
            id: entry.id,
            score: cosineSimilarity(queryVector, entry.vector),
          }))
          .sort((a, b) => b.score - a.score)
          .slice(0, topK);

        if (scored.length > 0) {
          const candidates = scored
            .map((entry) => input.dhikrMapById.get(entry.id))
            .filter((item): item is DhikrLean => Boolean(item))
            .map(toCandidate);

          return {
            candidates,
            source: 'semantic',
            reasoning: SEMANTIC_FALLBACK_REASONING,
          };
        }
      }
    }

    // Keyword + zaman tabanlı getirim (embedding yok / sorgu yok / vektör yok).
    const fallback = fallbackRecommend({
      freeText: input.freeText,
      timeContext: input.timeContext,
      recentDhikrIds: input.recentDhikrIds,
      availableDhikrs: input.availableDhikrs.map((item) => ({
        _id: item._id.toString(),
        nameTurkish: item.nameTurkish,
        tags: item.tags,
        categories: item.categories,
        timeOfDay: item.timeOfDay,
        suitableFor: item.suitableFor,
      })),
      maxRecommendations: topK,
    });

    const candidates = dedupeIds(fallback.recommendedIds)
      .filter((id) => input.availableIdSet.has(id))
      .map((id) => input.dhikrMapById.get(id))
      .filter((item): item is DhikrLean => Boolean(item))
      .map(toCandidate);

    return { candidates, source: 'keyword', reasoning: fallback.reasoning };
  }

  /** Katalog embedding'lerini bellek-içi cache'ten (TTL'li) döndürür. */
  private async getCatalogVectors() {
    const ttl = this.readNumberConfig('AI_CATALOG_CACHE_TTL_MS', 600_000);
    const isFresh = Date.now() - this.catalogVectorsLoadedAt < ttl;
    if (this.catalogVectors.length > 0 && isFresh) {
      return this.catalogVectors;
    }

    const docs = await this.dhikrModel
      .find({ isVerified: true, isActive: true })
      .select('_id embedding')
      .lean<Array<{ _id: Types.ObjectId; embedding?: number[] }>>()
      .exec();

    this.catalogVectors = docs
      .filter(
        (doc): doc is { _id: Types.ObjectId; embedding: number[] } =>
          Array.isArray(doc.embedding) && doc.embedding.length > 0,
      )
      .map((doc) => ({ id: doc._id.toString(), vector: doc.embedding }));
    this.catalogVectorsLoadedAt = Date.now();

    return this.catalogVectors;
  }

  private computeCatalogVersion(dhikrs: DhikrLean[]): string {
    let maxUpdated = 0;
    for (const dhikr of dhikrs) {
      const updated = dhikr.updatedAt ? new Date(dhikr.updatedAt).getTime() : 0;
      if (updated > maxUpdated) {
        maxUpdated = updated;
      }
    }
    return `${dhikrs.length}:${maxUpdated}`;
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

    const hour = timeContext.hour;
    if (hour >= 5 && hour < 12) {
      return 'morning';
    }
    if (hour >= 12 && hour < 19) {
      return 'evening';
    }
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
      // Cache yazımı best-effort; hata öneri yanıtını bozmamalı.
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

    // Seçilen zikrin popülerlik sayacını best-effort artır; hata seçim
    // yanıtını bozmamalı.
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

        if (name && reason) {
          return `- **${name}:** ${reason}`;
        }
        if (name) {
          return `- **${name}**`;
        }
        return reason ? `- ${reason}` : null;
      })
      .filter((line): line is string => Boolean(line));

    const parts: string[] = [];
    const cleanSummary = summary?.trim();
    if (cleanSummary) {
      parts.push(cleanSummary);
    }
    if (lines.length > 0) {
      parts.push(lines.join('\n'));
    }

    return parts.join('\n\n');
  }

  private async generateViaOpenAi(input: {
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    candidateDhikrs: Array<{
      id: string;
      nameTurkish: string;
      tags: string[];
      categories: string[];
      timeOfDay: string;
      suitableFor: string[];
      virtue: string;
    }>;
    maxRecommendations: number;
  }) {
    const client = this.getOpenAiClient();

    if (!client) {
      return null;
    }
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-5.4-mini';
    // GPT-5 / o-serisi reasoning modelleri chat.completions'ta custom
    // temperature'ı reddeder (yalnızca varsayılan kabul edilir). Bu yüzden
    // temperature'ı yalnızca destekleyen modellerde gönderiyoruz.
    const supportsTemperature = !/^(gpt-5|o\d)/i.test(model);

    const systemInstruction = [
      'Sen bir İslami zikir öneri asistanısın.',
      'İLK ADIM — konu tespiti: freeText zikir, dua, manevi hal, niyet veya İslami yaşamla (huzur, şükür, bağışlanma, kaygı, rızık, şifa, koruma, sabır, tövbe vb.) alakalı mı?',
      'Aşağıdaki durumlarda off_topic: true döndür, recommendations dizisini boş bırak, summary yazma: (1) anlamsız/rastgele karakter dizisi (ör. "sllsd", "asdfg", "123abc"), (2) genel sohbet veya selamlama, (3) model/sistem/teknik soru, (4) İslami yaşamla hiç ilgisi olmayan herhangi bir içerik.',
      'Konu ilgiliyse → off_topic: false yap ve devam et.',
      'YALNIZCA verilen candidateDhikrs listesinden seçim yap; liste dışından ID üretme.',
      'Niyeti adayların fazilet (virtue), etiket (tags) ve kategori (categories) alanlarıyla eşleştirerek en uygunları seç.',
      'Niyete EN DOĞRUDAN hitap eden duaları öncele (ör. şifa isteyene doğrudan şifa/afiyet duaları). İstiğfar, tövbe veya genel zikir gibi yalnızca dolaylı/teğet ilgili olanları üst sıralara koyma; ancak doğrudan adaylar yetersizse ve alt sıralarda ekle.',
      'Duanın kime yönelik olduğuna dikkat et: kullanıcı kendisi için istiyorsa kendine yönelik (birinci şahıs) duaları tercih et; başkası ya da hasta ziyareti için olanları kullanıcı bunu açıkça belirtmedikçe önceleme.',
      'Zaman bağlamını (timeOfDay, suitableFor) ikincil kriter olarak kullan.',
      `En fazla ${input.maxRecommendations} zikir seç ve en uygundan başlayarak sırala. ${input.maxRecommendations} bir üst sınırdır, doldurulması gereken bir hedef değildir: niyetle gerçekten alakalı yeterli aday yoksa daha az öner (ör. yalnızca 2-3).`,
      `Sırf listeyi doldurmak için alakası zayıf ya da niyetle çelişen bir duayı EKLEME. Bir adayın reason'ını yazarken niyetten farklı/uzak olduğunu ifade ediyorsan, o adayı hiç ekleme (ör. sınav niyetine rızık/borç duası ekleme).`,
      'Her seçtiğin zikir için recommendations dizisine bir nesne ekle: id (candidate id) ve reason (o zikrin neden seçildiği).',
      "Her reason yalnızca o id'nin kendi fazilet/etiket/kategori içeriğinden türemeli; başka bir duanın özelliğini o reason'a yazma.",
      "Yalnızca recommendations dizisindeki id'lerden bahset; listede olmayan bir zikri reason veya summary içinde anma.",
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
        // Düşük temperature öneri görevinde isabet için tercih edilir (varsayılan
        // ~1.0 aynı niyet için farklı/alakasız seçimlere yol açıyordu). Reasoning
        // modelleri custom değeri reddettiğinden yalnızca destekleyen modellerde
        // gönderiyoruz; env ile ayarlanabilir (varsayılan 0.2).
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
        parsed = JSON.parse(text) as {
          off_topic?: unknown;
          recommendations?: unknown;
          summary?: unknown;
        };
      } catch (error) {
        this.logger.warn(
          `OpenAI yanıtı JSON olarak ayrıştırılamadı: ${this.describeError(error)}`,
        );
        return null;
      }

      const offTopic = parsed.off_topic === true;

      if (offTopic) {
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

      return {
        recommendations,
        summary,
        offTopic: false,
      };
    } catch (error) {
      this.logger.warn(
        `OpenAI öneri çağrısı başarısız oldu, fallback kullanılacak: ${this.describeError(error)}`,
      );
      return null;
    }
  }

  private getOpenAiClient(): OpenAI | null {
    if (this.openAiClientResolved) {
      return this.openAiClient;
    }

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
    if (error instanceof Error) {
      return error.message;
    }

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
    if (!exists) {
      throw new NotFoundException('Kullanıcı bulunamadı.');
    }
  }

  private asObjectId(rawId: string, message: string) {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException(message);
    }

    return new Types.ObjectId(rawId);
  }
}

function toDateString(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function dedupeIds(ids: string[]) {
  return [...new Set(ids)];
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

// Cache anahtarı ve fallback eşleşmesi için Türkçe-duyarlı normalleştirme:
// küçük harf + aksan sadeleştirme + noktalama temizliği.
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
    if (seen.has(item.id)) {
      continue;
    }
    seen.add(item.id);
    result.push(item);
  }

  return result;
}

function parseRecommendation(
  value: unknown,
): { id: string; reason?: string } | null {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as { id?: unknown; reason?: unknown };
  const id = typeof candidate.id === 'string' ? candidate.id.trim() : '';
  if (!id) {
    return null;
  }

  const reason =
    typeof candidate.reason === 'string' && candidate.reason.trim().length > 0
      ? candidate.reason.trim()
      : undefined;

  return { id, reason };
}
