import { ServiceUnavailableException } from '@nestjs/common';
import {
  APICallError,
  InvalidToolInputError,
  JSONParseError,
  NoObjectGeneratedError,
  NoOutputGeneratedError,
  RetryError,
  TypeValidationError,
} from 'ai';
import type { SupportedAiLocale } from './utils/locale';

/**
 * AI pipeline'ının (retrieval → LLM çağrısı → stream) sınıflandırılmış hata
 * nedenleri. Kullanıcıya döndürülecek mesaj ve retry kararı buna göre verilir.
 */
export type AiFailureReason =
  | 'not_configured'
  | 'timeout'
  | 'rate_limited'
  | 'provider_error'
  | 'invalid_output'
  | 'embedding_failed'
  | 'retrieval_failed'
  | 'stream_interrupted';

/**
 * AI pipeline'ındaki tüm hataların temel sınıfı. `reason` üst katmanın (filter,
 * retry mantığı) hatayı ham `Error` mesajını parse etmeden anlamasını sağlar;
 * `retryable` yeniden deneme kararını taşır; `cause` orijinal hatayı korur.
 */
export class AiPipelineError extends Error {
  constructor(
    readonly reason: AiFailureReason,
    message: string,
    readonly retryable: boolean,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'AiPipelineError';
  }
}

export class AiNotConfiguredError extends AiPipelineError {
  constructor(
    message = 'AI sağlayıcısı yapılandırılmamış (OPENAI_API_KEY eksik).',
    cause?: unknown,
  ) {
    super('not_configured', message, false, cause);
    this.name = 'AiNotConfiguredError';
  }
}

export class AiTimeoutError extends AiPipelineError {
  constructor(message = 'AI isteği zaman aşımına uğradı.', cause?: unknown) {
    super('timeout', message, true, cause);
    this.name = 'AiTimeoutError';
  }
}

export class AiProviderError extends AiPipelineError {
  constructor(message: string, retryable: boolean, cause?: unknown) {
    super('provider_error', message, retryable, cause);
    this.name = 'AiProviderError';
  }
}

export class AiInvalidOutputError extends AiPipelineError {
  constructor(
    message = 'AI yanıtı beklenen biçimde/şemada değil.',
    cause?: unknown,
  ) {
    super('invalid_output', message, true, cause);
    this.name = 'AiInvalidOutputError';
  }
}

const RETRIEVAL_ERROR_DEFAULT_MESSAGE: Record<
  'embedding_failed' | 'retrieval_failed',
  string
> = {
  embedding_failed: 'Sorgu gömme (embedding) işlemi başarısız oldu.',
  retrieval_failed: 'Kaynak/gömme (embedding) arama işlemi başarısız oldu.',
};

export class AiRetrievalError extends AiPipelineError {
  constructor(
    reason: 'embedding_failed' | 'retrieval_failed' = 'retrieval_failed',
    message?: string,
    cause?: unknown,
  ) {
    super(
      reason,
      message ?? RETRIEVAL_ERROR_DEFAULT_MESSAGE[reason],
      true,
      cause,
    );
    this.name = 'AiRetrievalError';
  }
}

export class AiStreamInterruptedError extends AiPipelineError {
  constructor(
    message = 'Yanıt akışı beklenmedik şekilde kesildi.',
    cause?: unknown,
  ) {
    super('stream_interrupted', message, false, cause);
    this.name = 'AiStreamInterruptedError';
  }
}

export const AI_UNAVAILABLE_CODE = 'AI_UNAVAILABLE';

export const AI_UNAVAILABLE_MESSAGE: Record<SupportedAiLocale, string> = {
  tr: 'Asistan şu anda yanıt veremiyor. Kredin düşülmedi, lütfen tekrar dene.',
  en: 'The assistant cannot respond right now. No credit was charged, please try again.',
};

/**
 * Sınıflandırılmış AI hatalarının HTTP karşılığı. Mesaj kasıtlı olarak nedeni
 * (timeout/rate-limit/provider hatası vb.) sızdırmaz — kullanıcıya her zaman
 * aynı güven verici metin gösterilir; `reason` yalnızca istemci/telemetri
 * için taşınır.
 */
export class AiUnavailableException extends ServiceUnavailableException {
  constructor(
    reason: AiFailureReason,
    requestId?: string,
    locale: SupportedAiLocale = 'tr',
  ) {
    super({
      code: AI_UNAVAILABLE_CODE,
      reason,
      requestId,
      message: AI_UNAVAILABLE_MESSAGE[locale],
    });
  }
}

/**
 * Bilinmeyen bir hatayı (Vercel AI SDK hataları dahil) `AiPipelineError`'a
 * dönüştürür. Zaten sınıflandırılmışsa olduğu gibi döner; `RetryError` son
 * denemenin altındaki gerçek hatayı açığa çıkarır (recursive).
 */
export function classifyAiError(error: unknown): AiPipelineError {
  if (error instanceof AiPipelineError) {
    return error;
  }

  if (RetryError.isInstance(error)) {
    return classifyAiError(error.lastError);
  }

  if (APICallError.isInstance(error)) {
    const statusCode = error.statusCode;

    if (statusCode === 429) {
      return new AiPipelineError('rate_limited', error.message, true, error);
    }

    if (typeof statusCode === 'number' && statusCode >= 500) {
      return new AiProviderError(error.message, true, error);
    }

    if (typeof statusCode === 'number' && statusCode >= 400) {
      const message =
        statusCode === 401 || statusCode === 403
          ? `AI sağlayıcı kimlik doğrulaması başarısız — API anahtarını kontrol edin: ${error.message}`
          : error.message;
      return new AiProviderError(message, false, error);
    }

    // statusCode yok (ör. ağ hatası) — SDK'nın kendi isRetryable kararına düş.
    return new AiProviderError(error.message, error.isRetryable, error);
  }

  const name = error instanceof Error ? error.name : undefined;
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : 'bilinmeyen hata';

  if (
    name === 'AbortError' ||
    name === 'TimeoutError' ||
    message.toLowerCase().includes('timeout')
  ) {
    return new AiTimeoutError(message, error);
  }

  if (
    NoObjectGeneratedError.isInstance(error) ||
    NoOutputGeneratedError.isInstance(error) ||
    InvalidToolInputError.isInstance(error) ||
    JSONParseError.isInstance(error) ||
    TypeValidationError.isInstance(error)
  ) {
    return new AiInvalidOutputError(message, error);
  }

  return new AiProviderError(message, false, error);
}
