import { APICallError, NoObjectGeneratedError, RetryError } from 'ai';
import {
  AI_UNAVAILABLE_CODE,
  AI_UNAVAILABLE_MESSAGE,
  AiInvalidOutputError,
  AiPipelineError,
  AiTimeoutError,
  AiUnavailableException,
  classifyAiError,
} from './ai-errors';

function apiCallError(statusCode: number, message = 'api error'): APICallError {
  return new APICallError({
    message,
    url: 'https://api.openai.com/v1/responses',
    requestBodyValues: {},
    statusCode,
  });
}

describe('classifyAiError', () => {
  it('returns an already-classified AiPipelineError unchanged', () => {
    const original = new AiTimeoutError('zaten sınıflandırılmış');
    expect(classifyAiError(original)).toBe(original);
  });

  it('classifies a 429 APICallError as rate_limited and retryable', () => {
    const result = classifyAiError(apiCallError(429, 'too many requests'));
    expect(result.reason).toBe('rate_limited');
    expect(result.retryable).toBe(true);
    expect(result.cause).toBeInstanceOf(APICallError);
    expect(result.message).toBe('too many requests');
  });

  it('classifies a 503 APICallError as provider_error and retryable', () => {
    const result = classifyAiError(apiCallError(503, 'service unavailable'));
    expect(result.reason).toBe('provider_error');
    expect(result.retryable).toBe(true);
  });

  it('classifies a 401 APICallError as provider_error, non-retryable, mentioning the API key', () => {
    const result = classifyAiError(apiCallError(401, 'invalid api key'));
    expect(result.reason).toBe('provider_error');
    expect(result.retryable).toBe(false);
    expect(result.message.toLowerCase()).toContain('api anahtar');
  });

  it('classifies an AbortError as timeout and retryable', () => {
    const abortError = new Error('The operation was aborted');
    abortError.name = 'AbortError';
    const result = classifyAiError(abortError);
    expect(result.reason).toBe('timeout');
    expect(result.retryable).toBe(true);
    expect(result).toBeInstanceOf(AiTimeoutError);
  });

  it('classifies NoObjectGeneratedError as invalid_output and retryable', () => {
    const error = new NoObjectGeneratedError({
      message: 'no object generated',
      // Bu alanlar test için önemsiz; sadece tip şartını karşılıyorlar.
      response: {} as never,
      usage: {} as never,
      finishReason: 'error',
    });
    const result = classifyAiError(error);
    expect(result.reason).toBe('invalid_output');
    expect(result.retryable).toBe(true);
    expect(result).toBeInstanceOf(AiInvalidOutputError);
  });

  it('unwraps a RetryError to classify its lastError (503 -> provider_error/retryable)', () => {
    const underlying = apiCallError(503, 'service unavailable');
    const retryError = new RetryError({
      message: 'Failed after 3 attempts',
      reason: 'maxRetriesExceeded',
      errors: [underlying, underlying, underlying],
    });
    const result = classifyAiError(retryError);
    expect(result.reason).toBe('provider_error');
    expect(result.retryable).toBe(true);
    expect(result.cause).toBe(underlying);
  });

  it('classifies a plain Error as provider_error and non-retryable', () => {
    const result = classifyAiError(new Error('something unexpected happened'));
    expect(result.reason).toBe('provider_error');
    expect(result.retryable).toBe(false);
  });
});

describe('AiUnavailableException', () => {
  it('builds the expected response body shape', () => {
    const exception = new AiUnavailableException(
      'provider_error',
      'req-123',
      'tr',
    );
    expect(exception.getStatus()).toBe(503);
    expect(exception.getResponse()).toEqual({
      code: AI_UNAVAILABLE_CODE,
      reason: 'provider_error',
      requestId: 'req-123',
      message: AI_UNAVAILABLE_MESSAGE.tr,
    });
  });

  it('defaults to the tr locale and allows an undefined requestId', () => {
    const exception = new AiUnavailableException('timeout');
    expect(exception.getResponse()).toEqual({
      code: AI_UNAVAILABLE_CODE,
      reason: 'timeout',
      requestId: undefined,
      message: AI_UNAVAILABLE_MESSAGE.tr,
    });
  });

  it('uses the en message when locale is en', () => {
    const exception = new AiUnavailableException('timeout', undefined, 'en');
    expect((exception.getResponse() as { message: string }).message).toBe(
      AI_UNAVAILABLE_MESSAGE.en,
    );
  });
});

describe('AiPipelineError subclasses', () => {
  it('keep their fixed reason/retryable defaults', () => {
    expect(new AiPipelineError('provider_error', 'x', false).retryable).toBe(
      false,
    );
  });
});
