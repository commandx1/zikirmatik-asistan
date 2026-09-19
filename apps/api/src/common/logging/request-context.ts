import { AsyncLocalStorage } from 'node:async_hooks';
import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';

export type RequestStore = {
  requestId: string;
  req?: Request & { authUser?: { userId: string } };
  err?: string;
};

export const als = new AsyncLocalStorage<RequestStore>();

// Express'in `Request.route` tipi `any` — erişimi tek yerde tipliyoruz.
export function routePath(req: Request): string {
  const route = req.route as { path?: string } | undefined;
  return route?.path ?? 'UNMATCHED';
}

const REQUEST_ID_PATTERN = /^[\w-]{8,64}$/;

const httpLogger = new Logger('Http');

// Rota deseni (METHOD + req.route.path) → yalnız hata veya yavaşsa logla.
// Gerçek controller path'lerine göre doğrulandı (bkz. Dalga 1 brief'i).
const QUIET = new Set([
  'GET /health',
  'GET /app-config',
  'POST /v1/events',
  'POST /v1/dhikr-logs',
  'POST /v1/dhikr-logs/bulk',
  'GET /v1/circles/:id',
]);

const SLOW_MS = () => Number(process.env.ACCESS_LOG_SLOW_MS) || 1000;

export function requestContext(
  req: Request & { authUser?: { userId: string } },
  res: Response,
  next: NextFunction,
) {
  const inbound = req.headers['x-request-id'];
  const inboundId = Array.isArray(inbound) ? inbound[0] : inbound;
  const requestId =
    inboundId && REQUEST_ID_PATTERN.test(inboundId) ? inboundId : randomUUID();

  res.setHeader('x-request-id', requestId);

  const store: RequestStore = { requestId, req };
  const startedAt = Date.now();

  res.once('close', () => {
    als.run(store, () => {
      const route = `${req.method} ${routePath(req)}`;
      const status = res.statusCode;
      const durationMs = Date.now() - startedAt;
      const aborted = !res.writableFinished || undefined;

      const isQuiet = QUIET.has(route);
      if (isQuiet && status < 400 && durationMs < SLOW_MS()) {
        return;
      }

      const payload = {
        event: 'http',
        route,
        status,
        durationMs,
        ...(aborted && { aborted }),
        ...(store.err && { err: store.err }),
      };

      if (status >= 500) {
        httpLogger.error(payload);
      } else if (status >= 400) {
        httpLogger.warn(payload);
      } else {
        httpLogger.log(payload);
      }
    });
  });

  als.run(store, next);
}
