import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { als, routePath } from './request-context';

/**
 * Yakalanmamış her hatayı Nest'in varsayılan gövde biçimiyle (+ `requestId`)
 * yanıtlar. `BaseExceptionFilter`'ı genişletmez — aksi halde Nest'in kendi
 * loglaması ile çift satır oluşur. Daha dar kapsamlı filtreler (örn.
 * `AiPipelineExceptionFilter`) Nest'in filtre önceliği gereği bunun önüne
 * geçer, davranışları değişmez.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(error: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw error;
    }

    const ctx = host.switchToHttp();
    const req = ctx.getRequest<Request>();
    const res = ctx.getResponse<Response>();

    const { status, body } = this.resolve(error);

    const store = als.getStore();
    if (store) {
      const code = (body as { code?: unknown }).code;
      const errText =
        typeof code === 'string' ? code : ((error as Error)?.message ?? '');
      store.err = errText.slice(0, 200);
    }

    if (status >= 500) {
      const route = `${req.method} ${routePath(req)}`;
      this.logger.error(
        {
          message: (error as Error)?.message,
          alert: `http.5xx:${route}`,
        },
        (error as Error)?.stack,
      );
    }

    if (res.headersSent) {
      res.end();
      return;
    }

    res.status(status).json({ ...body, requestId: store?.requestId });
  }

  private resolve(error: unknown): {
    status: number;
    body: Record<string, unknown>;
  } {
    if (error instanceof HttpException) {
      const status = error.getStatus();
      const response = error.getResponse();
      const body =
        typeof response === 'string'
          ? { statusCode: status, message: response }
          : (response as Record<string, unknown>);
      return { status, body };
    }

    const maybeHttpLike = error as { statusCode?: unknown; message?: unknown };
    if (
      typeof maybeHttpLike?.statusCode === 'number' &&
      typeof maybeHttpLike?.message === 'string'
    ) {
      return {
        status: maybeHttpLike.statusCode,
        body: {
          statusCode: maybeHttpLike.statusCode,
          message: maybeHttpLike.message,
        },
      };
    }

    return {
      status: 500,
      body: { statusCode: 500, message: 'Internal server error' },
    };
  }
}
