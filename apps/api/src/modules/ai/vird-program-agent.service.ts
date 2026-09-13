import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { generateText, stepCountIs, tool } from 'ai';
import { Types } from 'mongoose';
import { Dhikr } from '../dhikrs/schemas/dhikr.schema';
import { canonicalKeyFromArabic } from '../dhikrs/utils/canonical-key';
import { VIRD_SLOT_KEYS, type VirdSlotKey } from '../vird/vird.types';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiInvalidOutputError, AiRetrievalError } from './ai-errors';
import { AiRuntimeService } from './ai-runtime.service';
import { AiUsageService } from './ai-usage.service';
import { RecommendationAgentService } from './recommendation-agent.service';
import {
  RetrievalService,
  dedupeByCanonicalKey,
  type DhikrCandidate,
} from './retrieval.service';
import {
  buildProgramInputSchema,
  buildVirdProgramSystemPrompt,
  buildVirdProgramUserPrompt,
  formatVirdCandidateLine,
  searchDhikrsInput,
  type BuildProgramInput,
} from './prompts';
import type { SupportedAiLocale } from './utils/locale';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

export type VirdProgramPhaseOutcome = {
  fromDay: number;
  toDay: number;
  focus?: string;
  slots: Partial<
    Record<VirdSlotKey, Array<{ dhikr: DhikrLean; target: number }>>
  >;
};

export type VirdAgentOutcome =
  | { kind: 'offTopic' }
  | {
      kind: 'program';
      title: string;
      summary: string;
      expandedQuery: string;
      phases: VirdProgramPhaseOutcome[];
    };

export type RunVirdProgramAgentInput = {
  freeText: string;
  durationDays: number;
  slots: VirdSlotKey[];
  recentDhikrIds: string[];
  socketId?: string;
  locale: SupportedAiLocale;
  flowId: string;
  userId: string;
};

// buildProgram tool'unun doğrulanmış (ref → candidate.id çözülmüş, henüz
// DB'den ikinci kapıdan geçmemiş) ara sonucu.
type BuildStepPhase = {
  fromDay: number;
  toDay: number;
  focus?: string;
  slots: Partial<Record<VirdSlotKey, Array<{ id: string; target: number }>>>;
};

type BuildStepResult = {
  title: string;
  summary: string;
  phases: BuildStepPhase[];
};

type ValidationResult =
  | { ok: true; result: BuildStepResult }
  | { ok: false; error: string };

function collectSlotItems<T>(slots: Partial<Record<VirdSlotKey, T[]>>): T[] {
  return VIRD_SLOT_KEYS.flatMap((key) => slots[key] ?? []);
}

/**
 * AI Vird Programı üretim akışının tamamı: niyet genişletme (offTopic tespiti
 * dahil, `RecommendationAgentService.expandIntent`'i yeniden kullanır) →
 * deterministik aday zikir havuzu (genel + dilim bazlı aramalar,
 * canonicalKey dedupe) → araç tabanlı bir LLM inşa (build) döngüsü (gerekirse
 * tek kez yeniden arama, sonra `buildProgram` ile fazlı program). Salt-AI:
 * fallback/cache YOKTUR — model veya retrieval başarısız olursa hata üst
 * katmana (`AiPipelineExceptionFilter`) düz olarak yükselir (bkz.
 * docs/ai-mimari.md §1, §2.5).
 */
@Injectable()
export class VirdProgramAgentService {
  constructor(
    private readonly runtime: AiRuntimeService,
    private readonly retrieval: RetrievalService,
    private readonly usage: AiUsageService,
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
    private readonly recommendationAgent: RecommendationAgentService,
  ) {}

  async run(input: RunVirdProgramAgentInput): Promise<VirdAgentOutcome> {
    const log = this.runtime.flowLog(input.flowId);
    const freeText = input.freeText.trim();

    this.emitStep(input.socketId, 'expand', 'Niyetin derinleştiriliyor...');
    const expansion = await this.recommendationAgent.expandIntent({
      freeText,
      timeOfDay: this.currentTimeOfDay(),
      locale: input.locale,
      flowId: input.flowId,
      userId: input.userId,
    });

    if (expansion.offTopic) {
      log.log('[expand] off-topic tespit edildi');
      return { kind: 'offTopic' };
    }
    const expandedQuery = expansion.expandedQuery;
    log.log(
      `[expand] "${freeText.slice(0, 40)}" → "${expandedQuery.slice(0, 80)}"`,
    );

    this.emitStep(input.socketId, 'retrieve', 'Zikirler taranıyor...');
    const initialCandidates = await this.gatherCandidates({
      expandedQuery,
      slots: input.slots,
      locale: input.locale,
      flowId: input.flowId,
      userId: input.userId,
    });

    if (initialCandidates.length === 0) {
      throw new AiRetrievalError('retrieval_failed', 'Aday zikir bulunamadı');
    }

    const recentIds = new Set(input.recentDhikrIds);
    const markedCandidates = initialCandidates.map((candidate) =>
      recentIds.has(candidate.id)
        ? { ...candidate, recentlyPracticed: true }
        : candidate,
    );

    this.emitStep(input.socketId, 'build', 'Program oluşturuluyor...');
    const built = await this.runtime.withAiRetry(
      'program',
      () =>
        this.runBuildStep({
          initialCandidates: markedCandidates,
          input,
          freeText,
          expandedQuery,
        }),
      { flowId: input.flowId },
    );

    // İkinci kapı: referans verilen TÜM dhikrId'leri DB'den gerçekten
    // doğrula (isVerified && isActive) — recommendation-agent.service.ts'teki
    // loadDhikrsByIds ikinci kapısıyla aynı savunma deseni. Doğrulanamayan
    // bir id'nin bulunduğu satır sessizce düşer (byId.get → undefined);
    // TÜM program boş kalırsa AiInvalidOutputError.
    const allIds = Array.from(
      new Set(
        built.phases.flatMap((phase) =>
          collectSlotItems(phase.slots).map((item) => item.id),
        ),
      ),
    );
    const loaded = await this.retrieval.loadDhikrsByIds(allIds);
    const byId = new Map(loaded.map((d) => [d._id.toString(), d]));

    const phases: VirdProgramPhaseOutcome[] = built.phases.map((phase) => {
      const slots: VirdProgramPhaseOutcome['slots'] = {};
      for (const slotKey of VIRD_SLOT_KEYS) {
        const items = phase.slots[slotKey];
        if (!items || items.length === 0) continue;
        const resolved = items
          .map((item) => {
            const dhikr = byId.get(item.id);
            return dhikr ? { dhikr, target: item.target } : null;
          })
          .filter(
            (entry): entry is { dhikr: DhikrLean; target: number } =>
              entry !== null,
          );
        if (resolved.length > 0) {
          slots[slotKey] = resolved;
        }
      }
      return {
        fromDay: phase.fromDay,
        toDay: phase.toDay,
        focus: phase.focus,
        slots,
      };
    });

    const totalItems = phases.reduce(
      (sum, phase) => sum + collectSlotItems(phase.slots).length,
      0,
    );
    if (totalItems === 0) {
      throw new AiInvalidOutputError(
        'Seçilen zikirler veritabanında doğrulanamadı',
      );
    }

    return {
      kind: 'program',
      title: built.title,
      summary: built.summary,
      expandedQuery,
      phases,
    };
  }

  /**
   * Genel (expandedQuery bazlı) havuz + her istenen dilim için hedefli bir
   * arama (morning/evening/night → timeOfDay araması; prayer → "namaz
   * sonrası" metin araması; free → ek arama YOK, genel havuz yeterli kabul
   * edilir) birleştirilip canonicalKey ile dedupe edilir.
   */
  private async gatherCandidates(ctx: {
    expandedQuery: string;
    slots: VirdSlotKey[];
    locale: SupportedAiLocale;
    flowId: string;
    userId: string;
  }): Promise<DhikrCandidate[]> {
    const { vector: queryVector } = await this.retrieval.embedQuery(
      ctx.expandedQuery,
      { flowId: ctx.flowId, userId: ctx.userId },
    );

    const generalCandidates = await this.retrieval.searchDhikrsByText({
      query: ctx.expandedQuery,
      limit: 15,
      excludeIds: [],
      locale: ctx.locale,
      flowId: ctx.flowId,
      userId: ctx.userId,
      queryVector,
    });

    const slotCandidateLists = await Promise.all(
      ctx.slots.map((slot) => this.gatherSlotCandidates(slot, ctx)),
    );

    const combined = [generalCandidates, ...slotCandidateLists].flat();
    const { debug } = this.runtime.flowLog(ctx.flowId);

    // DhikrCandidate'ta ham `canonicalKey` alanı yok (yalnız `nameArabic`) —
    // resolveCanonicalKey'in fallback dalıyla aynı türetme burada tekrarlanır
    // (bkz. dedupeByCanonicalKey'in retrieval.service.ts'teki export yorumu).
    return dedupeByCanonicalKey(
      combined,
      (candidate) =>
        candidate.nameArabic
          ? canonicalKeyFromArabic(candidate.nameArabic)
          : undefined,
      debug,
      'vird-program-agent(pool)',
    );
  }

  private async gatherSlotCandidates(
    slot: VirdSlotKey,
    ctx: { locale: SupportedAiLocale; flowId: string; userId: string },
  ): Promise<DhikrCandidate[]> {
    if (slot === 'morning' || slot === 'evening' || slot === 'night') {
      return this.retrieval.searchDhikrsByTimeOfDay({
        timeOfDay: slot,
        limit: 6,
        excludeIds: [],
        locale: ctx.locale,
      });
    }
    if (slot === 'prayer') {
      return this.retrieval.searchDhikrsByText({
        query: 'namaz sonrası',
        limit: 6,
        excludeIds: [],
        locale: ctx.locale,
        flowId: ctx.flowId,
        userId: ctx.userId,
      });
    }
    // 'free': dilime özgü ek bir arama yapılmaz — genel (expandedQuery)
    // havuzu serbest dilim için yeterli çeşitliliği zaten sağlar.
    return [];
  }

  /**
   * Tek bir inşa (build) turu: LLM'e aday listesi + araçlar (searchDhikrs,
   * buildProgram) verilir. `withAiRetry` bu fonksiyonu (attempt başına)
   * yeniden çağırabileceği için tüm mutable durum (refMap, searchUsed,
   * outcome) fonksiyon gövdesinde — her denemede sıfırdan — oluşturulur.
   */
  private async runBuildStep(ctx: {
    initialCandidates: DhikrCandidate[];
    input: RunVirdProgramAgentInput;
    freeText: string;
    expandedQuery: string;
  }): Promise<BuildStepResult> {
    const { initialCandidates, input, freeText, expandedQuery } = ctx;
    const log = this.runtime.flowLog(input.flowId);

    const refMap = new Map<string, DhikrCandidate>();
    let refCounter = 0;

    const assignRefs = (
      list: DhikrCandidate[],
    ): Array<DhikrCandidate & { ref: string }> =>
      list.map((candidate) => {
        refCounter += 1;
        const ref = `C${refCounter}`;
        refMap.set(ref, candidate);
        return { ...candidate, ref };
      });

    const initialLines = assignRefs(initialCandidates);
    const maxItemsPerSlot = this.readIntEnv('AI_VIRD_MAX_ITEMS_PER_SLOT', 4);
    const requestedSlots = new Set<VirdSlotKey>(input.slots);

    let searchUsed = false;
    let outcome: BuildStepResult | null = null;

    const tools = {
      searchDhikrs: tool({
        description:
          'Aday listesi niyete/dilimlere yetmediğinde YENİDEN YAZILMIŞ Türkçe bir sorguyla yeni zikir adayları arar. En fazla bir kez çağrılabilir.',
        inputSchema: searchDhikrsInput,
        execute: async ({ query }: { query: string; why: string }) => {
          searchUsed = true;
          const excludeIds = [
            ...input.recentDhikrIds,
            ...Array.from(refMap.values()).map((c) => c.id),
          ];
          const newCandidates = await this.retrieval.searchDhikrsByText({
            query,
            limit: 10,
            excludeIds,
            locale: input.locale,
            flowId: input.flowId,
            userId: input.userId,
          });

          if (newCandidates.length === 0) {
            return { candidates: [], note: 'yeni aday bulunamadı' };
          }

          const lines = assignRefs(newCandidates);
          return {
            candidates: lines.map((line) => formatVirdCandidateLine(line)),
          };
        },
      }),
      buildProgram: tool({
        description:
          'Tasarlanan vird programını (başlık, özet, fazlar ve dilim başına zikirler) raporla. Görev bu araçla tamamlanır.',
        inputSchema: buildProgramInputSchema,
        execute: (parsed: BuildProgramInput) => {
          const validation = this.validateBuiltProgram(parsed, {
            durationDays: input.durationDays,
            requestedSlots,
            refMap,
            maxItemsPerSlot,
          });

          if (!validation.ok) {
            log.warn(`[buildProgram] doğrulama hatası: ${validation.error}`);
            return { ok: false, error: validation.error };
          }

          outcome = validation.result;
          return { ok: true, phases: validation.result.phases.length };
        },
      }),
    };

    const genResult = await generateText({
      model: this.runtime.model('program'),
      ...this.runtime.settings('program'),
      system: buildVirdProgramSystemPrompt({
        locale: input.locale,
        durationDays: input.durationDays,
        slots: input.slots,
        maxItemsPerSlot,
      }),
      prompt: buildVirdProgramUserPrompt({
        freeText,
        expandedQuery,
        durationDays: input.durationDays,
        slots: input.slots,
        candidates: initialLines,
      }),
      tools,
      stopWhen: [stepCountIs(3), () => outcome !== null],
      prepareStep: () =>
        searchUsed
          ? {
              activeTools: ['buildProgram'],
              toolChoice: 'required' as const,
            }
          : {
              activeTools: ['searchDhikrs', 'buildProgram'],
              toolChoice: 'required' as const,
            },
      onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
        const names = toolCalls?.map((t) => t.toolName).join(', ') || '-';
        log.debug(
          `[program step ${stepNumber}] tools=[${names}] finish=${finishReason}`,
        );
      },
    });

    void this.usage.record({
      kind: 'program',
      model: this.runtime.modelName('program'),
      usage: genResult.totalUsage,
      steps: genResult.steps?.length,
      flowId: input.flowId,
      userId: input.userId,
    });

    if (!outcome) {
      throw new AiInvalidOutputError('Model geçerli bir program üretmedi');
    }

    return outcome;
  }

  /**
   * `buildProgram` doğrulama kapıları: (1) ref'ler refMap'te, (2) fazlar
   * 1..durationDays'i boşluksuz ve çakışmasız kaplar, (3) yalnız istenen
   * dilimler kullanılmış, (4) dilim başına ≤ maxItemsPerSlot, (5) target
   * 1..1000 ve aday satırındaki recommendedCount'u (varsa) aşmıyor. İlk
   * ihlalde `{ok:false, error}` döner — model bunu görüp tekrar dener
   * (stopWhen henüz `outcome !== null` olmadığı için akış devam eder).
   */
  private validateBuiltProgram(
    parsed: BuildProgramInput,
    ctx: {
      durationDays: number;
      requestedSlots: Set<VirdSlotKey>;
      refMap: Map<string, DhikrCandidate>;
      maxItemsPerSlot: number;
    },
  ): ValidationResult {
    if (parsed.phases.length === 0) {
      return { ok: false, error: 'En az bir faz gereklidir.' };
    }

    const sortedPhases = [...parsed.phases].sort(
      (a, b) => a.fromDay - b.fromDay,
    );

    let expectedFromDay = 1;
    for (const phase of sortedPhases) {
      if (phase.fromDay !== expectedFromDay) {
        return {
          ok: false,
          error: `Fazlar 1..${ctx.durationDays} aralığını boşluksuz ve çakışmasız kaplamalı — beklenen fromDay=${expectedFromDay}, gelen=${phase.fromDay}.`,
        };
      }
      if (phase.toDay < phase.fromDay) {
        return {
          ok: false,
          error: `Faz toDay (${phase.toDay}), fromDay'den (${phase.fromDay}) küçük olamaz.`,
        };
      }
      expectedFromDay = phase.toDay + 1;
    }

    const lastPhase = sortedPhases[sortedPhases.length - 1];
    if (lastPhase.toDay !== ctx.durationDays) {
      return {
        ok: false,
        error: `Son fazın toDay'i ${ctx.durationDays} olmalı, gelen=${lastPhase.toDay}.`,
      };
    }

    const resultPhases: BuildStepPhase[] = [];

    for (const phase of sortedPhases) {
      const slotEntries = Object.entries(phase.slots) as Array<
        [VirdSlotKey, Array<{ ref: string; target: number }> | undefined]
      >;
      const resultSlots: BuildStepPhase['slots'] = {};

      for (const [slotKey, items] of slotEntries) {
        if (!items || items.length === 0) continue;

        if (!ctx.requestedSlots.has(slotKey)) {
          return {
            ok: false,
            error: `İstenmeyen dilim kullanıldı: '${slotKey}'. Yalnızca şu dilimler kullanılabilir: ${Array.from(ctx.requestedSlots).join(', ')}.`,
          };
        }

        if (items.length > ctx.maxItemsPerSlot) {
          return {
            ok: false,
            error: `'${slotKey}' diliminde en fazla ${ctx.maxItemsPerSlot} zikir olabilir, gelen=${items.length}.`,
          };
        }

        const resolvedItems: Array<{ id: string; target: number }> = [];
        for (const item of items) {
          const candidate = ctx.refMap.get(item.ref);
          if (!candidate) {
            return {
              ok: false,
              error: `Bilinmeyen referans: '${item.ref}'. Yalnızca aday listesindeki C# referanslarını kullan.`,
            };
          }
          if (
            !Number.isFinite(item.target) ||
            item.target < 1 ||
            item.target > 1000
          ) {
            return {
              ok: false,
              error: `Geçersiz target (${item.target}) — ref=${item.ref} — 1..1000 aralığında olmalı.`,
            };
          }
          if (
            typeof candidate.recommendedCount === 'number' &&
            item.target > candidate.recommendedCount
          ) {
            return {
              ok: false,
              error: `target (${item.target}), '${item.ref}' için aday satırındaki tekrar hedefini (${candidate.recommendedCount}) aşıyor.`,
            };
          }
          resolvedItems.push({
            id: candidate.id,
            target: Math.round(item.target),
          });
        }

        resultSlots[slotKey] = resolvedItems;
      }

      resultPhases.push({
        fromDay: phase.fromDay,
        toDay: phase.toDay,
        focus: phase.focus,
        slots: resultSlots,
      });
    }

    return {
      ok: true,
      result: {
        title: parsed.title,
        summary: parsed.summary,
        phases: resultPhases,
      },
    };
  }

  private emitStep(socketId: string | undefined, key: string, message: string) {
    if (socketId) {
      this.progressGateway.emitStep(socketId, key, message);
    }
  }

  private readIntEnv(key: string, fallback: number): number {
    const raw = Number(this.configService.get<string | number>(key));
    return Number.isInteger(raw) && raw > 0 ? raw : fallback;
  }

  /**
   * expandIntent yalnızca "kullanıcı zaman belirtmediyse bunu expandedQuery'ye
   * katma" bilgisi için bir timeOfDay ipucu bekler — AI Vird Programı çok
   * günlük bir plan olduğundan tek bir "şu an"a bağlı değildir, ama aynı
   * imzayı paylaşan expandIntent bir değer bekler. AiService.resolveTimeOfDay
   * ile BİREBİR aynı saat dilimlendirmesi burada da (bağımsızca) tekrarlanır
   * — agent'lar arasında gereksiz bir DI bağı kurmamak için (eval'daki
   * deriveTimeOfDay ile aynı, kabul edilmiş duplikasyon deseni).
   */
  private currentTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'morning';
    if (hour >= 12 && hour < 17) return 'afternoon';
    if (hour >= 17 && hour < 21) return 'evening';
    return 'night';
  }
}
