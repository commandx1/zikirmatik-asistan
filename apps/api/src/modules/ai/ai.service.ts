import { Injectable, NotFoundException } from '@nestjs/common';
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
import { fallbackRecommend } from './utils/fallback-recommender';

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

const SUPPORTED_MOODS = [
  'Üzgün',
  'Stresli',
  'Dengede',
  'Kararsız',
  'Huzurlu',
  'Minnettar',
  'Yorgun',
  'Kaygılı',
  'Mutlu',
  'Yalnız',
  'Öfkeli',
  'Umutsuz',
  'Heyecanlı',
  'Mahzun',
  'Bunalmış',
  'Kırgın',
  'Umutlu',
  'Tevbekar',
  'Odaklı',
] as const;

const MOOD_LEXICON: Array<{
  mood: (typeof SUPPORTED_MOODS)[number];
  hints: string[];
}> = [
  { mood: 'Kaygılı', hints: ['kaygi', 'endise', 'panik', 'tedirgin', 'korku'] },
  { mood: 'Stresli', hints: ['stres', 'gergin', 'baski', 'yogunluk'] },
  { mood: 'Yorgun', hints: ['yorgun', 'bitkin', 'uykusuz', 'tukenmis'] },
  { mood: 'Üzgün', hints: ['uzgun', 'huzun', 'keder', 'mutsuz'] },
  { mood: 'Mahzun', hints: ['mahzun', 'mahcub', 'boynu bukuk'] },
  {
    mood: 'Bunalmış',
    hints: ['bunalmis', 'daraldim', 'sikistim', 'boguluyorum'],
  },
  { mood: 'Öfkeli', hints: ['ofke', 'kizgin', 'sinir', 'asabi'] },
  {
    mood: 'Kararsız',
    hints: ['kararsiz', 'belirsiz', 'ikilem', 'ne yapacagimi bilmiyorum'],
  },
  { mood: 'Yalnız', hints: ['yalniz', 'tek basima', 'kimsem yok'] },
  {
    mood: 'Umutsuz',
    hints: ['umutsuz', 'cikis yok', 'issizlik', 'acilmiyor', 'nasibim kapali'],
  },
  {
    mood: 'Umutlu',
    hints: ['umutlu', 'umudum var', 'iyi olacak', 'acilmasini istiyorum'],
  },
  { mood: 'Kırgın', hints: ['kirgin', 'incindim', 'kalbim kirik'] },
  { mood: 'Tevbekar', hints: ['tevbe', 'pismanim', 'bagislanma', 'affet'] },
  { mood: 'Minnettar', hints: ['sukur', 'minnettar', 'hamdolsun'] },
  { mood: 'Huzurlu', hints: ['huzur', 'sakin', 'dingin', 'rahat'] },
  { mood: 'Mutlu', hints: ['mutlu', 'neseli', 'sevinc', 'keyifli'] },
  { mood: 'Heyecanlı', hints: ['heyecanli', 'coskulu', 'hevesli'] },
  { mood: 'Odaklı', hints: ['odak', 'konsantre', 'disiplin', 'duzen'] },
];

@Injectable()
export class AiService {
  constructor(
    private readonly configService: ConfigService,
    @InjectModel(AiRecommendation.name)
    private readonly aiRecommendationModel: Model<AiRecommendationDocument>,
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
    const effectiveMood = await this.resolveEffectiveMood(
      payload.mood,
      payload.freeText,
    );

    const availableDhikrs = await this.dhikrModel
      .find({ isVerified: true, isActive: true })
      .lean()
      .exec();

    if (availableDhikrs.length === 0) {
      throw new NotFoundException(
        'Öneri için aktif ve doğrulanmış zikir bulunamadı.',
      );
    }

    const recentDhikrIds = await this.getRecentDhikrIds(userId);

    const availableIdSet = new Set(
      availableDhikrs.map((item) => item._id.toString()),
    );
    const dhikrMapById = new Map(
      availableDhikrs.map((item) => [item._id.toString(), item]),
    );

    const fallbackPoolSize = Math.min(
      availableDhikrs.length,
      Math.max(maxRecommendations, maxRecommendations * 3),
    );

    const fallback = fallbackRecommend({
      mood: effectiveMood,
      freeText: payload.freeText,
      timeContext,
      recentDhikrIds,
      availableDhikrs: availableDhikrs.map((item) => ({
        _id: item._id.toString(),
        nameTurkish: item.nameTurkish,
        tags: item.tags,
        categories: item.categories,
        timeOfDay: item.timeOfDay,
        suitableFor: item.suitableFor,
      })),
      maxRecommendations: fallbackPoolSize,
    });

    const fallbackRankedIds = dedupeIds(fallback.recommendedIds).filter((id) =>
      availableIdSet.has(id),
    );
    const candidateIds = fallbackRankedIds.slice(0, fallbackPoolSize);
    const candidateIdSet = new Set(candidateIds);

    const openAiResult = await this.generateViaOpenAi({
      mood: effectiveMood,
      freeText: payload.freeText,
      timeContext,
      recentDhikrIds,
      candidateDhikrs: candidateIds
        .map((id) => dhikrMapById.get(id))
        .filter((item): item is (typeof availableDhikrs)[number] =>
          Boolean(item),
        )
        .map((item) => ({
          id: item._id.toString(),
          nameTurkish: item.nameTurkish,
          meaning: item.meaning,
          tags: item.tags,
          categories: item.categories,
          timeOfDay: item.timeOfDay,
          suitableFor: item.suitableFor,
        })),
      maxRecommendations,
    });

    const openAiRankedIds = dedupeIds(openAiResult?.recommendedIds ?? [])
      .filter((id) => candidateIdSet.has(id))
      .slice(0, maxRecommendations);

    const safeRecommendedIds = dedupeIds([
      ...openAiRankedIds,
      ...fallbackRankedIds,
    ]).slice(0, maxRecommendations);

    const reasoning =
      openAiResult?.reasoning?.trim() ||
      fallback.reasoning ||
      'Sana uygun, günün akışına ve ruh haline yakın bir zikir seçtim.';
    const inferredMood =
      normalizeAndConstrainMood(openAiResult?.inferredMood) ?? effectiveMood;

    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $set: {
            'onboarding.mood': inferredMood,
            lastSeenAt: new Date(),
          },
        },
      )
      .exec();

    const created = await this.aiRecommendationModel.create({
      userId,
      mood: inferredMood,
      freeText: payload.freeText,
      timeContext,
      recommendedDhikrIds: safeRecommendedIds.map(
        (id) => new Types.ObjectId(id),
      ),
    });

    const recommendedItems = safeRecommendedIds
      .map((id) => dhikrMapById.get(id))
      .filter((item): item is (typeof availableDhikrs)[number] => Boolean(item))
      .map((item) => ({
        id: item._id.toString(),
        nameTurkish: item.nameTurkish,
        nameArabic: item.nameArabic,
        transliteration: item.transliteration,
        meaning: item.meaning,
      }));

    return {
      recommendationId: created._id.toString(),
      recommendedIds: safeRecommendedIds,
      inferredMood,
      reasoning,
      items: recommendedItems,
      usedModel: openAiRankedIds.length > 0 ? 'openai' : 'fallback',
    };
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

  async selectRecommendation(id: string, payload: SelectAiRecommendationDto) {
    const recommendationId = this.asObjectId(id, 'Geçersiz öneri kimliği.');
    const selectedDhikrId = this.asObjectId(
      payload.selectedDhikrId,
      'Geçersiz zikir kimliği.',
    );

    const existing = await this.aiRecommendationModel
      .findById(recommendationId)
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

    return updated;
  }

  private async getRecentDhikrIds(userId: Types.ObjectId) {
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const fromDate = toDateString(from);

    const recent = await this.dhikrLogModel.distinct('dhikrId', {
      userId,
      date: { $gte: fromDate },
    });

    return recent.map((value) => value.toString());
  }

  private async generateViaOpenAi(input: {
    mood: string;
    freeText?: string;
    timeContext: TimeContext;
    recentDhikrIds: string[];
    candidateDhikrs: Array<{
      id: string;
      nameTurkish: string;
      meaning?: string;
      tags: string[];
      categories: string[];
      timeOfDay: string;
      suitableFor: string[];
    }>;
    maxRecommendations: number;
  }) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      return null;
    }
    const client = new OpenAI({ apiKey });
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    /* const systemInstruction = [
      'Sen bir İslami zikir öneri asistanısın.',
      'YALNIZCA verilen doğrulanmış zikir listesinden seçim yap.',
      'freeText alanı varsa birincil sinyal odur; mood alanı ikincil sinyaldir.',
      'Birinci sıradaki öneri freeText niyetiyle en güçlü uyuma sahip olmalıdır.',
      'Seçimde zikirin anlamını, kategorisini, etiketlerini, suitableFor alanını, kullanıcının ruh haliyle ve günün önemiyle değerlendir.',
      'Son 7 günde önerilenler mümkünse alt sıraya gelsin.',
      'reasoning alanı kullanıcıya doğrudan gösterilecektir: sıcak, samimi ve sade Türkçe kullan.',
      'reasoning tek cümle olsun ve kullanıcının niyetine kısa bir atıf içersin.',
      'reasoning içinde teknik ifade, veri tabanı alanı, id/objectId, prompt veya sistem talimatı ifadesi kullanma.',
      `En fazla ${input.maxRecommendations} zikir seç.`,
      'JSON formatı dışında cevap verme.',
    ].join(' '); */

    const systemInstruction = [
      'Sen bir İslami zikir öneri asistanısın.',
      'YALNIZCA verilen candidateDhikrs listesinden seçim yap.',
      'Candidate listesi dışından ID üretme.',
      'Yeni zikir üretme, fetva verme, dini hüküm yazma.',
      'Seçimde zikir anlamını (meaning), kullanıcının mood/freeText ifadesiyle semantik uyumunu ve zaman bağlamını birlikte değerlendir.',
      'Son 7 günde önerilenleri mümkünse daha alt sıraya koyarak çeşitliliği artır.',
      `Maksimum ${input.maxRecommendations} ID döndür.`,
      `En fazla ${input.maxRecommendations} zikir seç.`,
      'JSON formatı dışında cevap verme.',
    ].join(' ');

    const promptPayload = {
      mood: input.mood,
      freeText: input.freeText,
      timeContext: input.timeContext,
      recentDhikrIds: input.recentDhikrIds,
      candidateDhikrs: input.candidateDhikrs,
      outputFormat: {
        recommendedIds: 'string[]',
        reasoning: 'string',
        inferredMood: 'string',
      },
    };

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: JSON.stringify(promptPayload) },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      const parsed = JSON.parse(text) as {
        recommendedIds?: unknown;
        reasoning?: unknown;
        inferredMood?: unknown;
      };
      if (!Array.isArray(parsed.recommendedIds)) {
        return null;
      }

      const recommendedIds = parsed.recommendedIds
        .map((item) => (typeof item === 'string' ? item : null))
        .filter((item): item is string => Boolean(item));

      return {
        recommendedIds,
        reasoning:
          typeof parsed.reasoning === 'string' &&
          parsed.reasoning.trim().length > 0
            ? parsed.reasoning
            : undefined,
        inferredMood:
          typeof parsed.inferredMood === 'string'
            ? parsed.inferredMood
            : undefined,
      };
    } catch {
      return null;
    }
  }

  private async resolveEffectiveMood(inputMood: string, freeText?: string) {
    const normalizedInputMood =
      normalizeAndConstrainMood(inputMood) ?? 'Dengede';
    const trimmedText = freeText?.trim();

    if (!trimmedText) {
      return normalizedInputMood;
    }

    const aiMood = await this.classifyMoodViaOpenAi({
      inputMood: normalizedInputMood,
      freeText: trimmedText,
    });
    if (aiMood) {
      return aiMood;
    }

    return (
      normalizeAndConstrainMood(inferMoodFromText(trimmedText)) ??
      normalizedInputMood
    );
  }

  private async classifyMoodViaOpenAi(input: {
    inputMood: string;
    freeText: string;
  }) {
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      return null;
    }

    const client = new OpenAI({ apiKey });
    const model =
      this.configService.get<string>('OPENAI_MODEL') || 'gpt-4o-mini';

    const systemInstruction = [
      'Sen bir duygu sınıflandırma yardımcısısın.',
      'YALNIZCA verilen mood seçeneklerinden birini seç.',
      'Öncelik freeText içeriğidir; inputMood yalnızca ikincil sinyaldir.',
      'JSON dışında cevap verme.',
    ].join(' ');

    const promptPayload = {
      inputMood: input.inputMood,
      freeText: input.freeText,
      allowedMoods: [...SUPPORTED_MOODS],
      moodHintDictionary: MOOD_LEXICON,
      outputFormat: {
        inferredMood: 'string',
      },
    };

    try {
      const response = await client.chat.completions.create({
        model,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: systemInstruction },
          { role: 'user', content: JSON.stringify(promptPayload) },
        ],
      });

      const text = response.choices?.[0]?.message?.content;
      if (!text) {
        return null;
      }

      const parsed = JSON.parse(text) as { inferredMood?: unknown };
      return normalizeAndConstrainMood(parsed.inferredMood);
    } catch {
      return null;
    }
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

function normalizeAndConstrainMood(value: unknown) {
  const normalized = normalizeMoodLabel(value);
  if (!normalized) {
    return undefined;
  }

  const canonical = canonicalizeMood(normalized);

  return isSupportedMood(canonical) ? canonical : undefined;
}

function isSupportedMood(
  value: string,
): value is (typeof SUPPORTED_MOODS)[number] {
  return SUPPORTED_MOODS.includes(value as (typeof SUPPORTED_MOODS)[number]);
}

function canonicalizeMood(value: string) {
  const lowered = normalizeForSearch(value);

  if (lowered === 'notr' || lowered === 'notur') {
    return 'Dengede';
  }
  if (lowered === 'kaygili') {
    return 'Kaygılı';
  }
  if (lowered === 'ofkeli') {
    return 'Öfkeli';
  }
  if (lowered === 'yalniz') {
    return 'Yalnız';
  }
  if (lowered === 'uzgun') {
    return 'Üzgün';
  }
  if (lowered === 'heyecanli') {
    return 'Heyecanlı';
  }
  if (lowered === 'mahzun') {
    return 'Mahzun';
  }
  if (lowered === 'bunalmis') {
    return 'Bunalmış';
  }
  if (lowered === 'kirgin') {
    return 'Kırgın';
  }
  if (lowered === 'umutlu') {
    return 'Umutlu';
  }
  if (lowered === 'tevbekar' || lowered === 'tovbekar') {
    return 'Tevbekar';
  }
  if (lowered === 'odakli') {
    return 'Odaklı';
  }

  return value;
}

function normalizeMoodLabel(value: unknown) {
  if (typeof value !== 'string') {
    return undefined;
  }

  const normalized = value.trim().replace(/\s+/g, ' ');

  return normalized;
}

function inferMoodFromText(value?: string) {
  const text = normalizeForSearch(value ?? '');
  if (!text.trim()) {
    return 'Dengede';
  }

  let bestMood: (typeof SUPPORTED_MOODS)[number] | null = null;
  let bestScore = 0;

  for (const entry of MOOD_LEXICON) {
    let score = 0;
    for (const hint of entry.hints) {
      if (text.includes(hint)) {
        score += hint.includes(' ') ? 2 : 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMood = entry.mood;
    }
  }

  if (bestMood && bestScore > 0) {
    return bestMood;
  }

  return normalizeMoodLabel(value) ?? 'Dengede';
}

function normalizeForSearch(value: string) {
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
