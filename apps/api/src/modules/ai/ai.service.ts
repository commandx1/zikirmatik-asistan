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
    const freeText = payload.freeText?.trim() || undefined;

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

    const allDhikrs = availableDhikrs.map((item) => ({
      id: item._id.toString(),
      nameTurkish: item.nameTurkish,
      meaning: item.meaning,
      virtue: item.virtue,
      tags: item.tags,
      categories: item.categories,
      timeOfDay: item.timeOfDay,
      suitableFor: item.suitableFor,
    }));

    const openAiResult = await this.generateViaOpenAi({
      freeText,
      timeContext,
      recentDhikrIds,
      candidateDhikrs: allDhikrs,
      maxRecommendations,
    });

    const openAiRankedIds = dedupeIds(openAiResult?.recommendedIds ?? [])
      .filter((id) => availableIdSet.has(id))
      .slice(0, maxRecommendations);

    let safeRecommendedIds = openAiRankedIds.slice();
    let reasoning =
      openAiResult?.reasoning?.trim() ||
      'Niyet metnine uygun bir zikir listesi hazırladım.';
    let usedModel: 'openai' | 'fallback' = 'openai';

    if (openAiRankedIds.length === 0 || safeRecommendedIds.length === 0) {
      const fallback = fallbackRecommend({
        freeText,
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
        maxRecommendations,
      });

      safeRecommendedIds = dedupeIds(fallback.recommendedIds)
        .filter((id) => availableIdSet.has(id))
        .slice(0, maxRecommendations);
      reasoning = fallback.reasoning || reasoning;
      usedModel = 'fallback';
    }

    await this.userModel
      .updateOne(
        { _id: userId },
        {
          $set: {
            lastSeenAt: new Date(),
          },
        },
      )
      .exec();

    const created = await this.aiRecommendationModel.create({
      userId,
      freeText,
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
      reasoning,
      items: recommendedItems,
      usedModel,
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

  private async generateViaOpenAi(input: {
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
      virtue: string;
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

    const systemInstruction = [
      'Sen bir İslami zikir öneri asistanısın.',
      'YALNIZCA verilen candidateDhikrs listesinden seçim yap.',
      'Candidate listesi dışından ID üretme.',
      'Seçimde zikir anlamını (meaning), etiketlerini(tags), suitableFor, fazilet(virtue) bilgilerini, kullanıcının freeText niyetiyle semantik uyumunu ve zaman bağlamını birlikte değerlendir.',
      `Maksimum ${input.maxRecommendations} ID döndür.`,
      `En fazla ${input.maxRecommendations} zikir seç.`,
      'reasoning direkt olarak kullanıcıya gösterileceğinden, orada insanî bir dil kullan. id gibi data özelliği gösterme.',
      'JSON formatı dışında cevap verme.',
    ].join(' ');

    const promptPayload = {
      freeText: input.freeText,
      timeContext: input.timeContext,
      recentDhikrIds: input.recentDhikrIds,
      candidateDhikrs: input.candidateDhikrs,
      outputFormat: {
        recommendedIds: 'string[]',
        reasoning: 'string',
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
      };
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
