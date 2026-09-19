import { ConsoleLogger } from '@nestjs/common';
import type { LogLevel } from '@nestjs/common';
import { als } from './request-context';
import { sendAlert } from './alerts';

const REDACT_KEY =
  /(token|secret|password|authorization|cookie|email)$|^(prompt|freetext|content)$/i;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return (
    typeof value === 'object' &&
    value !== null &&
    !Array.isArray(value) &&
    !(value instanceof Error)
  );
}

export function redact(o: unknown, depth = 0): unknown {
  if (Array.isArray(o)) {
    return depth < 3 ? o.map((v) => redact(v, depth + 1)) : o;
  }
  if (!isPlainObject(o)) {
    return o;
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(o)) {
    if (REDACT_KEY.test(key)) {
      out[key] = '[redacted]';
    } else if (depth < 3) {
      out[key] = redact(value, depth + 1);
    } else {
      out[key] = value;
    }
  }
  return out;
}

type JsonLogOptions = {
  context: string;
  logLevel: LogLevel;
  writeStreamType?: 'stdout' | 'stderr';
  errorStack?: unknown;
};

/**
 * `Logger(X)` statik örneğe delege ettiği için mevcut çağrı yerleri değişmeden
 * bu sınıfın davranışını devralır (bkz. NestFactory.create(AppModule, { logger })).
 */
export class AppLogger extends ConsoleLogger {
  protected printMessages(
    messages: unknown[],
    context?: string,
    logLevel: LogLevel = 'log',
    writeStreamType?: 'stdout' | 'stderr',
    errorStack?: unknown,
  ) {
    for (const m of messages) {
      if (isPlainObject(m) && typeof m.alert === 'string') {
        sendAlert(m.alert, m, als.getStore()?.requestId);
      }
    }
    super.printMessages(
      messages,
      context,
      logLevel,
      writeStreamType,
      errorStack,
    );
  }

  // Nest'in `getJsonLogObject`'ini ezmiyoruz: taban imzası `level: LogLevel`
  // ister, biz 'log'u 'info'ya eşliyoruz. printAsJson tamamen ezildiği için
  // tabandaki metot zaten hiç çağrılmıyor.
  protected buildLogObject(
    message: unknown,
    options: JsonLogOptions,
  ): Record<string, unknown> {
    const store = als.getStore();

    let payload: Record<string, unknown>;
    if (message instanceof Error) {
      payload = { message: message.message, stack: message.stack };
    } else if (isPlainObject(message)) {
      payload = redact(message) as Record<string, unknown>;
    } else {
      payload = { message: String(message) };
    }

    const level = options.logLevel === 'log' ? 'info' : options.logLevel;
    const stack = options.errorStack ?? payload.stack;

    // Temel alanlar en sona yayılır — payload bunları taklit edemez. ALS'te
    // userId yoksa payload'daki `userId` da düşer (ALS dışı çağrılar
    // `targetUserId` kullanmalı, bkz. webhooks/cron).
    return {
      ...payload,
      dt: new Date().toISOString(),
      level,
      context: options.context,
      requestId: store?.requestId,
      userId: store?.req?.authUser?.userId,
      ...(stack !== undefined && { stack }),
    };
  }

  protected printAsJson(message: unknown, options: JsonLogOptions) {
    const logObject = this.buildLogObject(message, options);
    let line: string;
    try {
      line = JSON.stringify(logObject, (key, value) =>
        this.stringifyReplacer(key, value),
      );
    } catch {
      line = JSON.stringify({
        dt: new Date().toISOString(),
        level: 'error',
        message: 'unserializable log payload',
      });
    }

    process[options.writeStreamType ?? 'stdout'].write(`${line}\n`);
    drainPush(line);
  }
}

// ── Drain: stdout'un yanında Better Stack'e toplu POST ─────────────────────
// ponytail: drop-on-failure; Render stdout yedek kayıt, retry kuyruğu ölçülmüş kayıp olursa

const buf: string[] = [];
const MAX = 2000;
const BATCH = 200;
const EVERY_MS = 5000;

export function drainPush(line: string) {
  if (!process.env.LOG_DRAIN_URL) {
    return;
  }
  buf.push(line);
  while (buf.length > MAX) {
    buf.shift();
  }
}

export async function flushDrain() {
  const url = process.env.LOG_DRAIN_URL;
  if (!url || buf.length === 0) {
    return;
  }

  while (buf.length > 0) {
    const batch = buf.splice(0, BATCH);
    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${process.env.LOG_DRAIN_TOKEN}`,
        },
        body: `[${batch.join(',')}]`,
        signal: AbortSignal.timeout(10_000),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}`);
      }
    } catch (e) {
      // Logger'a asla dönme (özyineleme) — ham stderr notu yeter.
      process.stderr.write(
        `log drain failed (${(e as Error).message}), dropped=${batch.length}\n`,
      );
    }
  }
}

setInterval(() => void flushDrain(), EVERY_MS).unref();

export function __drainSize() {
  return buf.length;
}
