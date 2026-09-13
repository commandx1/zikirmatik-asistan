import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Types, type Model } from 'mongoose';
import { Dhikr } from '../dhikrs/schemas/dhikr.schema';
import { User, type UserDocument } from '../users/schemas/user.schema';
import type {
  VirdProgramPhase,
  VirdProgramPhaseSlots,
} from '../vird/schemas/vird-program.schema';
import { VirdProgramsService } from '../vird/vird-programs.service';
import { VIRD_SLOT_KEYS, type VirdSlotKey } from '../vird/vird.types';
import { AiCreditsService } from './ai-credits.service';
import { AiRuntimeService } from './ai-runtime.service';
import {
  AI_CREDIT_REASONS,
  VIRD_PROGRAM_CREDIT_COST,
} from './credits.constants';
import { CreateAiVirdProgramDto } from './dto/create-ai-vird-program.dto';
import { OFF_TOPIC_MESSAGE } from './prompts';
import { RetrievalService } from './retrieval.service';
import type { SupportedAiLocale } from './utils/locale';
import {
  VirdProgramAgentService,
  type VirdProgramPhaseOutcome,
} from './vird-program-agent.service';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

// AiVirdService.buildPreview'ın döndürdüğü, mobile'a gösterilecek AI Vird
// Programı önizlemesi. Sözleşmesi docs/vird-programi.md'de tutulur — mobil
// tarafın bu şekli değişmeden tüketebilmesi için PR'lar bu dosyayla birlikte
// gözden geçirilmeli.
export type VirdProgramPreviewItem = {
  dhikrId: string;
  name: string;
  target: number;
};

export type VirdProgramPreviewPhase = {
  fromDay: number;
  toDay: number | null;
  note?: string;
  slots: Partial<Record<VirdSlotKey, VirdProgramPreviewItem[]>>;
};

export type VirdProgramPreview = {
  title: string;
  summary: string;
  durationDays: number;
  phases: VirdProgramPreviewPhase[];
};

export type CreateVirdProgramResult =
  | { kind: 'offTopic'; message: string }
  | {
      kind: 'program';
      programId: string;
      program: VirdProgramPreview;
      remainingCredits: number;
    };

/**
 * AI Vird Programı akışının ince (thin) orkestrasyon katmanı — AiService'in
 * AI Rehber için oynadığı rolün aynısı: kredi kontrolü/kesimi, ajan çağrısı,
 * flowId idempotency'si ve persist edilen taslağın mobile önizleme şekline
 * dönüştürülmesi. LLM/retrieval mantığı YOKTUR (bkz. VirdProgramAgentService).
 * Fallback/cache dalı YOKTUR: ajan hata fırlatırsa (AiPipelineError) hiçbir
 * kredi düşülmeden üst katmana (AiPipelineExceptionFilter → 503) yükselir.
 */
@Injectable()
export class AiVirdService {
  constructor(
    @InjectModel(User.name)
    private readonly userModel: Model<UserDocument>,
    private readonly aiCreditsService: AiCreditsService,
    private readonly runtime: AiRuntimeService,
    private readonly retrievalService: RetrievalService,
    private readonly agent: VirdProgramAgentService,
    private readonly virdProgramsService: VirdProgramsService,
  ) {}

  async createVirdProgram(
    userIdRaw: string,
    payload: CreateAiVirdProgramDto,
    locale: SupportedAiLocale,
  ): Promise<CreateVirdProgramResult> {
    const startedAt = Date.now();
    const userId = this.asObjectId(userIdRaw);
    const flowId = payload.flowId.trim();
    const freeText = payload.freeText?.trim() || '';
    const log = this.runtime.flowLog(flowId);

    log.log(
      `[vird-start] userId=${userId.toString()} durationDays=${payload.durationDays} slots=${payload.slots.join(',')}`,
    );

    const user = await this.ensureUserExists(userId);
    const promptHash = this.aiCreditsService.computePromptHash({
      freeText,
      extra: {
        durationDays: payload.durationDays,
        slots: [...payload.slots].sort(),
        prayerSelection: payload.prayerSelection
          ? [...payload.prayerSelection].sort((a, b) => a - b)
          : undefined,
      },
    });

    await this.aiCreditsService.ensureCreditAccessForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT,
      VIRD_PROGRAM_CREDIT_COST,
    );

    // Idempotent retry: aynı flowId için zaten bir AI taslağı üretilmişse
    // ajanı yeniden ÇALIŞTIRMADAN (maliyet yok) ve kredi düşmeden mevcut
    // taslağı döndür.
    const existingDraft = await this.virdProgramsService.findAiDraftByFlowId(
      userId.toString(),
      flowId,
    );
    if (existingDraft) {
      log.log('[vird-idempotent] flowId için mevcut taslak dönüyor, kredi yok');
      const credits = await this.aiCreditsService.getCredits(userId.toString());
      return {
        kind: 'program',
        programId: existingDraft._id.toString(),
        program: await this.buildPreview(existingDraft),
        remainingCredits: credits.balance,
      };
    }

    const recentDhikrIds =
      await this.retrievalService.getRecentDhikrIds(userId);

    const outcome = await this.agent.run({
      freeText,
      durationDays: payload.durationDays,
      slots: payload.slots,
      recentDhikrIds,
      locale,
      flowId,
      userId: userId.toString(),
    });

    if (outcome.kind === 'offTopic') {
      log.log(`[vird-off-topic] tespit edildi — ${Date.now() - startedAt}ms`);
      return { kind: 'offTopic', message: OFF_TOPIC_MESSAGE[locale] };
    }

    const draft = await this.virdProgramsService.createAiDraft({
      userId,
      flowId,
      intent: outcome.expandedQuery,
      durationDays: payload.durationDays,
      summary: outcome.summary,
      title: outcome.title,
      phases: this.toProgramPhases(outcome.phases),
      prayerSelection: payload.prayerSelection,
      slots: payload.slots,
    });

    const wallet = await this.aiCreditsService.debitCreditForFlow(
      userId,
      flowId,
      user.isPremium,
      promptHash,
      AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT,
      VIRD_PROGRAM_CREDIT_COST,
    );

    log.log(
      `[vird-done] programId=${draft._id.toString()} — ${Date.now() - startedAt}ms`,
    );

    return {
      kind: 'program',
      programId: draft._id.toString(),
      program: await this.buildPreview(draft),
      remainingCredits: wallet.balance,
    };
  }

  /** Ajanın DhikrLean gömülü outcome fazlarını, şemanın beklediği dhikrId-only şekle çevirir. */
  private toProgramPhases(
    phases: VirdProgramPhaseOutcome[],
  ): VirdProgramPhase[] {
    return phases.map((phase) => {
      const slots: VirdProgramPhaseSlots = {};
      for (const slotKey of VIRD_SLOT_KEYS) {
        const items = phase.slots[slotKey];
        if (!items || items.length === 0) continue;
        slots[slotKey] = items.map((item) => ({
          dhikrId: item.dhikr._id,
          target: item.target,
        }));
      }
      return {
        fromDay: phase.fromDay,
        toDay: phase.toDay,
        note: phase.focus,
        slots,
      };
    });
  }

  /**
   * Kalıcılaştırılmış (persisted) bir AI taslağını mobile önizleme şekline
   * çevirir — hem taze oluşturma hem idempotent retry yolu bunu kullanır, bu
   * yüzden dhikr isimlerini TEKRAR DB'den okur (retrieval.loadDhikrsByIds).
   * `title.tr`/`title.en` createAiDraft tarafından aynı string ile
   * dolduruldu (bkz. o metodun yorumu) — hangisi okunursa okunsun aynıdır.
   */
  private async buildPreview(draft: {
    _id: Types.ObjectId;
    title: { tr: string; en: string };
    dayCount?: number;
    ai?: { summary?: string; durationDays?: number };
    phases: VirdProgramPhase[];
  }): Promise<VirdProgramPreview> {
    const ids = Array.from(
      new Set(
        draft.phases.flatMap((phase) =>
          VIRD_SLOT_KEYS.flatMap((key) =>
            (phase.slots?.[key] ?? [])
              .map((item) => item.dhikrId?.toString())
              .filter((id): id is string => Boolean(id)),
          ),
        ),
      ),
    );
    const dhikrs = await this.retrievalService.loadDhikrsByIds(ids);
    const byId = new Map<string, DhikrLean>(
      dhikrs.map((d) => [d._id.toString(), d]),
    );

    return {
      title: draft.title.tr,
      summary: draft.ai?.summary ?? '',
      durationDays: draft.ai?.durationDays ?? draft.dayCount ?? 0,
      phases: draft.phases.map((phase) => ({
        fromDay: phase.fromDay,
        toDay: phase.toDay,
        note: phase.note,
        slots: this.previewSlots(phase.slots, byId),
      })),
    };
  }

  private previewSlots(
    slots: VirdProgramPhaseSlots | undefined,
    byId: Map<string, DhikrLean>,
  ): Partial<Record<VirdSlotKey, VirdProgramPreviewItem[]>> {
    const result: Partial<Record<VirdSlotKey, VirdProgramPreviewItem[]>> = {};
    for (const slotKey of VIRD_SLOT_KEYS) {
      const items = slots?.[slotKey];
      if (!items || items.length === 0) continue;
      result[slotKey] = items.map((item) => {
        const id = item.dhikrId?.toString() ?? '';
        const dhikr = byId.get(id);
        return {
          dhikrId: id,
          name: dhikr ? dhikr.name.tr : (item.customDhikrId ?? '—'),
          target: item.target,
        };
      });
    }
    return result;
  }

  private async ensureUserExists(userId: Types.ObjectId) {
    const user = await this.userModel.findById(userId).lean().exec();
    if (!user) throw new NotFoundException('Kullanıcı bulunamadı.');
    return user;
  }

  private asObjectId(rawId: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(rawId)) {
      throw new NotFoundException('Geçersiz kullanıcı kimliği.');
    }
    return new Types.ObjectId(rawId);
  }
}
