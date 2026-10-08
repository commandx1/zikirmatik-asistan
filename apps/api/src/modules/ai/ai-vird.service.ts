import { randomUUID } from 'node:crypto';
import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
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

    const access = await this.aiCreditsService.ensureCreditAccessForFlow(
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
      // Taslak yazıldı ama makbuz yazılamadan çökülmüşse makbuzu tamamla.
      if (access?.alreadyDebited && !access.fulfilled) {
        await this.markDraftDelivered(userId, flowId, existingDraft._id);
      }
      const credits = await this.aiCreditsService.getCredits(userId.toString());
      return {
        kind: 'program',
        programId: existingDraft._id.toString(),
        program: await this.buildPreview(existingDraft, locale),
        remainingCredits: credits.balance,
      };
    }

    // Kayıtlı sonucun tekrarı yukarıda döndü; gerçek koşu tek AI kirası ve
    // günlük kredisiz koşu sınırı altında (runGuarded).
    return this.aiCreditsService.runGuarded<CreateVirdProgramResult>(
      userId,
      async (markCharged) => {
        const reason = AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT;
        // AIV-06: makbuzlu debit'in taslağı sonradan kaybolduysa (silindi /
        // vazgeçildi / TTL) flowId yeniden kullanılamaz. Makbuzsuz debit (debit
        // ile taslak arasında ölen süreç ya da a801253 öncesi eski satır) bir
        // kurtarma koşusu hak eder: atomik talep edilir, eşzamanlı talep 409.
        // Başarısız kurtarma iade ETMEZ, talebi bırakır (bkz. settleUndelivered).
        let recoveryClaim: Date | null = null;
        if (access?.alreadyDebited) {
          recoveryClaim = access.fulfilled
            ? null
            : await this.aiCreditsService.claimFlowRecovery(
                userId,
                flowId,
                reason,
              );
          if (!recoveryClaim) {
            throw new ConflictException({
              code: 'AI_FLOW_ALREADY_USED',
              message: 'Bu istek daha önce kullanıldı. Yeni bir istek başlat.',
            });
          }
        }

        // Yalnız bu isteğin YAZDIĞI debit iade edilir; kurtarılan ya da eşzamanlı
        // kopyanın (AIV-15) debit'i edilmez.
        let ownsDebit = false;
        let deliveryToken: string | undefined;
        let draft: Awaited<ReturnType<VirdProgramsService['createAiDraft']>>;
        let wallet: { balance: number };
        try {
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
            log.log(
              `[vird-off-topic] tespit edildi — ${Date.now() - startedAt}ms`,
            );
            await this.settleUndelivered(userId, flowId, {
              ownsDebit,
              recoveryClaim,
            });
            return { kind: 'offTopic', message: OFF_TOPIC_MESSAGE[locale] };
          }

          // B9: önce kredi düşülür, sonra taslak yazılır.
          const debit = await this.aiCreditsService.debitCreditForFlow(
            userId,
            flowId,
            user.isPremium,
            promptHash,
            reason,
            VIRD_PROGRAM_CREDIT_COST,
          );
          ownsDebit = debit.created;
          wallet = debit;

          // Teslim rezervasyonu: eşzamanlı bir iade bu debit'i artık silemez;
          // iade önce davrandıysa (debit yok) taslak yazılmaz.
          const token = randomUUID();
          if (
            !(await this.aiCreditsService.reserveFlowDelivery(
              userId,
              flowId,
              reason,
              token,
            ))
          ) {
            throw new ConflictException({
              code: 'AI_FLOW_IN_PROGRESS',
              message: 'Bu istek başka bir denemede işlendi. Tekrar dene.',
            });
          }
          deliveryToken = token;

          draft = await this.virdProgramsService.createAiDraft({
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
        } catch (error) {
          // Teslim edilemeyen kesim iade edilir; asıl hata yine yüzeye çıkar.
          await this.settleUndelivered(userId, flowId, {
            ownsDebit,
            recoveryClaim,
            deliveryToken,
          });
          throw error;
        }
        // Makbuz yazılamazsa iade YOK: taslak var, sonraki retry makbuzu tamamlar.
        await this.markDraftDelivered(userId, flowId, draft._id);
        markCharged();

        log.log(
          `[vird-done] programId=${draft._id.toString()} — ${Date.now() - startedAt}ms`,
        );

        return {
          kind: 'program',
          programId: draft._id.toString(),
          program: await this.buildPreview(draft, locale),
          remainingCredits: wallet.balance,
        };
      },
    );
  }

  /**
   * Teslim edilemeyen koşuyu kapatır: kendi teslim rezervasyonunu bırakır;
   * taslak yine de yazılmışsa (yazım fırlattı ama kayıt düştü / kopya yazdı)
   * makbuzu tamamlar. Yoksa bu isteğin yazdığı debit'i iade eder, kurtarma
   * koşusunun talebini ise yalnız bırakır (satır teslim edilmiş olabilir —
   * iade kredi basardı). Telafi hatası asıl hatayı gölgelemez.
   */
  private async settleUndelivered(
    userId: Types.ObjectId,
    flowId: string,
    run: {
      ownsDebit: boolean;
      recoveryClaim: Date | null;
      deliveryToken?: string;
    },
  ) {
    const reason = AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT;
    try {
      if (run.deliveryToken) {
        await this.aiCreditsService.releaseFlowDelivery(
          userId,
          flowId,
          reason,
          run.deliveryToken,
        );
      }
      if (!run.ownsDebit && !run.recoveryClaim) return;
      const draft = await this.virdProgramsService.findAiDraftByFlowId(
        userId.toString(),
        flowId,
      );
      if (draft) {
        await this.markDraftDelivered(userId, flowId, draft._id);
      } else if (run.ownsDebit) {
        await this.aiCreditsService.refundFlowDebit(userId, flowId, reason);
      } else if (run.recoveryClaim) {
        await this.aiCreditsService.releaseFlowRecovery(
          userId,
          flowId,
          reason,
          run.recoveryClaim,
        );
      }
    } catch (error) {
      this.runtime
        .flowLog(flowId)
        .error(`[vird-settle-failed] ${String(error)}`);
    }
  }

  private markDraftDelivered(
    userId: Types.ObjectId,
    flowId: string,
    draftId: Types.ObjectId,
  ) {
    return this.aiCreditsService.markFlowFulfilled(
      userId,
      flowId,
      AI_CREDIT_REASONS.VIRD_PROGRAM_DEBIT,
      draftId.toString(),
    );
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
  private async buildPreview(
    draft: {
      _id: Types.ObjectId;
      title: { tr: string; en: string };
      dayCount?: number;
      ai?: { summary?: string; durationDays?: number };
      phases: VirdProgramPhase[];
    },
    locale: SupportedAiLocale,
  ): Promise<VirdProgramPreview> {
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
        slots: this.previewSlots(phase.slots, byId, locale),
      })),
    };
  }

  private previewSlots(
    slots: VirdProgramPhaseSlots | undefined,
    byId: Map<string, DhikrLean>,
    locale: SupportedAiLocale,
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
          // Önizleme adı istemcinin diline göre; en boşsa tr'ye düşer.
          name: dhikr
            ? dhikr.name[locale] || dhikr.name.tr
            : (item.customDhikrId ?? '—'),
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
