import { BadRequestException } from '@nestjs/common';
import type { ArgumentsHost } from '@nestjs/common';
import {
  AppLogger,
  redact,
  drainPush,
  flushDrain,
  __drainSize,
} from './app-logger';
import { als, type RequestStore } from './request-context';
import { sendAlert, __resetAlerts } from './alerts';
import { AllExceptionsFilter } from './all-exceptions.filter';

// `buildLogObject` protected — testler için tek yerde tipli bir erişimci.
type Testable = {
  buildLogObject: (
    message: unknown,
    options: { context: string; logLevel: string },
  ) => Record<string, unknown>;
};
const testable = (logger: AppLogger) => logger as unknown as Testable;

describe('AppLogger.buildLogObject', () => {
  const logger = new AppLogger({ json: true });

  it('attaches ALS fields and maps log→info', () => {
    const store: RequestStore = {
      requestId: 'req-1',
      req: { authUser: { userId: 'user-1' } } as unknown as RequestStore['req'],
    };
    const result = als.run(store, () =>
      testable(logger).buildLogObject(
        { event: 'http', status: 200 },
        { context: 'Http', logLevel: 'log' },
      ),
    );

    expect(result.requestId).toBe('req-1');
    expect(result.userId).toBe('user-1');
    expect(result.level).toBe('info');
    expect(result.event).toBe('http');
    expect(typeof result.dt).toBe('string');
  });

  it('redacts sensitive keys but keeps inputTokens', () => {
    const result = redact({
      email: 'a@b.com',
      authorization: 'Bearer x',
      inputTokens: 42,
      nested: { password: 'p', ok: 1 },
    }) as Record<string, Record<string, unknown>>;

    expect(result.email).toBe('[redacted]');
    expect(result.authorization).toBe('[redacted]');
    expect(result.inputTokens).toBe(42);
    expect(result.nested.password).toBe('[redacted]');
    expect(result.nested.ok).toBe(1);
  });

  it('never lets the payload spoof userId, even without an ALS user', () => {
    const result = als.run({ requestId: 'req-2' }, () =>
      testable(logger).buildLogObject(
        { userId: 'attacker' },
        { context: 'X', logLevel: 'warn' },
      ),
    );

    expect(result.userId).toBeUndefined();
  });
});

describe('AllExceptionsFilter', () => {
  const filter = new AllExceptionsFilter();

  const makeHost = () => {
    const req = { method: 'GET', route: { path: '/v1/x' } };
    const res = {
      headersSent: false,
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
      end: jest.fn(),
    };
    const host = {
      getType: () => 'http',
      switchToHttp: () => ({
        getRequest: () => req,
        getResponse: () => res,
      }),
    } as unknown as ArgumentsHost;
    return { req, res, host };
  };

  it('keeps array validation messages intact (400)', () => {
    const { res, host } = makeHost();
    filter.catch(new BadRequestException(['a must be string']), host);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ message: ['a must be string'] }),
    );
  });

  it('falls back to the generic 500 body for unknown errors', () => {
    const { res, host } = makeHost();
    filter.catch(new Error('boom'), host);
    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: 500,
        message: 'Internal server error',
      }),
    );
  });

  it('respects a non-Http error carrying its own statusCode (body-parser style)', () => {
    const { res, host } = makeHost();
    filter.catch({ statusCode: 413, message: 'too large' }, host);
    expect(res.status).toHaveBeenCalledWith(413);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({ statusCode: 413, message: 'too large' }),
    );
  });

  it('only ends the response when headers are already sent', () => {
    const { res, host } = makeHost();
    res.headersSent = true;
    filter.catch(new Error('boom'), host);
    expect(res.end).toHaveBeenCalled();
    expect(res.json).not.toHaveBeenCalled();
  });
});

describe('sendAlert', () => {
  const originalWebhook = process.env.SLACK_ALERT_WEBHOOK_URL;
  const originalFetch = global.fetch;
  let fetchMock: jest.Mock<Promise<{ ok: boolean }>, [string, RequestInit]>;

  beforeEach(() => {
    __resetAlerts();
    process.env.SLACK_ALERT_WEBHOOK_URL = 'https://hooks.example.test/x';
    fetchMock = jest
      .fn<Promise<{ ok: boolean }>, [string, RequestInit]>()
      .mockResolvedValue({ ok: true });
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    process.env.SLACK_ALERT_WEBHOOK_URL = originalWebhook;
    global.fetch = originalFetch;
  });

  it('does nothing when the webhook env var is unset', () => {
    delete process.env.SLACK_ALERT_WEBHOOK_URL;
    sendAlert('http.5xx:GET /x', { message: 'oops' }, 'r1', 1000);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  const T0 = 1_700_000_000_000; // gerçekçi epoch ms — dedupe'un lastSent=0 başlangıcıyla yanlışlıkla eşleşmemesi için

  it('only fires once a thresholded key crosses its hit count', () => {
    sendAlert('ai.unavailable', { message: 'a' }, 'r1', T0);
    sendAlert('ai.unavailable', { message: 'a' }, 'r1', T0 + 100);
    expect(fetchMock).not.toHaveBeenCalled();
    sendAlert('ai.unavailable', { message: 'a' }, 'r1', T0 + 200);
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it('dedupes the same key within the window and reports suppressed count', () => {
    sendAlert('http.5xx:GET /x', { message: 'a' }, 'r1', T0);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    sendAlert('http.5xx:GET /x', { message: 'a' }, 'r1', T0 + 1000);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    sendAlert('http.5xx:GET /x', { message: 'a' }, 'r1', T0 + 16 * 60 * 1000);
    expect(fetchMock).toHaveBeenCalledTimes(2);

    const secondCallInit = fetchMock.mock.calls[1][1] as { body: string };
    const body = JSON.parse(secondCallInit.body) as { text: string };
    expect(body.text).toContain('+1 suppressed');
  });
});

describe('log drain', () => {
  const originalDrainUrl = process.env.LOG_DRAIN_URL;
  const originalFetch = global.fetch;

  beforeEach(() => {
    process.env.LOG_DRAIN_URL = 'https://drain.example.test/logs';
    process.env.LOG_DRAIN_TOKEN = 'x';
  });

  afterEach(async () => {
    // Tamponu boşalt ki testler birbirine sızmasın.
    await flushDrain();
    process.env.LOG_DRAIN_URL = originalDrainUrl;
    global.fetch = originalFetch;
  });

  it('drops the batch and resolves cleanly when the POST fails', async () => {
    global.fetch = jest.fn().mockRejectedValue(new Error('network down'));
    drainPush('{"a":1}');
    drainPush('{"a":2}');

    await expect(flushDrain()).resolves.toBeUndefined();
    expect(__drainSize()).toBe(0);
  });

  it('caps the buffer at MAX and drops the oldest lines', () => {
    for (let i = 0; i < 2100; i++) {
      drainPush(`{"i":${i}}`);
    }
    expect(__drainSize()).toBe(2000);
  });
});
