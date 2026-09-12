import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import { generateObject, generateText, stepCountIs, tool } from 'ai';
import { Dhikr } from '../dhikrs/schemas/dhikr.schema';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiInvalidOutputError, AiRetrievalError } from './ai-errors';
import { AiRuntimeService } from './ai-runtime.service';
import { AiUsageService } from './ai-usage.service';
import {
  RetrievalService,
  type DhikrCandidate,
  type SourcePassageResult,
} from './retrieval.service';
import {
  askClarificationInput,
  buildRecommendationSystemPrompt,
  buildRecommendationUserPrompt,
  expandIntentSchema,
  EXPAND_INTENT_SYSTEM_PROMPT,
  formatCandidateLine,
  searchDhikrsInput,
  selectRecommendationsInput,
} from './prompts';
import type { SupportedAiLocale } from './utils/locale';

type DhikrLean = Dhikr & { _id: Types.ObjectId };

export type AgentOutcome =
  | { kind: 'offTopic' }
  | { kind: 'clarification'; question: string }
  | {
      kind: 'selected';
      summary: string;
      items: Array<{ dhikr: DhikrLean; reason: string }>;
      sources: SourcePassageResult[];
    };

export type RunRecommendationAgentInput = {
  freeText?: string;
  // 'morning' | 'evening' | 'night' değerleri beklenir; ai.service.ts'in
  // resolveTimeOfDay() dönüşü de bu kümedendir. Tip düzeyinde `string` olarak
  // tutulur — literal union `string`'e eklendiğinde eslint tarafından
  // fazlalık (redundant) sayılır ve runtime'da ekstra bir garanti sağlamaz.
  timeOfDay: string;
  recentDhikrIds: string[];
  maxRecommendations: number;
  socketId?: string;
  locale: SupportedAiLocale;
  flowId: string;
  userId: string;
};

// Seçim/araştırma adımının iç sonucu — dış AgentOutcome'a çevrilmeden önceki
// ham hâl (henüz `id → DhikrLean` doğrulaması yapılmamış, refMap referansları
// zikir id'sine indirgenmiş durumda).
type SelectionStepResult =
  | {
      kind: 'selected';
      summary: string;
      items: Array<{ id: string; reason: string }>;
    }
  | { kind: 'clarification'; question: string };

/**
 * AI Rehber öneri akışının tamamı: niyet genişletme + off-topic tespiti →
 * deterministik aday çekme (Atlas $vectorSearch) → araç tabanlı (tool-based)
 * bir LLM seçim döngüsü (gerekirse tek kez yeniden arama, gerekirse tek bir
 * netleştirme sorusu). Fallback/cache/kategori dalı YOKTUR — model başarısız
 * olursa hata üst katmana (`AiPipelineExceptionFilter`) düz olarak yükselir.
 */
@Injectable()
export class RecommendationAgentService {
  constructor(
    private readonly runtime: AiRuntimeService,
    private readonly retrieval: RetrievalService,
    private readonly usage: AiUsageService,
    private readonly progressGateway: AiProgressGateway,
    private readonly configService: ConfigService,
  ) {}

  async run(input: RunRecommendationAgentInput): Promise<AgentOutcome> {
    const log = this.runtime.flowLog(input.flowId);

    let searchQuery: string | undefined;
    const trimmedFreeText = input.freeText?.trim();

    if (trimmedFreeText) {
      this.emitStep(
        input.socketId,
        'expanding',
        'Niyetin derinleştiriliyor...',
      );
      const expansion = await this.expandIntent({
        freeText: trimmedFreeText,
        timeOfDay: input.timeOfDay,
        locale: input.locale,
        flowId: input.flowId,
        userId: input.userId,
      });

      if (expansion.offTopic) {
        log.log('[expand] off-topic tespit edildi');
        return { kind: 'offTopic' };
      }
      searchQuery = expansion.expandedQuery;
      log.log(
        `[expand] "${trimmedFreeText.slice(0, 40)}" → "${searchQuery.slice(0, 80)}"`,
      );
    }

    const ragPassageLimit = this.readIntEnv('AI_RAG_PASSAGE_LIMIT', 4);
    const candidateLimit = Math.min(
      this.readIntEnv('AI_CANDIDATE_LIMIT', 15),
      20,
    );

    const sources = searchQuery
      ? await this.retrieval.searchSourcePassages(
          searchQuery,
          ragPassageLimit,
          {
            flowId: input.flowId,
            userId: input.userId,
          },
        )
      : [];

    this.emitStep(input.socketId, 'searching', 'Zikirler taranıyor...');
    const initialCandidates = searchQuery
      ? await this.retrieval.searchDhikrsByText({
          query: searchQuery,
          limit: candidateLimit,
          excludeIds: input.recentDhikrIds,
          locale: input.locale,
          flowId: input.flowId,
          userId: input.userId,
        })
      : await this.retrieval.searchDhikrsByTimeOfDay({
          timeOfDay: input.timeOfDay,
          limit: candidateLimit,
          excludeIds: input.recentDhikrIds,
          locale: input.locale,
        });

    if (initialCandidates.length === 0) {
      throw new AiRetrievalError('retrieval_failed', 'Aday zikir bulunamadı');
    }

    const selection = await this.runtime.withAiRetry(
      'select',
      () =>
        this.runSelectionStep({
          initialCandidates,
          sources,
          input,
        }),
      { flowId: input.flowId },
    );

    if (selection.kind === 'clarification') {
      return { kind: 'clarification', question: selection.question };
    }

    const ids = selection.items.map((item) => item.id);
    const loaded = await this.retrieval.loadDhikrsByIds(ids);
    const byId = new Map(loaded.map((d) => [d._id.toString(), d]));

    const items = selection.items
      .map((item) => {
        const dhikr = byId.get(item.id);
        return dhikr ? { dhikr, reason: item.reason } : null;
      })
      .filter((item): item is { dhikr: DhikrLean; reason: string } =>
        Boolean(item),
      );

    if (items.length === 0) {
      throw new AiInvalidOutputError(
        'Seçilen zikirler veritabanında doğrulanamadı',
      );
    }

    return { kind: 'selected', summary: selection.summary, items, sources };
  }

  /**
   * Kullanıcının kısa/örtük ifadesini anlamsal aramaya elverişli bir niyet
   * cümlesine açar ve aynı turda off-topic tespitini yapar. expandedQuery
   * her zaman Türkçe döner (bkz. prompts.ts) — arama korpusu Türkçedir.
   */
  private async expandIntent(input: {
    freeText: string;
    timeOfDay: string;
    locale: SupportedAiLocale;
    flowId: string;
    userId: string;
  }): Promise<{ offTopic: boolean; expandedQuery: string }> {
    const result = await this.runtime.withAiRetry(
      'expand',
      () =>
        generateObject({
          model: this.runtime.model('expand'),
          ...this.runtime.settings('expand'),
          schema: expandIntentSchema,
          system: EXPAND_INTENT_SYSTEM_PROMPT(input.timeOfDay),
          prompt: `Kullanıcı metni: ${input.freeText}\n\nLocale: ${input.locale}`,
        }),
      { flowId: input.flowId },
    );

    void this.usage.record({
      kind: 'expand',
      model: this.runtime.modelName('expand'),
      usage: result.usage,
      flowId: input.flowId,
      userId: input.userId,
    });

    const expanded = result.object.expandedQuery?.trim();
    return {
      offTopic: result.object.offTopic,
      expandedQuery: expanded || input.freeText,
    };
  }

  /**
   * Tek bir seçim/araştırma turu: LLM'e aday listesi + araçlar (searchDhikrs,
   * selectRecommendations, askClarification) verilir. `withAiRetry` bu
   * fonksiyonu (attempt başına) yeniden çağırabileceği için tüm mutable
   * durum (refMap, searchUsed, outcome) fonksiyon gövdesinde — yani her
   * denemede sıfırdan — oluşturulur.
   */
  private async runSelectionStep(ctx: {
    initialCandidates: DhikrCandidate[];
    sources: SourcePassageResult[];
    input: RunRecommendationAgentInput;
  }): Promise<SelectionStepResult> {
    const { initialCandidates, sources, input } = ctx;
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

    let searchUsed = false;
    let outcome: SelectionStepResult | null = null;

    const tools = {
      searchDhikrs: tool({
        description:
          'Aday listesi niyete uymadığında YENİDEN YAZILMIŞ Türkçe bir sorguyla yeni zikir adayları arar. En fazla bir kez çağrılabilir.',
        inputSchema: searchDhikrsInput,
        execute: async ({ query }: { query: string; why: string }) => {
          searchUsed = true;
          this.emitStep(
            input.socketId,
            'researching',
            'Farklı zikirler aranıyor...',
          );
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
            candidates: lines.map((line) => formatCandidateLine(line)),
          };
        },
      }),
      selectRecommendations: tool({
        description:
          'Seçilen zikirleri (aday listesindeki C# referanslarıyla) ve gerekçelerini raporla. Görev bu araçla tamamlanır.',
        inputSchema: selectRecommendationsInput,
        execute: ({
          summary,
          items,
        }: {
          summary: string;
          items: Array<{ ref: string; reason: string }>;
        }) => {
          this.emitStep(
            input.socketId,
            'selecting',
            'Sana en uygun zikirler seçiliyor...',
          );

          const seenRefs = new Set<string>();
          const rejected: string[] = [];
          const accepted: Array<{ id: string; reason: string }> = [];

          for (const item of items) {
            if (accepted.length >= input.maxRecommendations) break;
            const candidate = refMap.get(item.ref);
            if (!candidate || seenRefs.has(item.ref)) {
              rejected.push(item.ref);
              continue;
            }
            seenRefs.add(item.ref);
            accepted.push({ id: candidate.id, reason: item.reason });
          }

          if (rejected.length > 0) {
            log.warn(
              `[selectRecommendations] geçersiz/tekrarlı ref'ler reddedildi: ${rejected.join(', ')}`,
            );
          }

          if (accepted.length === 0) {
            return {
              ok: false,
              error: 'Yalnızca aday listesindeki C# referanslarını kullan.',
            };
          }

          outcome = { kind: 'selected', summary, items: accepted };
          return { ok: true, accepted: accepted.length };
        },
      }),
      askClarification: tool({
        description:
          'searchDhikrs sonrası da hiçbir aday niyete uymuyorsa kullanıcıya tek, kısa, sıcak bir netleştirme sorusu sorar.',
        inputSchema: askClarificationInput,
        execute: ({ question }: { question: string }) => {
          const sanitized = (question ?? '')
            .trim()
            .replace(/\s+/g, ' ')
            .slice(0, 240);

          if (!sanitized) {
            return { ok: false, error: 'Soru boş olamaz' };
          }

          outcome = { kind: 'clarification', question: sanitized };
          return { ok: true };
        },
      }),
    };

    const genResult = await generateText({
      model: this.runtime.model('select'),
      ...this.runtime.settings('select'),
      system: buildRecommendationSystemPrompt({
        locale: input.locale,
        maxRecommendations: input.maxRecommendations,
        sources,
      }),
      prompt: buildRecommendationUserPrompt({
        freeText: input.freeText,
        timeOfDay: input.timeOfDay,
        candidates: initialLines,
      }),
      tools,
      stopWhen: [stepCountIs(3), () => outcome !== null],
      prepareStep: () =>
        searchUsed
          ? {
              activeTools: ['selectRecommendations', 'askClarification'],
              toolChoice: 'required' as const,
            }
          : {
              activeTools: ['searchDhikrs', 'selectRecommendations'],
              toolChoice: 'required' as const,
            },
      onStepFinish: ({ stepNumber, toolCalls, finishReason }) => {
        const names = toolCalls?.map((t) => t.toolName).join(', ') || '-';
        log.debug(
          `[select step ${stepNumber}] tools=[${names}] finish=${finishReason}`,
        );
      },
    });

    void this.usage.record({
      kind: 'recommend',
      model: this.runtime.modelName('select'),
      usage: genResult.totalUsage,
      steps: genResult.steps?.length,
      flowId: input.flowId,
      userId: input.userId,
    });

    if (!outcome) {
      throw new AiInvalidOutputError('Model geçerli bir seçim yapmadı');
    }

    return outcome;
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
}
