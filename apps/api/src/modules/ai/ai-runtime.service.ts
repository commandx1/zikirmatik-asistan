import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createOpenAI } from '@ai-sdk/openai';
import {
  AiNotConfiguredError,
  AiPipelineError,
  classifyAiError,
} from './ai-errors';

export type AiModelKind = 'select' | 'chat' | 'classify' | 'expand';

type ReasoningEffort = 'minimal' | 'low' | 'medium' | 'high';

type AiSettings = {
  timeout: { totalMs: number; chunkMs?: number };
  maxRetries: number;
  maxOutputTokens: number;
  providerOptions?: {
    openai: { reasoningEffort: ReasoningEffort; textVerbosity: 'low' };
  };
  temperature?: number;
};

const DEFAULT_MODEL_ENV: Record<
  AiModelKind,
  { envKey: string; fallback: string }
> = {
  select: { envKey: 'AI_SELECT_MODEL', fallback: 'gpt-5' },
  chat: { envKey: 'AI_CHAT_MODEL', fallback: 'gpt-5' },
  classify: { envKey: 'AI_CLASSIFY_MODEL', fallback: 'gpt-5-mini' },
  expand: { envKey: 'AI_EXPAND_MODEL', fallback: 'gpt-5-mini' },
};

const DEFAULT_REASONING_EFFORT_ENV: Record<
  AiModelKind,
  { envKey?: string; fallback: ReasoningEffort }
> = {
  select: { envKey: 'AI_SELECT_REASONING_EFFORT', fallback: 'minimal' },
  chat: { envKey: 'AI_CHAT_REASONING_EFFORT', fallback: 'low' },
  classify: { fallback: 'minimal' },
  expand: { fallback: 'minimal' },
};

const DEFAULT_TIMEOUT_MS: Record<
  AiModelKind,
  { envKey: string; fallback: number }
> = {
  select: { envKey: 'AI_SELECT_TIMEOUT_MS', fallback: 30000 },
  chat: { envKey: 'AI_CHAT_TIMEOUT_MS', fallback: 45000 },
  classify: { envKey: 'AI_CLASSIFY_TIMEOUT_MS', fallback: 8000 },
  expand: { envKey: 'AI_EXPAND_TIMEOUT_MS', fallback: 8000 },
};

const DEFAULT_MAX_OUTPUT_TOKENS: Record<AiModelKind, number> = {
  select: 3000,
  chat: 2500,
  classify: 800,
  expand: 800,
};

/**
 * AI pipeline'ının runtime ayarlarını (model adı, reasoning effort, timeout,
 * retry) tek yerden toplar. `ai.service.ts`/`ai-chat.service.ts` bu servisi
 * enjekte ederek model/ayar seçimini ve retry mantığını buradan alır — model
 * adları/varsayılanları burada değiştirilir, çağıran taraflar dokunulmaz.
 */
@Injectable()
export class AiRuntimeService {
  private readonly logger = new Logger('AiRuntime');
  private openaiProvider?: ReturnType<typeof createOpenAI>;

  constructor(private readonly configService: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.configService.get<string>('OPENAI_API_KEY'));
  }

  /**
   * `createOpenAI({ apiKey })` çağrısını tembel ve tek seferlik yapar.
   * OPENAI_API_KEY tanımlı değilse `AiNotConfiguredError` fırlatır.
   */
  provider(): ReturnType<typeof createOpenAI> {
    if (this.openaiProvider) {
      return this.openaiProvider;
    }

    const apiKey = this.configService.get<string>('OPENAI_API_KEY');
    if (!apiKey) {
      throw new AiNotConfiguredError();
    }

    this.openaiProvider = createOpenAI({ apiKey });
    return this.openaiProvider;
  }

  modelName(kind: AiModelKind): string {
    const { envKey, fallback } = DEFAULT_MODEL_ENV[kind];
    return this.configService.get<string>(envKey) ?? fallback;
  }

  model(kind: AiModelKind) {
    return this.provider()(this.modelName(kind));
  }

  isReasoningModel(id: string): boolean {
    if (id.startsWith('gpt-5')) {
      return !id.startsWith('gpt-5-chat');
    }
    return id.startsWith('o1') || id.startsWith('o3') || id.startsWith('o4');
  }

  private reasoningEffort(kind: AiModelKind): ReasoningEffort {
    const { envKey, fallback } = DEFAULT_REASONING_EFFORT_ENV[kind];
    if (!envKey) {
      return fallback;
    }
    return (
      (this.configService.get<string>(envKey) as ReasoningEffort | undefined) ??
      fallback
    );
  }

  private timeoutMs(kind: AiModelKind): number {
    const { envKey, fallback } = DEFAULT_TIMEOUT_MS[kind];
    const raw = Number(this.configService.get<string | number>(envKey));
    return Number.isFinite(raw) && raw > 0 ? raw : fallback;
  }

  private maxOutputTokens(kind: AiModelKind): number {
    return DEFAULT_MAX_OUTPUT_TOKENS[kind];
  }

  /**
   * `generateText`/`streamText`/`generateObject` çağrılarına spread edilecek
   * ortak ayarları üretir. Reasoning modelleri (gpt-5*, o1/o3/o4) için
   * `providerOptions.openai.reasoningEffort` gönderilir; diğerleri için
   * `temperature: 0` kullanılır (ikisi birden desteklenmez).
   */
  settings(kind: AiModelKind, opts?: { stream?: boolean }): AiSettings {
    const totalMs = this.timeoutMs(kind);
    const isReasoning = this.isReasoningModel(this.modelName(kind));

    return {
      timeout: {
        totalMs,
        ...(opts?.stream ? { chunkMs: 15000 } : {}),
      },
      maxRetries: 1,
      maxOutputTokens: this.maxOutputTokens(kind),
      ...(isReasoning
        ? {
            providerOptions: {
              openai: {
                reasoningEffort: this.reasoningEffort(kind),
                textVerbosity: 'low' as const,
              },
            },
          }
        : { temperature: 0 }),
    };
  }

  /**
   * `[flow=<flowId'nin ilk 8 karakteri veya '-'>]` önekiyle loglayan yardımcı.
   * Tüm AI akışlarında flowId'yi tekrar tekrar slice etmemek için kullanılır.
   */
  flowLog(flowId?: string): {
    log: (message: string) => void;
    warn: (message: string) => void;
    error: (message: string, trace?: string) => void;
    debug: (message: string) => void;
  } {
    const prefix = `[flow=${flowId ? flowId.slice(0, 8) : '-'}]`;
    return {
      log: (message: string) => this.logger.log(`${prefix} ${message}`),
      warn: (message: string) => this.logger.warn(`${prefix} ${message}`),
      error: (message: string, trace?: string) =>
        this.logger.error(`${prefix} ${message}`, trace),
      debug: (message: string) => this.logger.debug(`${prefix} ${message}`),
    };
  }

  /**
   * `fn`'i çalıştırır; hata sınıflandırılabilir ve retryable ise (ve
   * `canRetry` engellemiyorsa) tekrar dener. Son hatayı her zaman
   * `AiPipelineError` olarak fırlatır — çağıran taraf `classifyAiError`
   * tekrar çağırmak zorunda kalmaz.
   */
  async withAiRetry<T>(
    label: string,
    fn: (attempt: number) => Promise<T>,
    opts?: { flowId?: string; attempts?: number; canRetry?: () => boolean },
  ): Promise<T> {
    const attempts = opts?.attempts ?? 2;
    const { warn } = this.flowLog(opts?.flowId);
    let lastError: AiPipelineError | undefined;

    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        return await fn(attempt);
      } catch (rawError) {
        const error = classifyAiError(rawError);
        lastError = error;

        const canRetry = opts?.canRetry ? opts.canRetry() : true;
        const willRetry = error.retryable && attempt < attempts && canRetry;

        warn(
          `${label} başarısız (attempt=${attempt}/${attempts}, reason=${error.reason}, retryable=${error.retryable}, willRetry=${willRetry}): ${error.message}`,
        );

        if (!willRetry) {
          throw error;
        }
      }
    }

    // Buraya normalde ulaşılmaz (döngü ya döner ya fırlatır), ama TS için
    // ve attempts <= 0 gibi uç durumlar için savunma amaçlı.
    throw lastError ?? new AiPipelineError('provider_error', label, false);
  }
}
