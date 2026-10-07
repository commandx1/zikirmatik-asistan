/**
 * AI Sohbet SSE (iki stream rotası) + `/ai-progress` WebSocket — gerçek Mongo,
 * mock LLM. Ham text/event-stream ayrıştırılır; istemci kopması gerçek bir
 * http isteğinin iptaliyle (app.listen(0)) denenir.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import http, { type Server } from 'node:http';
import type { AddressInfo } from 'node:net';
import { io as connect, type Socket } from 'socket.io-client';
import { Types } from 'mongoose';
import request from 'supertest';
import { AiRuntimeService } from '../src/modules/ai/ai-runtime.service';
import { MockAiRuntimeService } from '../src/modules/ai/testing/ai-mocks';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';
import { parseSse, rawSse } from './helpers/sse';

describe('AI akış kanalları (e2e)', () => {
  let t: TestApp;
  let ai: MockAiRuntimeService;
  let port: number;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    ai = t.app.get(AiRuntimeService);
    await t.app.listen(0);
    port = ((t.app.getHttpServer() as Server).address() as AddressInfo).port;
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
    ai.reset();
  });

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await t?.close();
  });

  async function setup() {
    const user = await signIn(t.http, { sub: `e2e-sse-${randomUUID()}` });
    const userId = new Types.ObjectId(user.userId);
    const credits = () =>
      request(t.http)
        .get('/v1/ai/credits')
        .set(bearer(user.accessToken))
        .expect(200)
        .then((res) => data<{ balance: number }>(res).balance);
    const debits = () =>
      t
        .model('AiCreditLedger')
        .countDocuments({ userId, reason: 'CHAT_MESSAGE_DEBIT' });
    await credits(); // cüzdan + günlük grant
    return { user, userId, credits, debits };
  }

  /** LLM stream çağrısını `release()` çağrılana kadar bekletir. */
  /* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return --
     'ai/test' tipleri eslint çözümlemesinde any görünür (tsc'de tipli). */
  function gateStreams() {
    let release!: () => void;
    const gate = new Promise<void>((r) => (release = r));
    const original = ai.model.bind(ai);
    jest.spyOn(ai, 'model').mockImplementation((kind) => {
      const m = original(kind);
      const doStream = m.doStream.bind(m);
      m.doStream = async (o) => {
        await gate;
        return doStream(o);
      };
      return m;
    });
    return release;
  }
  /* eslint-enable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-return */

  const createStream = (token: string, body: Record<string, unknown>) =>
    rawSse(
      request(t.http)
        .post('/v1/ai/chat/conversations/stream')
        .set(bearer(token))
        .send(body),
    );

  async function seedConversation(token: string) {
    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(token))
      .send({ firstMessage: 'ilk mesaj' })
      .expect(201);
    return data<{ conversation: { _id: string } }>(res).conversation._id;
  }

  describe('SSE', () => {
    it('CHT-15: conversations/stream → token×N sonra done; kredi bir kez düşer', async () => {
      const { user, credits, debits } = await setup();
      const before = await credits();

      const res = await createStream(user.accessToken, {
        firstMessage: 'akış sorusu',
      }).expect(201);
      expect(res.headers['content-type']).toMatch(/text\/event-stream/);
      const events = parseSse(res.body as string);

      const names = events.map((e) => e.event);
      expect(names.at(-1)).toBe('done');
      expect(names.slice(0, -1).every((n) => n === 'token')).toBe(true);
      expect(names.filter((n) => n === 'token').length).toBeGreaterThan(1);
      const deltas = events
        .filter((e) => e.event === 'token')
        .map((e) => e.data.delta as string)
        .join('');
      const done = events.at(-1)!.data;
      expect(done.content).toBe(deltas);
      expect(done).toMatchObject({
        remainingCredits: before - 1,
        mode: 'chat',
      });
      expect(done.messageId).toBeTruthy();
      expect(done.conversationId).toBeTruthy();

      expect(await credits()).toBe(before - 1);
      expect(await debits()).toBe(1);
    });

    it('CHT-15: messages/stream (var olan konuşma) → token×N sonra done; kredi bir kez', async () => {
      const { user, credits, debits } = await setup();
      const conversationId = await seedConversation(user.accessToken);
      const before = await credits();

      const res = await rawSse(
        request(t.http)
          .post(`/v1/ai/chat/conversations/${conversationId}/messages/stream`)
          .set(bearer(user.accessToken))
          .send({ message: 'ikinci' }),
      ).expect(201);
      const events = parseSse(res.body as string);
      expect(events.at(-1)?.event).toBe('done');
      expect(events.slice(0, -1).every((e) => e.event === 'token')).toBe(true);
      expect(await credits()).toBe(before - 1);
      expect(await debits()).toBe(2); // seed (REST) + bu akış
      expect(
        await t.model('AiChatMessage').countDocuments({
          conversationId: new Types.ObjectId(conversationId),
        }),
      ).toBe(4);
    });

    it('CHT-16: [mock:error503] → event:error AI_UNAVAILABLE, kredi ve kayıt yok (iki rota)', async () => {
      const { user, userId, credits, debits } = await setup();
      const conversationId = await seedConversation(user.accessToken);
      const before = await credits();
      const debitsBefore = await debits();
      const messagesBefore = await t
        .model('AiChatMessage')
        .countDocuments({ userId });

      const bodies = await Promise.all([
        createStream(user.accessToken, { firstMessage: 'x [mock:error503]' }),
        rawSse(
          request(t.http)
            .post(`/v1/ai/chat/conversations/${conversationId}/messages/stream`)
            .set(bearer(user.accessToken))
            .send({ message: 'y [mock:error503]' }),
        ),
      ]);
      for (const res of bodies) {
        const events = parseSse(res.body as string);
        expect(events.map((e) => e.event)).toEqual(['error']);
        expect(events[0].data).toMatchObject({ code: 'AI_UNAVAILABLE' });
        expect(events[0].data.requestId).toBeTruthy();
      }
      expect(await credits()).toBe(before);
      expect(await debits()).toBe(debitsBefore);
      expect(await t.model('AiChatMessage').countDocuments({ userId })).toBe(
        messagesBefore,
      );
    });

    it('CHT-14: bakiye 0 → akış başlamadan düz JSON 403 AI_CREDIT_INSUFFICIENT (iki rota)', async () => {
      const { user, userId } = await setup();
      const conversationId = await seedConversation(user.accessToken);
      await t
        .model('AiCreditWallet')
        .updateOne({ userId }, { $set: { grantCredits: 0, balance: 0 } });

      const a = await createStream(user.accessToken, {
        firstMessage: 'kredi yok',
      }).expect(403);
      const b = await rawSse(
        request(t.http)
          .post(`/v1/ai/chat/conversations/${conversationId}/messages/stream`)
          .set(bearer(user.accessToken))
          .send({ message: 'kredi yok' }),
      ).expect(403);
      for (const res of [a, b]) {
        expect(res.headers['content-type']).toMatch(/application\/json/);
        expect(res.body).toBeDefined();
      }
    });

    it('CHT-21: akış sürerken bakiye tükenirse → event:error AI_CREDIT_INSUFFICIENT, kredi/mesaj kalmaz', async () => {
      const { user, userId, debits } = await setup();
      const release = gateStreams();
      const pending = createStream(user.accessToken, {
        firstMessage: 'yarış',
      }).then((r) => r);
      // erişim kontrolü geçti, LLM çağrısı kapıda bekliyor
      await new Promise((r) => setTimeout(r, 300));
      await t
        .model('AiCreditWallet')
        .updateOne({ userId }, { $set: { grantCredits: 0, balance: 0 } });
      release();

      const events = parseSse((await pending).body as string);
      const last = events.at(-1)!;
      expect(last.event).toBe('error');
      expect(last.data).toMatchObject({ code: 'AI_CREDIT_INSUFFICIENT' });
      expect(events.some((e) => e.event === 'done')).toBe(false);
      expect(await debits()).toBe(0);
      expect(await t.model('AiChatMessage').countDocuments({ userId })).toBe(0);
    });

    it('A-11: clientMessageId tekrarı (iki rota) → token + done yeniden oynatılır, LLM/kredi yok', async () => {
      const { user, credits } = await setup();
      const conversationId = await seedConversation(user.accessToken);
      const clientMessageId = randomUUID();
      const stream = () =>
        rawSse(
          request(t.http)
            .post(`/v1/ai/chat/conversations/${conversationId}/messages/stream`)
            .set(bearer(user.accessToken))
            .send({ message: 'tekrar', clientMessageId }),
        ).expect(201);

      const first = parseSse((await stream()).body as string);
      const before = await credits();
      const calls = ai.calls.length;
      const replay = parseSse((await stream()).body as string);

      expect(replay.map((e) => e.event)).toEqual(['token', 'done']);
      expect(replay[0].data).toEqual({ delta: first.at(-1)!.data.content });
      expect(replay[1].data).toMatchObject({
        messageId: first.at(-1)!.data.messageId,
        content: first.at(-1)!.data.content,
      });
      expect(ai.calls.length).toBe(calls);
      expect(await credits()).toBe(before);
    });

    it('CHT-18: istemci akış ortasında kopar → çökme yok, kayıt ve kesim yok, sonra kredi tek düşer', async () => {
      const { user, userId, credits, debits } = await setup();
      const before = await credits();
      const release = gateStreams();

      await new Promise<void>((resolve, reject) => {
        const req = http.request(
          {
            port,
            host: '127.0.0.1',
            method: 'POST',
            path: '/v1/ai/chat/conversations/stream',
            headers: {
              'content-type': 'application/json',
              ...bearer(user.accessToken),
            },
          },
          (res) => {
            // başlıklar geldi (akış açıldı) → bağlantıyı kopar
            res.on('error', () => undefined);
            res.destroy();
            req.destroy();
            resolve();
          },
        );
        req.on('error', () => resolve());
        req.on('timeout', () => reject(new Error('timeout')));
        req.end(JSON.stringify({ firstMessage: 'kopacak akış' }));
      });
      await new Promise((r) => setTimeout(r, 200)); // sunucu 'close' görsün
      release();
      await new Promise((r) => setTimeout(r, 500)); // akış kendini bitirsin

      expect(await debits()).toBe(0);
      expect(await t.model('AiChatMessage').countDocuments({ userId })).toBe(0);
      expect(await t.model('AiConversation').countDocuments({ userId })).toBe(
        0,
      );
      expect(await credits()).toBe(before);
      await request(t.http).get('/health').expect(200);

      // kopuk akış kredi yakmadı; yeni akış tam bir kez düşer
      ai.reset();
      jest.restoreAllMocks();
      await createStream(user.accessToken, { firstMessage: 'normal' }).expect(
        201,
      );
      expect(await debits()).toBe(1);
    });
  });

  describe('WebSocket /ai-progress', () => {
    let client: Socket;
    afterEach(() => {
      client?.close();
    });

    const open = () =>
      new Promise<Socket>((resolve, reject) => {
        const s = connect(`http://127.0.0.1:${port}/ai-progress`, {
          transports: ['websocket'],
          forceNew: true,
        });
        s.on('connect', () => resolve(s));
        s.on('connect_error', reject);
      });

    it('WA-01: rehber isteğinde socketId → o sokete ai:step adımları (diğer sokete gitmez)', async () => {
      const user = await signIn(t.http, { sub: `e2e-ws-${randomUUID()}` });
      for (let i = 0; i < 3; i++)
        await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      client = await open();
      const other = await open();
      const steps: { key: string; message: string }[] = [];
      const otherSteps: unknown[] = [];
      client.on('ai:step', (s: { key: string; message: string }) =>
        steps.push(s),
      );
      other.on('ai:step', (s) => otherSteps.push(s));

      await request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          freeText: 'huzur',
          flowId: randomUUID(),
          socketId: client.id,
        })
        .expect(201);
      await new Promise((r) => setTimeout(r, 200));

      const keys = steps.map((s) => s.key);
      expect(keys[0]).toBe('analyzing');
      expect(keys).toContain('finalizing');
      expect(steps.every((s) => s.message.length > 0)).toBe(true);
      expect(otherSteps).toEqual([]);
      other.close();
    });

    it('WA-02: sohbet akışında socketId → ai-chat:step', async () => {
      const user = await signIn(t.http, { sub: `e2e-ws-${randomUUID()}` });
      client = await open();
      const steps: { key: string }[] = [];
      client.on('ai-chat:step', (s: { key: string }) => steps.push(s));

      await createStream(user.accessToken, {
        firstMessage: 'adım testi',
        socketId: client.id,
      }).expect(201);
      await new Promise((r) => setTimeout(r, 200));

      expect(steps.length).toBeGreaterThan(0);
      expect(steps[0].key).toBe('creating');
    });

    it('WA-05: bağlı olmayan socketId → sessiz, istek başarılı', async () => {
      const user = await signIn(t.http, { sub: `e2e-ws-${randomUUID()}` });
      await createStream(user.accessToken, {
        firstMessage: 'hayalet soket',
        socketId: 'bagli-degil-123',
      }).expect(201);
    });

    it('WA-03: bağlantı kimliksiz kabul edilir (token gerekmez)', async () => {
      client = await open();
      expect(client.connected).toBe(true);
    });
  });
});
