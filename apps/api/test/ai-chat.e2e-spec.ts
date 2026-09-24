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

  // BULGU/gözlem: MockAiRuntimeService.classify() modu SABİT 'chat' döner
  // (bkz. ai-mocks.ts generate()) — mock ile 'bilgi' modu (pasaj araması,
  // knowledgeAnswerSchema) HTTP üzerinden hiçbir zaman tetiklenemez. Bu test
  // yalnızca gözlenen davranışı belgeler: varsayılan mock her zaman sohbet
  // (mode:'chat') moduna düşer, coverage/sourceCitations boş kalır.
  it("BULGU: mock her zaman mode='chat' döner, coverage boş — 'bilgi' modu mock ile tetiklenemez", async () => {
    const { user } = await setup();
    const res = await request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send({ firstMessage: 'Efendimizin sünnetiyle ilgili bir hadis var mı?' })
      .expect(201);
    const assistant = data<{
      messages: { mode?: string; coverage?: unknown }[];
    }>(res).messages[1];
    expect(assistant.mode).toBe('chat');
    expect(assistant.coverage).toBeFalsy();
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
});
