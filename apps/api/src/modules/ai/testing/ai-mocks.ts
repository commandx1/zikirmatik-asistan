/**
 * e2e + k6 yük testi için AI mock katmanı. `AI_RUNTIME_MOCK=1` iken
 * ai.module / embedding.module gerçek servislerin yerine bunları bağlar
 * (useClass). Gerçek `generateText`/`streamText` tool döngüsü, `withAiRetry`,
 * kredi akışı ve 503 filtresi değişmeden çalışır — yalnız sağlayıcı
 * (LLM, embedding, Atlas $vectorSearch) sınırı sahtedir.
 */
import { createHash } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { APICallError } from 'ai';
import { MockLanguageModelV3, simulateReadableStream } from 'ai/test';
import type {
  LanguageModelV3CallOptions,
  LanguageModelV3Content,
  LanguageModelV3GenerateResult,
  LanguageModelV3StreamPart,
} from '@ai-sdk/provider';
import { EmbeddingService } from '../../embedding/embedding.service';
import { AiRuntimeService, type AiModelKind } from '../ai-runtime.service';
import {
  RetrievalService,
  toDhikrCandidate,
  type DhikrCandidate,
  type SourcePassageResult,
} from '../retrieval.service';
import type { SupportedAiLocale } from '../utils/locale';

export type MockAiMode =
  | 'success'
  | 'error503'
  | 'timeout'
  | 'toolLoop'
  | 'noOutcome'
  | 'clarify';

function assertNotProduction(): true {
  if (process.env.NODE_ENV === 'production') {
    throw new Error("AI mock prod'da açılamaz");
  }
  return true;
}

const USAGE = {
  inputTokens: { total: 10, noCache: 10, cacheRead: 0, cacheWrite: 0 },
  outputTokens: { total: 5, text: 5, reasoning: 0 },
};

// text-embedding-3-large varsayılan boyutu (dimensions parametresi verilmiyor).
export const MOCK_EMBEDDING_DIMENSIONS = 3072;

/**
 * `model(kind)` MockLanguageModelV3 döner. Mod'a göre davranış:
 * - success   : select → 1. adımda selectRecommendations(C1..C3)
 * - toolLoop  : select → searchDhikrs, sonra selectRecommendations
 * - clarify   : select → searchDhikrs, sonra askClarification
 * - noOutcome : select → her adımda geçersiz ref → outcome yok → invalid_output
 * - error503  : her çağrı non-retryable APICallError(400) → provider_error
 * - timeout   : her çağrı TimeoutError → timeout (withAiRetry 2 dener)
 * expand/classify/chat JSON veya düz metin üretir (responseFormat'a göre).
 */
@Injectable()
export class MockAiRuntimeService extends AiRuntimeService {
  readonly prodGuard = assertNotProduction();
  mode: MockAiMode = 'success';
  /** doGenerate/doStream çağrılarının kind listesi; `calls.length` = sayaç. */
  calls: AiModelKind[] = [];

  setMode(mode: MockAiMode) {
    this.mode = mode;
  }

  reset() {
    this.mode = 'success';
    this.calls = [];
  }

  isConfigured(): boolean {
    return true;
  }

  provider(): never {
    throw new Error(
      'MockAiRuntimeService.provider() kullanılmaz; model() kullan.',
    );
  }

  model(kind: AiModelKind) {
    return new MockLanguageModelV3({
      provider: 'mock',
      modelId: `mock-${kind}`,
      doGenerate: (options) => {
        this.calls.push(kind);
        this.throwIfFailing();
        return Promise.resolve(this.generate(kind, options));
      },
      doStream: (options) => {
        this.calls.push(kind);
        this.throwIfFailing();
        const result = this.generate(kind, options);
        const text = result.content
          .map((part) => (part.type === 'text' ? part.text : ''))
          .join('');
        const chunks: LanguageModelV3StreamPart[] = [
          { type: 'stream-start', warnings: [] },
          { type: 'text-start', id: 't1' },
          // 3 parçaya böl — istemci tarafı token akışı gözlemlenebilsin.
          ...splitInto(text, 3).map(
            (delta): LanguageModelV3StreamPart => ({
              type: 'text-delta',
              id: 't1',
              delta,
            }),
          ),
          { type: 'text-end', id: 't1' },
          { type: 'finish', finishReason: result.finishReason, usage: USAGE },
        ];
        return Promise.resolve({
          stream: simulateReadableStream({ chunks }),
        });
      },
    });
  }

  private throwIfFailing() {
    if (this.mode === 'error503') {
      throw new APICallError({
        message: 'mock provider error',
        url: 'mock://ai',
        requestBodyValues: {},
        statusCode: 400,
        isRetryable: false,
      });
    }
    if (this.mode === 'timeout') {
      const error = new Error('mock timeout');
      error.name = 'TimeoutError';
      throw error;
    }
  }

  private generate(
    kind: AiModelKind,
    options: LanguageModelV3CallOptions,
  ): LanguageModelV3GenerateResult {
    if (kind === 'select') {
      return toolCallResult(this.selectToolCall(options));
    }
    if (options.responseFormat?.type === 'json') {
      const json =
        kind === 'expand'
          ? { offTopic: false, expandedQuery: 'mock huzur ve şükür zikri' }
          : kind === 'classify'
            ? { mode: 'chat', searchQuery: 'mock sorgu' }
            : { coverage: 'none', usedPassages: [], answer: 'Mock yanıt.' };
      return textResult(JSON.stringify(json));
    }
    return textResult('Mock yanıt.');
  }

  private selectToolCall(options: LanguageModelV3CallOptions): {
    toolName: string;
    input: unknown;
  } {
    const available = new Set((options.tools ?? []).map((t) => t.name));
    // prepareStep: searchDhikrs yalnız ilk tur(lar)da aktif.
    const canSearch = available.has('searchDhikrs');
    const refs = Array.from(
      new Set(JSON.stringify(options.prompt).match(/\bC\d+\b/g) ?? []),
    ).slice(0, 3);
    const select = {
      toolName: 'selectRecommendations',
      input: {
        summary: 'Mock özet',
        items: refs.map((ref) => ({ ref, reason: `Mock gerekçe ${ref}` })),
      },
    };
    const search = {
      toolName: 'searchDhikrs',
      input: { query: 'mock yeniden arama', why: 'mock' },
    };

    switch (this.mode) {
      case 'toolLoop':
        return canSearch ? search : select;
      case 'clarify':
        return canSearch
          ? search
          : { toolName: 'askClarification', input: { question: 'Mock soru?' } };
      case 'noOutcome':
        return canSearch
          ? search
          : {
              toolName: 'selectRecommendations',
              input: { summary: 'x', items: [{ ref: 'C999', reason: 'x' }] },
            };
      default:
        return select;
    }
  }
}

function textResult(text: string): LanguageModelV3GenerateResult {
  return {
    content: [{ type: 'text', text }],
    finishReason: { unified: 'stop', raw: 'stop' },
    usage: USAGE,
    warnings: [],
  };
}

let toolCallSeq = 0;
function toolCallResult(call: {
  toolName: string;
  input: unknown;
}): LanguageModelV3GenerateResult {
  const content: LanguageModelV3Content[] = [
    {
      type: 'tool-call',
      toolCallId: `mock-call-${++toolCallSeq}`,
      toolName: call.toolName,
      input: JSON.stringify(call.input),
    },
  ];
  return {
    content,
    finishReason: { unified: 'tool-calls', raw: 'tool_calls' },
    usage: USAGE,
    warnings: [],
  };
}

function splitInto(text: string, parts: number): string[] {
  const size = Math.max(1, Math.ceil(text.length / parts));
  const out: string[] = [];
  for (let i = 0; i < text.length; i += size) out.push(text.slice(i, i + size));
  return out;
}

/**
 * $vectorSearch yerine deterministik `find` (\_id artan, isVerified+isActive,
 * excludeIds hariç). Kaynak pasajı araması boş döner. Diğer metotlar
 * (searchDhikrsByTimeOfDay, loadDhikrsByIds, getRecentDhikrIds, embedQuery)
 * gerçek — yerel Mongo'da çalışırlar.
 */
@Injectable()
export class MockRetrievalService extends RetrievalService {
  readonly prodGuard = assertNotProduction();

  async searchDhikrsByText(params: {
    query: string;
    limit: number;
    excludeIds: string[];
    locale: SupportedAiLocale;
  }): Promise<DhikrCandidate[]> {
    const docs = await this.dhikrModel
      .find({
        isVerified: true,
        isActive: true,
        _id: { $nin: params.excludeIds },
      })
      .sort({ _id: 1 })
      .limit(Math.min(params.limit ?? 10, 20))
      .lean()
      .exec();
    return docs.map((doc) => toDhikrCandidate(doc, params.locale));
  }

  searchSourcePassages(): Promise<SourcePassageResult[]> {
    // ponytail: pasaj yok; chat 'bilgi' / RAG senaryoları gerekirse find ile doldur.
    return Promise.resolve([]);
  }
}

/** Metnin sha256'sından türeyen sabit boyutlu deterministik vektör. */
@Injectable()
export class MockEmbeddingService extends EmbeddingService {
  readonly prodGuard = assertNotProduction();

  embedWithUsage(
    text: string,
  ): Promise<{ vector: number[] | null; usage?: { inputTokens: number } }> {
    const trimmed = text?.trim();
    if (!trimmed) return Promise.resolve({ vector: null });
    const hash = createHash('sha256').update(trimmed).digest();
    const vector = Array.from(
      { length: MOCK_EMBEDDING_DIMENSIONS },
      (_, i) => hash[i % hash.length] / 255 - 0.5,
    );
    return Promise.resolve({
      vector,
      usage: { inputTokens: Math.ceil(trimmed.length / 4) },
    });
  }
}
