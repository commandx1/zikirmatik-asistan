import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { dateKeyInZone, requestTimezone } from '../../common/utils/date-keys';
import { Dhikr, type DhikrDocument } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiCreditsService } from './ai-credits.service';
import { AiRuntimeService } from './ai-runtime.service';
import { RetrievalService } from './retrieval.service';
import {
  RecommendationAgentService,
  type AgentOutcome,
} from './recommendation-agent.service';
import { CreateAiRecommendationDto } from './dto/create-ai-recommendation.dto';
import { QueryAiRecommendationsDto } from './dto/query-ai-recommendations.dto';
import { SelectAiRecommendationDto } from './dto/select-ai-recommendation.dto';
import {
  AiRecommendation,
  type AiRecommendationDocument,
} from './schemas/ai-recommendation.schema';
import { OFF_TOPIC_MESSAGE } from './prompts';
import type { SupportedAiLocale } from './utils/locale';

type TimeContext = {
  hour: number;
  dayOfWeek: number;
  isSpecialDay: boolean;
  specialDayName?: string;
};

// Seçilen zikir + LLM'in yazdığı gerekçe — RecommendationAgentService'in
// 'selected' outcome'undaki `items` alanıyla birebir aynı şekil.
type SelectedItem = Extract<
  AgentOutcome,
  { kind: 'selected' }
>['items'][number];

/**
 * AI Rehber öneri akışının ince (thin) orkestrasyon katmanı. Tüm LLM/agent
 * mantığı `RecommendationAgentService`'e taşındı — burada yalnızca kredi
 * kontrolü, agent çağrısı, sonucun (offTopic/clarification/selected)
 * response şekline dönüştürülmesi ve kalıcılaştırma (persist) vardır.
 * Fallback/cache/kategori dalı YOKTUR: agent hata fırlatırsa
 * (AiPipelineError) hiçbir kredi düşülmeden üst katmana (controller filtresi)
 * yükselir.
 */
@Injectable()
export class AiService {
  private readonly logger = new Logger(AiService.name);

  constructor(
    private readonly progressGateway: AiProgressGateway,
    @InjectModel(AiRecommendation.name)
    private readonly aiRecommendationModel: Model<AiRecommendationDocument>,
    private readonly aiCreditsService: AiCreditsService,
    @InjectModel(Dhikr.name)
    private readonly dhikrModel: Model<DhikrDocument>,
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly retrievalService: RetrievalService,
    private readonly recommendationAgent: RecommendationAgentService,
    private readonly runtime: AiRuntimeService,
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
    const socketId = payload.socketId;
    const log = this.runtime.flowLog(flowId);

    this.emitStep(socketId, 'analyzing', 'Niyetin analiz ediliyor...');
    // PII: kullanıcı metni asla loglanmaz — yalnız uzunluk.
    log.log(
      `[start] userId=${userId.toString()} freeTextLen=${freeText?.length ?? 0}`,
    );

    const user = await this.ensureUserExists(userId);
    const promptHash = this.aiCreditsService.computePromptHash({ freeText });
    await this.aiCreditsService.ensureCreditAccessForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
    );

    // B7: aynı flowId tekrarı → kayıtlı öneri (ajan/LLM yeniden çalışmaz).
    const stored = await this.aiRecommendationModel
      .findOne({ userId, flowId })
      .lean()
      .exec();
    if (stored) {
      log.log('[replay] kayıtlı öneri döndü');
      return this.replayRecommendation(stored, userId);
    }

    const maxRecommendations = payload.maxRecommendations ?? 5;
    const timeContext = payload.timeContext ?? this.defaultTimeContext();
    const timeOfDay = this.resolveTimeOfDay(timeContext);
    const recentDhikrIds =
      await this.retrievalService.getRecentDhikrIds(userId);

    const outcome = await this.recommendationAgent.run({
      freeText,
      timeOfDay,
      recentDhikrIds,
      maxRecommendations,
      socketId,
      locale,
      flowId,
      userId: userId.toString(),
    });

    // ── Off-topic ───────────────────────────────────────────────────────────
    if (outcome.kind === 'offTopic') {
      log.log(`[off-topic] tespit edildi — ${Date.now() - startedAt}ms`);
      return {
        kind: 'offTopic' as const,
        offTopic: true as const,
        message: OFF_TOPIC_MESSAGE[locale],
        recommendedIds: [] as string[],
        items: [] as SelectedItem[],
        usedModel: 'openai' as const,
        locale,
      };
    }

    // ── Netleştirme sorusu ──────────────────────────────────────────────────
    if (outcome.kind === 'clarification') {
      log.log(`[clarification] soru üretildi — ${Date.now() - startedAt}ms`);
      return {
        kind: 'clarification' as const,
        needsClarification: true as const,
        message: outcome.question,
        // Legacy alan: eski mobil istemciler kategori seçim UI'ı için bu
        // alanı bekliyordu. Yeni akışta kategori önerilmiyor — her zaman
        // boş dizi döner (geriye dönük uyumluluk amaçlı, kaldırılmadı).
        suggestedCategories: [] as string[],
        recommendedIds: [] as string[],
        items: [] as SelectedItem[],
        usedModel: 'openai' as const,
        locale,
      };
    }

    // ── Seçildi: kalıcılaştır + kredi düş ────────────────────────────────────
    const reasoning = this.composeReasoning(
      outcome.summary,
      outcome.items,
      locale,
    );

    // B9: önce kredi düşülür, sonra içerik kalıcılaşır (eşzamanlı kredi
    // tükenmesinde düşüşsüz içerik kalmaz; chat ile aynı sıra).
    const wallet = await this.aiCreditsService.debitCreditForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
    );
    this.emitStep(socketId, 'finalizing', 'Öneriler hazırlanıyor...');
    const result = await this.finalizeRecommendation({
      userId,
      flowId,
      freeText,
      timeContext,
      reasoning,
      items: outcome.items,
      locale,
    });

    log.log(
      `[done] count=${result.recommendedIds.length} — ${Date.now() - startedAt}ms`,
    );
    return { ...result, remainingCredits: wallet.balance };
  }

  /**
   * Öneriyi kalıcılaştırır: aiRecommendation kaydı oluşturur, lastSeenAt
   * günceller ve yanıt nesnesini kurar.
   */
  private async finalizeRecommendation(input: {
    userId: Types.ObjectId;
    flowId: string;
    freeText?: string;
    timeContext: TimeContext;
    reasoning: string;
    items: SelectedItem[];
    locale: SupportedAiLocale;
  }) {
    await this.userModel
      .updateOne({ _id: input.userId }, { $set: { lastSeenAt: new Date() } })
      .exec();

    const recommendedIds = input.items.map(({ dhikr }) => dhikr._id.toString());

    let created: AiRecommendationDocument;
    try {
      created = await this.aiRecommendationModel.create({
        userId: input.userId,
        flowId: input.flowId,
        freeText: input.freeText,
        assistantNote: input.reasoning,
        locale: input.locale,
        timeContext: input.timeContext,
        recommendedDhikrIds: recommendedIds.map((id) => new Types.ObjectId(id)),
      });
    } catch (error) {
      // Aynı flowId'li eşzamanlı istek önce yazdı (unique userId+flowId):
      // onun kaydını döndür, ikinci belge oluşmaz.
      if ((error as { code?: number }).code !== 11000) throw error;
      const stored = await this.aiRecommendationModel
        .findOne({ userId: input.userId, flowId: input.flowId })
        .lean()
        .exec();
      if (!stored) throw error;
      return this.replayRecommendation(stored, input.userId);
    }

    return {
      kind: 'recommendations' as const,
      recommendationId: created._id.toString(),
      recommendedIds,
      reasoning: input.reasoning,
      items: input.items.map(({ dhikr }) => this.toRecommendedItem(dhikr)),
      usedModel: 'openai' as const,
      locale: input.locale,
    };
  }

  private toRecommendedItem(dhikr: SelectedItem['dhikr']) {
    return {
      id: dhikr._id.toString(),
      name: dhikr.name,
      nameArabic: dhikr.nameArabic,
      transliteration: dhikr.transliteration,
      meaning: dhikr.meaning,
      virtue: dhikr.virtue,
      source: dhikr.source,
      recommendedCount: dhikr.recommendedCount,
    };
  }

  /** Kayıtlı öneriyi, ilk yanıtla aynı şekilde yeniden kurar (ajan çalışmaz). */
  private async replayRecommendation(
    stored: {
      _id: Types.ObjectId;
      assistantNote?: string;
      locale?: string;
      recommendedDhikrIds: Types.ObjectId[];
    },
    userId: Types.ObjectId,
  ) {
    const dhikrs = await this.dhikrModel
      .find({ _id: { $in: stored.recommendedDhikrIds } })
      .lean()
      .exec();
    const byId = new Map(dhikrs.map((d) => [d._id.toString(), d]));
    const items = stored.recommendedDhikrIds.flatMap((id) => {
      const dhikr = byId.get(id.toString());
      return dhikr ? [this.toRecommendedItem(dhikr)] : [];
    });
    const credits = await this.aiCreditsService.getCredits(userId.toString());
    return {
      kind: 'recommendations' as const,
      recommendationId: stored._id.toString(),
      recommendedIds: items.map((i) => i.id),
      reasoning: stored.assistantNote ?? '',
      items,
      usedModel: 'openai' as const,
      locale: (stored.locale ?? 'tr') as SupportedAiLocale,
      remainingCredits: credits.balance,
    };
  }

  private resolveTimeOfDay(timeContext: TimeContext): string {
    const hour = timeContext.hour;
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
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
      // Bugfix: eskiden burada recommendedCount (+1) artırılıyordu — o alan
      // mobil tarafta "kaç kez tekrar edilecek" statik hedefidir, gerçek
      // seçim sayacıyla karıştırılmamalı. selectionCount telemetri alanıdır.
      await this.dhikrModel
        .updateOne({ _id: selectedDhikrId }, { $inc: { selectionCount: 1 } })
        .exec();
    } catch (error) {
      this.logger.warn(
        `selectionCount artırılamadı (dhikr ${selectedDhikrId.toString()}): ${this.describeError(error)}`,
      );
    }

    return updated;
  }

  private composeReasoning(
    summary: string | undefined,
    items: SelectedItem[],
    locale: SupportedAiLocale,
  ): string {
    const lines = items
      .map(({ dhikr, reason }) => {
        const name =
          (locale === 'en' ? dhikr.name.en.trim() : dhikr.name.tr.trim()) ||
          dhikr.name.tr.trim();
        const cleanReason = reason ? stripModelRefs(reason).trim() : '';

        if (name && cleanReason) return `- **${name}:** ${cleanReason}`;
        if (name) return `- **${name}**`;
        return cleanReason ? `- ${cleanReason}` : null;
      })
      .filter((line): line is string => Boolean(line));

    const parts: string[] = [];
    const cleanSummary = summary ? stripModelRefs(summary).trim() : '';
    if (cleanSummary) parts.push(cleanSummary);
    if (lines.length > 0) parts.push(lines.join('\n'));

    return parts.join('\n\n');
  }

  private describeError(error: unknown): string {
    if (error instanceof Error) return error.message;
    return typeof error === 'string' ? error : 'bilinmeyen hata';
  }

  // B12: istemci timeContext göndermezse sunucu yerel saati (Render = UTC) değil
  // isteğin saat dilimi (x-client-timezone, yoksa İstanbul) kullanılır.
  private defaultTimeContext(): TimeContext {
    const now = new Date();
    const timeZone = requestTimezone();
    const hour = Number(
      new Intl.DateTimeFormat('en-GB', {
        timeZone,
        hour: '2-digit',
        hourCycle: 'h23',
      }).format(now),
    );
    return {
      hour,
      dayOfWeek: new Date(
        `${dateKeyInZone(now, timeZone)}T00:00:00Z`,
      ).getUTCDay(),
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

/**
 * Modelin metne sızdırabileceği iç referansları temizler: ham ObjectId'ler
 * ve aday listesindeki "C3", "(C12)" gibi kısa ref kodları. Bunlar yalnızca
 * seçim için vardır, kullanıcıya asla görünmemelidir.
 */
function stripModelRefs(text: string) {
  return text
    .replace(/\b[a-f0-9]{24}\b/gi, '')
    .replace(/\(\s*C\d{1,3}\s*\)/g, '')
    .replace(/\bC\d{1,3}\b/g, '')
    .replace(/\s{2,}/g, ' ')
    .replace(/\s+([.,;:!?])/g, '$1');
}
