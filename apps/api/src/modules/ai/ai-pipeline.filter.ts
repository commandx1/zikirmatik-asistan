import { ArgumentsHost, Catch, ExceptionFilter, Logger } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AiPipelineError, AiUnavailableException } from './ai-errors';
import { resolveAiRecommendationLocale } from './utils/locale';

/**
 * `AiPipelineError` fırlatan her yerin (AiService, AiChatService, retrieval
 * katmanı) HTTP karşılığını tek bir yerde standardize eder: her zaman aynı
 * güven verici 503 mesajı, gerçek neden yalnızca loglara ve `reason`
 * alanına yazılır. SSE akışı zaten başlamışsa (`res.headersSent`) yanıt
 * gövdesi değiştirilemez — yalnızca loglanır.
 */
@Catch(AiPipelineError)
export class AiPipelineExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(AiPipelineExceptionFilter.name);

  catch(err: AiPipelineError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const requestIdHeader = req?.headers?.['x-request-id'];
    const bodyFlowId = (req?.body as { flowId?: unknown } | undefined)?.flowId;
    const requestId =
      (typeof requestIdHeader === 'string' ? requestIdHeader : undefined) ??
      (typeof bodyFlowId === 'string' ? bodyFlowId : undefined);

    const locale = resolveAiRecommendationLocale(
      req?.headers?.['accept-language'],
    );

    this.logger.error(
      `AI pipeline hatası (reason=${err.reason}, requestId=${requestId ?? '-'}): ${err.message}`,
      err.cause instanceof Error ? err.cause.stack : undefined,
    );

    if (res.headersSent) {
      // SSE akışı zaten başlamış — gövdeyi değiştiremeyiz, sadece logladık.
      return;
    }

    const exception = new AiUnavailableException(err.reason, requestId, locale);
    res.status(503).json(exception.getResponse());
  }
}
