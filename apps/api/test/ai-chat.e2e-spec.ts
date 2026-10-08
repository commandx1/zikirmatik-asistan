/**
 * AI Sohbet (ai-chat) e2e — REST konuşma/mesaj akışı, kredi düşümü, 503
 * filtresi (konuşma yaratılmaz), sahiplik kontrolü. Stream uçları (SSE)
 * @Res() ile manuel yazıldığı için burada yalnız REST uçları test edilir.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { Types } from 'mongoose';
import request from 'supertest';
import { AiRuntimeService } from '../src/modules/ai/ai-runtime.service';
import { MockAiRuntimeService } from '../src/modules/ai/testing/ai-mocks';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('AI Sohbet (e2e)', () => {
  let t: TestApp;
  let ai: MockAiRuntimeService;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    ai = t.app.get(AiRuntimeService);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
    ai.reset();
  });

  afterAll(async () => {
    await t?.close();
  });

  async function setup() {
    const user = await signIn(t.http, { sub: `e2e-chat-${randomUUID()}` });
    const credits = () =>
      request(t.http)
        .get('/v1/ai/credits')
        .set(bearer(user.accessToken))
        .expect(200)
        .then((res) => data<{ balance: number }>(res).balance);
    return { user, credits };
  }

  it('başarı: konuşma + 2 mesaj (user+assistant) + CHAT_MESSAGE_DEBIT ledger, kredi -1', async () => {
    const { user, credits } = await setup();
    const before = await credits();

    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'Selamün aleyküm, huzur bulmak istiyorum' })
      .expect(201);

    const body = data<{
      conversation: { _id: string };
      messages: { role: string; content: string }[];
    }>(res);
    expect(body.messages).toHaveLength(2);
    expect(body.messages[0]).toMatchObject({ role: 'user' });
    expect(body.messages[1]).toMatchObject({
      role: 'assistant',
      content: 'Mock yanıt.',
    });

    expect(await credits()).toBe(before - 1);
    const ledgerCount = await t.model('AiCreditLedger').countDocuments({
      userId: new Types.ObjectId(user.userId),
      reason: 'CHAT_MESSAGE_DEBIT',
    });
    expect(ledgerCount).toBe(1);

    const conversationCount = await t
      .model('AiConversation')
      .countDocuments({ userId: new Types.ObjectId(user.userId) });
    expect(conversationCount).toBe(1);
  });

  it('error503: konuşma yaratılmaz, kredi düşmez', async () => {
    const { user, credits } = await setup();
    const before = await credits();
    ai.setMode('error503');

    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'merhaba' })
      .expect(503);
    expect(res.body).toMatchObject({ code: 'AI_UNAVAILABLE' });

    expect(await credits()).toBe(before);
    const conversationCount = await t
      .model('AiConversation')
      .countDocuments({ userId: new Types.ObjectId(user.userId) });
    expect(conversationCount).toBe(0);
  });

  it('başkasının konuşmasına mesaj → 404', async () => {
    const { user: owner } = await setup();
    const { user: intruder } = await setup();

    const created = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(owner.accessToken))
      .send({ firstMessage: 'ilk mesaj' })
      .expect(201);
    const conversationId = data<{ conversation: { _id: string } }>(created)
      .conversation._id;

    await request(t.http)
      .post(`/v1/ai/chat/conversations/${conversationId}/messages`)
      .set(bearer(intruder.accessToken))
      .send({ message: 'başkasının konuşmasına yazıyorum' })
      .expect(404);
  });

  it('sendMessage: ikinci mesaj konuşmaya eklenir, yeni kredi düşer', async () => {
    const { user, credits } = await setup();
    const created = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'ilk mesaj' })
      .expect(201);
    const conversationId = data<{ conversation: { _id: string } }>(created)
      .conversation._id;
    const afterFirst = await credits();

    const res = await request(t.http)
      .post(`/v1/ai/chat/conversations/${conversationId}/messages`)
      .set(bearer(user.accessToken))
      .send({ message: 'ikinci mesaj' })
      .expect(201);
    expect(data<{ reply: { content: string } }>(res).reply.content).toBe(
      'Mock yanıt.',
    );
    expect(await credits()).toBe(afterFirst - 1);

    const messageCount = await t
      .model('AiChatMessage')
      .countDocuments({ conversationId: new Types.ObjectId(conversationId) });
    expect(messageCount).toBe(4);
  });

  it('bilgi modu: kaynak pasajı atıfı ve coverage HTTP yanıtında döner', async () => {
    const { user } = await setup();
    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'Sabah duası nedir? [mock:bilgi]' })
      .expect(201);
    const assistant = data<{
      messages: {
        mode?: string;
        coverage?: string;
        content: string;
        sourceCitations?: {
          sourceTitle: string;
          pageStart: number;
          pageEnd: number;
        }[];
      }[];
    }>(res).messages[1];
    expect(assistant.mode).toBe('bilgi');
    expect(assistant.coverage).toBe('full');
    expect(assistant.content).toBe('Mock bilgi yanıtı.');
    expect(assistant.sourceCitations).toEqual([
      expect.objectContaining({
        sourceTitle: 'Mock Kaynak',
        pageStart: 12,
        pageEnd: 13,
      }),
    ]);
  });

  it("varsayılan mesaj: mode='chat', coverage boş, atıf yok", async () => {
    const { user } = await setup();
    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'Efendimizin sünnetiyle ilgili bir hadis var mı?' })
      .expect(201);
    const assistant = data<{
      messages: {
        mode?: string;
        coverage?: unknown;
        sourceCitations?: unknown[];
      }[];
    }>(res).messages[1];
    expect(assistant.mode).toBe('chat');
    expect(assistant.coverage).toBeFalsy();
    expect(assistant.sourceCitations ?? []).toEqual([]);
  });

  it('GET /v1/ai/chat/conversations ve /messages listeleri', async () => {
    const { user } = await setup();
    const created = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'ilk mesaj' })
      .expect(201);
    const conversationId = data<{ conversation: { _id: string } }>(created)
      .conversation._id;

    const list = await request(t.http)
      .get('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(
      data<{ items: { _id: string }[] } | { _id: string }[]>(list),
    ).toBeTruthy();

    const messages = await request(t.http)
      .get(`/v1/ai/chat/conversations/${conversationId}/messages`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data(messages)).toBeTruthy();
  });
  // ── QA: CRD-12/CHT-21 eşzamanlı tükenme, A-11 istemci mesaj anahtarı, B16 ──
  const sse = (req: request.Test) =>
    req.buffer(true).parse((res, cb) => {
      let body = '';
      res.on('data', (chunk: Buffer) => (body += chunk.toString()));
      res.on('end', () => cb(null, body));
    });
  const sseEvent = (raw: string, name: string) => {
    const block = raw
      .split('\n\n')
      .find((b) => b.startsWith(`event: ${name}\n`));
    return block
      ? (JSON.parse(block.split('\ndata: ')[1]) as Record<string, unknown>)
      : undefined;
  };

  it('CRD-12/CHT-21/B9: bakiye 1, iki eşzamanlı mesaj → biri 201, diğeri 403 ve İÇERİK KALMAZ', async () => {
    const { user, credits } = await setup();
    await credits(); // cüzdan + bugünkü grant
    const userId = new Types.ObjectId(user.userId);
    await t
      .model('AiCreditWallet')
      .updateOne({ userId }, { $set: { grantCredits: 1, balance: 1 } });

    const results = await Promise.all(
      ['birinci', 'ikinci'].map((text) =>
        request(t.http)
          .post('/v1/ai/chat/conversations')
          .set(bearer(user.accessToken))
          .send({ firstMessage: text }),
      ),
    );
    // Tek-uçuş kirası: üst üste binen ikinci istek 429; binmezse bakiye 403.
    expect([
      [201, 403],
      [201, 429],
    ]).toContainEqual(results.map((r) => r.status).sort());
    expect(await t.model('AiConversation').countDocuments({ userId })).toBe(1);
    expect(await t.model('AiChatMessage').countDocuments({ userId })).toBe(2);
    expect(
      await t
        .model('AiCreditLedger')
        .countDocuments({ userId, reason: 'CHAT_MESSAGE_DEBIT' }),
    ).toBe(1);
    expect(await credits()).toBe(0);
  });

  it('B16/CHT-10: yalnız boşluk mesaj → 400, kredi düşmez', async () => {
    const { user, credits } = await setup();
    const before = await credits();
    await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: '   \n\t ' })
      .expect(400);
    const created = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'ilk' })
      .expect(201);
    const conversationId = data<{ conversation: { _id: string } }>(created)
      .conversation._id;
    await request(t.http)
      .post(`/v1/ai/chat/conversations/${conversationId}/messages`)
      .set(bearer(user.accessToken))
      .send({ message: '    ' })
      .expect(400);
    expect(await credits()).toBe(before - 1);
  });

  it('A-11: konuşma oluşturma aynı clientMessageId ile tekrar → aynı yanıt, ikinci kredi/konuşma/LLM yok', async () => {
    const { user, credits } = await setup();
    const before = await credits();
    const clientMessageId = randomUUID();
    const send = () =>
      request(t.http)
        .post('/v1/ai/chat/conversations')
        .set(bearer(user.accessToken))
        .send({ firstMessage: 'tekrar gelen soru', clientMessageId })
        .expect(201);
    type Body = {
      conversation: { _id: string };
      messages: { id: string; role: string }[];
    };
    const first = data<Body>(await send());
    const callsAfterFirst = ai.calls.length;
    const second = data<Body>(await send());

    expect(second.conversation._id).toBe(first.conversation._id);
    expect(second.messages.map((m) => m.id)).toEqual(
      first.messages.map((m) => m.id),
    );
    expect(ai.calls.length).toBe(callsAfterFirst);
    expect(await credits()).toBe(before - 1);
    const userId = new Types.ObjectId(user.userId);
    expect(await t.model('AiConversation').countDocuments({ userId })).toBe(1);
    expect(await t.model('AiChatMessage').countDocuments({ userId })).toBe(2);
  });

  it('A-11: sendMessage aynı clientMessageId (ardışık + eşzamanlı) → tek mesaj çifti, tek kredi; farklı metin → 409', async () => {
    const { user, credits } = await setup();
    const created = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'ilk' })
      .expect(201);
    const conversationId = data<{ conversation: { _id: string } }>(created)
      .conversation._id;
    const before = await credits();
    const clientMessageId = randomUUID();
    const send = (message = 'ikinci mesaj') =>
      request(t.http)
        .post(`/v1/ai/chat/conversations/${conversationId}/messages`)
        .set(bearer(user.accessToken))
        .send({ message, clientMessageId });

    const results = await Promise.all([send(), send()]);
    // Tek-uçuş kirası: üst üste binen kopya 429; binmezse kayıtlı tur 201.
    expect([
      [201, 201],
      [201, 429],
    ]).toContainEqual(results.map((r) => r.status).sort());
    const [a, ...rest] = results.filter((r) => r.status === 201);
    const c = await send().expect(201);
    type Body = { reply: { id: string }; message: { id: string } };
    for (const b of rest)
      expect(data<Body>(b).reply.id).toBe(data<Body>(a).reply.id);
    expect(data<Body>(c).reply.id).toBe(data<Body>(a).reply.id);
    expect(data<Body>(c).message.id).toBe(data<Body>(a).message.id);

    expect(await credits()).toBe(before - 1);
    expect(
      await t
        .model('AiChatMessage')
        .countDocuments({ conversationId: new Types.ObjectId(conversationId) }),
    ).toBe(4);

    const conflict = await send('başka metin').expect(409);
    expect(conflict.body).toMatchObject({ code: 'CLIENT_MESSAGE_ID_CONFLICT' });
  });

  it('A-11: SSE aynı clientMessageId ile tekrar → kayıtlı yanıt token+done olarak yeniden oynatılır, kredi düşmez', async () => {
    const { user, credits } = await setup();
    const before = await credits();
    const clientMessageId = randomUUID();
    const stream = () =>
      sse(
        request(t.http)
          .post('/v1/ai/chat/conversations/stream')
          .set(bearer(user.accessToken))
          .send({ firstMessage: 'akış sorusu', clientMessageId }),
      ).expect(201);

    const first = sseEvent((await stream()).body as string, 'done');
    expect(first?.messageId).toBeTruthy();
    const callsAfterFirst = ai.calls.length;

    const replayRaw = (await stream()).body as string;
    const replay = sseEvent(replayRaw, 'done');
    expect(sseEvent(replayRaw, 'token')).toEqual({ delta: first?.content });
    expect(replay).toMatchObject({
      messageId: first?.messageId,
      conversationId: first?.conversationId,
      content: first?.content,
    });
    expect(ai.calls.length).toBe(callsAfterFirst);
    expect(await credits()).toBe(before - 1);
  });
});
