/**
 * AI Rehber e2e — sahte LLM (MockAiRuntimeService) ile gerçek tool döngüsü,
 * kredi akışı ve 503 filtresi. Kalan senaryolar (toolLoop/clarify/timeout/
 * noOutcome, chat) Faz 3'te.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { Logger } from '@nestjs/common';
import { Types } from 'mongoose';
import request from 'supertest';
import { AiProgressGateway } from '../src/modules/ai/ai-progress.gateway';
import { AiRuntimeService } from '../src/modules/ai/ai-runtime.service';
import {
  MockAiRuntimeService,
  MockEmbeddingService,
} from '../src/modules/ai/testing/ai-mocks';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import {
  FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
  PREMIUM_MONTHLY_CREDIT_AMOUNT,
  VIRD_PROGRAM_CREDIT_COST,
} from '../src/modules/ai/credits.constants';
import {
  User,
  type UserDocument,
} from '../src/modules/users/schemas/user.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  makePremium,
  seedDhikr,
  signIn,
} from './helpers/fixtures';

// ForbiddenException({code,message}) hem düz {code,message} hem de Nest'in
// varsayılan {statusCode,message:{code,message}} sarmalamasıyla dönebilir —
// ikisini de tek yerde tip güvenli çözer.
type ErrorBody = { code?: string; message?: string | { code?: string } };
function errCode(res: { body: unknown }): string | undefined {
  const body = res.body as ErrorBody;
  return (
    body.code ??
    (typeof body.message === 'object' ? body.message?.code : undefined)
  );
}
function errMessage(res: { body: unknown }): string | undefined {
  const body = res.body as ErrorBody;
  return typeof body.message === 'string' ? body.message : undefined;
}

describe('AI (e2e)', () => {
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
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const credits = () =>
      request(t.http)
        .get('/v1/ai/credits')
        .set(bearer(user.accessToken))
        .expect(200)
        .then((res) => data<{ balance: number }>(res).balance);
    const recommend = (freeText = 'içim daralıyor') =>
      request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({ userId: user.userId, freeText, flowId: randomUUID() });
    const debits = () =>
      t.model('AiCreditLedger').countDocuments({
        userId: new Types.ObjectId(user.userId),
        reason: 'RECOMMENDATION_DEBIT',
      });
    return { credits, recommend, debits };
  }

  it('başarı: tool döngüsü öneri döner, 1 kredi düşer', async () => {
    const { credits, recommend, debits } = await setup();
    expect(await credits()).toBe(FREE_SIGNUP_BONUS_CREDIT_AMOUNT);

    const res = await recommend().expect(201);
    const body = data<{ items: unknown[]; remainingCredits: number }>(res);
    expect(body.items.length).toBeGreaterThan(0);
    expect(body.remainingCredits).toBe(FREE_SIGNUP_BONUS_CREDIT_AMOUNT - 1);
    expect(await credits()).toBe(FREE_SIGNUP_BONUS_CREDIT_AMOUNT - 1);
    expect(await debits()).toBe(1);
    expect(ai.calls).toEqual(['expand', 'select']);
  });

  it('503: sağlayıcı hatası → AI_UNAVAILABLE, kredi düşmez', async () => {
    const { credits, recommend, debits } = await setup();
    const before = await credits();
    ai.setMode('error503');

    const res = await recommend().expect(503);
    expect(res.body).toMatchObject({
      code: 'AI_UNAVAILABLE',
      reason: 'provider_error',
    });
    expect(await credits()).toBe(before);
    expect(await debits()).toBe(0);
    // non-retryable → withAiRetry tekrar denemez.
    expect(ai.calls).toEqual(['expand']);
  });

  it('istek metnindeki [mock:error503] işareti (canlı sunucu yolu) → 503, kredi düşmez', async () => {
    const { credits, recommend, debits } = await setup();
    const before = await credits();

    const res = await recommend('içim daralıyor [mock:error503]').expect(503);
    expect(res.body).toMatchObject({ code: 'AI_UNAVAILABLE' });
    expect(await credits()).toBe(before);
    expect(await debits()).toBe(0);
  });

  it('aynı flowId tekrar → idempotent, kredi tekrar düşmez', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const flowId = randomUUID();
    const send = () =>
      request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({ userId: user.userId, freeText: 'huzur istiyorum', flowId });

    const first = await send().expect(201);
    const second = await send().expect(201);
    expect(data<{ remainingCredits: number }>(second).remainingCredits).toBe(
      data<{ remainingCredits: number }>(first).remainingCredits,
    );
    const debits = await t.model('AiCreditLedger').countDocuments({
      userId: new Types.ObjectId(user.userId),
      reason: 'RECOMMENDATION_DEBIT',
      flowId,
    });
    expect(debits).toBe(1);
  });

  it('aynı flowId farklı freeText → 403 (istek içeriği uyuşmuyor)', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const flowId = randomUUID();

    await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText: 'huzur istiyorum', flowId })
      .expect(201);

    await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText: 'başka bir istek', flowId })
      .expect(403);
  });

  it('yeni kullanıcı 3 kredi: 3 flow sonra 4. → 403 AI_CREDIT_INSUFFICIENT', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const send = () =>
      request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({
          userId: user.userId,
          freeText: `istek ${randomUUID()}`,
          flowId: randomUUID(),
        });

    for (let i = 0; i < FREE_SIGNUP_BONUS_CREDIT_AMOUNT; i++) {
      await send().expect(201);
    }
    const res = await send().expect(403);
    expect(errCode(res)).toBe('AI_CREDIT_INSUFFICIENT');
  });

  it('premium: balance PREMIUM_MONTHLY_CREDIT_AMOUNT', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    await makePremium(t.model<UserDocument>(User.name), user.userId);

    const res = await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ balance: number; isPremium: boolean }>(res)).toMatchObject({
      balance: PREMIUM_MONTHLY_CREDIT_AMOUNT,
      isPremium: true,
    });
  });

  it('timeout: 503 reason timeout, 2 deneme, kredi düşmez', async () => {
    const { credits, recommend, debits } = await setup();
    const before = await credits();
    ai.setMode('timeout');

    const res = await recommend().expect(503);
    expect(res.body).toMatchObject({
      code: 'AI_UNAVAILABLE',
      reason: 'timeout',
    });
    expect(await credits()).toBe(before);
    expect(await debits()).toBe(0);
    expect(ai.calls.length).toBe(2);
  });

  it('toolLoop: 201, calls searchDhikrs sonra selectRecommendations sırası', async () => {
    const { recommend } = await setup();
    ai.setMode('toolLoop');

    const res = await recommend().expect(201);
    expect(data<{ items: unknown[] }>(res).items.length).toBeGreaterThan(0);
    expect(ai.calls[0]).toBe('expand');
    expect(ai.calls.slice(1).every((kind) => kind === 'select')).toBe(true);
    expect(ai.calls.length).toBeGreaterThanOrEqual(3);
  });

  it('clarify: 201 kind clarification, items 0, kredi düşmez', async () => {
    const { credits, recommend, debits } = await setup();
    const before = await credits();
    ai.setMode('clarify');

    const res = await recommend().expect(201);
    const body = data<{
      kind: string;
      message: string;
      items: unknown[];
    }>(res);
    expect(body).toMatchObject({
      kind: 'clarification',
      message: 'Mock soru?',
    });
    expect(body.items).toHaveLength(0);
    expect(await credits()).toBe(before);
    expect(await debits()).toBe(0);
  });

  it('noOutcome: 503 invalid_output, kredi düşmez', async () => {
    const { credits, recommend, debits } = await setup();
    const before = await credits();
    ai.setMode('noOutcome');

    const res = await recommend().expect(503);
    expect(res.body).toMatchObject({
      code: 'AI_UNAVAILABLE',
      reason: 'invalid_output',
    });
    expect(await credits()).toBe(before);
    expect(await debits()).toBe(0);
  });

  it('Accept-Language: en → 503 mesajı İngilizce (tr varsayılan)', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    ai.setMode('error503');

    const trRes = await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText: 'x', flowId: randomUUID() })
      .expect(503);
    expect(errMessage(trRes)).toMatch(/Kredin düşülmedi/);

    const enRes = await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .set('Accept-Language', 'en')
      .send({ userId: user.userId, freeText: 'y', flowId: randomUUID() })
      .expect(503);
    expect(errMessage(enRes)).toMatch(/No credit was charged/);
  });

  it('GET /quota, GET /recommendations, PATCH /recommendations/:id/select happy path', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);

    const res = await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText: 'huzur', flowId: randomUUID() })
      .expect(201);
    const body = data<{ recommendationId: string; recommendedIds: string[] }>(
      res,
    );

    const quota = await request(t.http)
      .get('/v1/ai/quota')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ isPremium: boolean }>(quota)).toHaveProperty('isPremium');

    const list = await request(t.http)
      .get('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(Array.isArray(data(list))).toBe(true);

    const select = await request(t.http)
      .patch(`/v1/ai/recommendations/${body.recommendationId}/select`)
      .set(bearer(user.accessToken))
      .send({ selectedDhikrId: body.recommendedIds[0] })
      .expect(200);
    expect(data<{ selectedDhikrId: string }>(select).selectedDhikrId).toBe(
      body.recommendedIds[0],
    );
  });

  it('socketId verildiğinde AiProgressGateway.emitStep çağrılır', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const spy = jest
      .spyOn(t.app.get(AiProgressGateway), 'emitStep')
      .mockImplementation(() => undefined);

    await request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        freeText: 'huzur',
        flowId: randomUUID(),
        socketId: 'sock-123',
      })
      .expect(201);

    expect(spy).toHaveBeenCalledWith(
      'sock-123',
      expect.any(String),
      expect.any(String),
    );
    spy.mockRestore();
  });

  it('B9: bakiye 1, iki eşzamanlı öneri (farklı flowId) → biri 201, diğeri 403, tek öneri belgesi', async () => {
    const { credits, recommend } = await setup();
    await credits(); // cüzdan oluşsun
    const me = await t.model('User').findOne().lean();
    const userId = me!._id;
    await t
      .model('AiCreditWallet')
      .updateOne({ userId }, { $set: { grantCredits: 1, balance: 1 } });

    const results = await Promise.all([
      recommend('birinci istek'),
      recommend('ikinci istek'),
    ]);
    // Tek-uçuş kirası: üst üste binen ikinci istek 429; binmezse bakiye 403.
    expect([
      [201, 403],
      [201, 429],
    ]).toContainEqual(results.map((r) => r.status).sort());
    expect(await t.model('AiRecommendation').countDocuments({ userId })).toBe(
      1,
    );
    expect(await credits()).toBe(0);
  });

  it('B9: bakiye 3, iki eşzamanlı AI vird programı → biri 201, diğeri 403, tek program belgesi', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (const nameArabic of ['سبحان الله', 'الحمد لله', 'الله أكبر'])
      await seedDhikr(dhikrModel, { nameArabic });
    const userId = new Types.ObjectId(user.userId);
    await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    await t.model('AiCreditWallet').updateOne(
      { userId },
      {
        $set: {
          grantCredits: VIRD_PROGRAM_CREDIT_COST,
          balance: VIRD_PROGRAM_CREDIT_COST,
        },
      },
    );
    const create = (freeText: string) =>
      request(t.http)
        .post('/v1/ai/vird-programs')
        .set(bearer(user.accessToken))
        .send({
          flowId: randomUUID(),
          freeText,
          durationDays: 7,
          slots: ['morning', 'evening'],
        });

    const results = await Promise.all([
      create('sabah zikirleri'),
      create('akşam zikirleri'),
    ]);
    // Tek-uçuş kirası: üst üste binen ikinci istek 429; binmezse bakiye 403.
    expect([
      [201, 403],
      [201, 429],
    ]).toContainEqual(results.map((r) => r.status).sort());
    expect(await t.model('VirdProgram').countDocuments({ userId })).toBe(1);
  });

  it('POST /v1/ai/vird-programs: ücretsiz kullanıcı 3 kredisiyle program üretir, 3 kredi düşer, activate çalışır (ürün kuralı: premium kapısı yok)', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    // Farklı nameArabic: aday havuzu canonicalKey ile dedupe edilir.
    for (const nameArabic of ['سبحان الله', 'الحمد لله', 'الله أكبر'])
      await seedDhikr(dhikrModel, { nameArabic });

    // ÜRÜN KURALI (2026-09-12): AI program üretimi herkese açık, maliyeti
    // VIRD_PROGRAM_CREDIT_COST (3) kredi. Ücretsiz kullanıcının 3 kredilik
    // signup bonusu bunu karşılar — premium kapısı bilerek yok.
    const res = await request(t.http)
      .post('/v1/ai/vird-programs')
      .set(bearer(user.accessToken))
      .send({
        flowId: randomUUID(),
        freeText: 'sabah zikirleri',
        durationDays: 7,
        slots: ['morning', 'evening'],
      })
      .expect(201);

    const body = data<{
      kind: string;
      programId: string;
      remainingCredits: number;
      program: {
        durationDays: number;
        phases: Array<{
          fromDay: number;
          toDay: number;
          slots: Record<string, Array<{ dhikrId: string; target: number }>>;
        }>;
      };
    }>(res);
    expect(body.kind).toBe('program');
    expect(body.remainingCredits).toBe(
      FREE_SIGNUP_BONUS_CREDIT_AMOUNT - VIRD_PROGRAM_CREDIT_COST,
    );
    expect(body.program.durationDays).toBe(7);
    expect(body.program.phases).toHaveLength(1);
    expect(body.program.phases[0]).toMatchObject({ fromDay: 1, toDay: 7 });
    expect(Object.keys(body.program.phases[0].slots).sort()).toEqual([
      'evening',
      'morning',
    ]);
    expect(body.program.phases[0].slots.morning).toHaveLength(2);
    expect(ai.calls).toEqual(['expand', 'program']);
    expect(
      await t.model('AiCreditLedger').countDocuments({
        userId: new Types.ObjectId(user.userId),
        reason: 'VIRD_PROGRAM_DEBIT',
      }),
    ).toBe(1);

    await request(t.http)
      .post(`/v1/vird/programs/${body.programId}/activate`)
      .set(bearer(user.accessToken))
      .expect(201);
    const program = await request(t.http)
      .get(`/v1/vird/programs/${body.programId}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ status: string }>(program).status).toBe('active');
  });

  it("mock NODE_ENV=production'da fırlatır", () => {
    const original = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    try {
      expect(() => new MockEmbeddingService({} as never)).toThrow(
        "AI mock prod'da açılamaz",
      );
    } finally {
      process.env.NODE_ENV = original;
    }
  });
  // ── QA: CRD-11/13 eşzamanlılık, A-08 aylık kredi taşıma (gerçek Mongo) ──
  it('CRD-13/B8: cüzdanı olmayan kullanıcının eşzamanlı ilk istekleri 500 vermez, tek cüzdan', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const results = await Promise.all(
      Array.from({ length: 6 }, () =>
        request(t.http).get('/v1/ai/credits').set(bearer(user.accessToken)),
      ),
    );
    expect(results.map((r) => r.status)).toEqual(Array(6).fill(200));
    for (const r of results) {
      expect(data<{ balance: number }>(r).balance).toBe(
        FREE_SIGNUP_BONUS_CREDIT_AMOUNT,
      );
    }
    const userId = new Types.ObjectId(user.userId);
    expect(await t.model('AiCreditWallet').countDocuments({ userId })).toBe(1);
    expect(
      await t
        .model('AiCreditLedger')
        .countDocuments({ userId, reason: 'FREE_DAILY_GRANT' }),
    ).toBe(1);
  });

  it('CRD-11: aynı flowId ile iki eşzamanlı öneri → tek ledger satırı, tek kesim', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    for (let i = 0; i < 3; i++) await seedDhikr(dhikrModel);
    const flowId = randomUUID();
    const send = () =>
      request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({ userId: user.userId, freeText: 'aynı istek', flowId });
    const results = await Promise.all([send(), send()]);
    // Tek-uçuş kirası: üst üste binen kopya 429; binmezse kayıtlı öneri 201.
    expect([
      [201, 201],
      [201, 429],
    ]).toContainEqual(results.map((r) => r.status).sort());
    const userId = new Types.ObjectId(user.userId);
    expect(
      await t
        .model('AiCreditLedger')
        .countDocuments({ userId, reason: 'RECOMMENDATION_DEBIT' }),
    ).toBe(1);
    const balance = await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ balance: number }>(balance).balance).toBe(
      FREE_SIGNUP_BONUS_CREDIT_AMOUNT - 1,
    );
  });

  it('A-08: premium bitince kalan aylık kredi ay sonuna kadar kalır; aynı ay yeniden abonelikte geri gelir (çift grant yok)', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    const userModel = t.model<UserDocument>(User.name);
    const credits = () =>
      request(t.http)
        .get('/v1/ai/credits')
        .set(bearer(user.accessToken))
        .expect(200)
        .then((res) => data<{ balance: number }>(res).balance);
    const chat = (text: string) =>
      request(t.http)
        .post('/v1/ai/chat/conversations')
        .set(bearer(user.accessToken))
        .send({ firstMessage: text })
        .expect(201);

    await makePremium(userModel, user.userId);
    expect(await credits()).toBe(PREMIUM_MONTHLY_CREDIT_AMOUNT);
    await chat('bir');
    await chat('iki');
    const remaining = PREMIUM_MONTHLY_CREDIT_AMOUNT - 2;

    // Premium bitti (aynı ay): kalan aylık hak silinmez.
    await userModel.updateOne(
      { _id: user.userId },
      { $set: { isPremium: false } },
    );
    expect(await credits()).toBe(remaining);

    // Ertesi ücretsiz gün (aynı ay): hâlâ silinmez.
    const userId = new Types.ObjectId(user.userId);
    await t
      .model('AiCreditWallet')
      .updateOne({ userId }, { $set: { grantCycleKey: '2000-01-01' } });
    await t
      .model('AiCreditLedger')
      .deleteMany({ userId, reason: 'FREE_DAILY_GRANT' });
    expect(await credits()).toBe(remaining);

    // Aynı ay yeniden premium: kalan hak geri/korunur, ikinci aylık grant yok.
    await makePremium(userModel, user.userId);
    expect(await credits()).toBe(remaining);
    expect(
      await t
        .model('AiCreditLedger')
        .countDocuments({ userId, reason: 'PREMIUM_MONTHLY_GRANT' }),
    ).toBe(1);
  });

  it('B13: freeText (PII) hiçbir log satırına yazılmaz', async () => {
    const { recommend } = await setup();
    const spies = (['log', 'warn', 'error', 'debug', 'verbose'] as const).map(
      (level) => jest.spyOn(Logger.prototype, level),
    );
    const secret = 'GIZLI-KISISEL-METIN kanser teşhisi aldım ve çok korkuyorum';
    await recommend(secret).expect(201);
    const logged = spies
      .flatMap((spy) => spy.mock.calls)
      .map((args) => String(args[0]))
      .join('\n');
    jest.restoreAllMocks();
    expect(logged).toContain('[start]'); // log akışı gerçekten çalıştı
    expect(logged).not.toContain('GIZLI-KISISEL');
    expect(logged).not.toContain('kanser');
  });

  it('B7: aynı flowId tekrarı → kayıtlı öneri döner, ajan çalışmaz, ikinci belge yok', async () => {
    const user = await signIn(t.http, { sub: `e2e-ai-${randomUUID()}` });
    for (let i = 0; i < 3; i++)
      await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    const flowId = randomUUID();
    const send = () =>
      request(t.http)
        .post('/v1/ai/recommendations')
        .set(bearer(user.accessToken))
        .send({ userId: user.userId, freeText: 'huzur istiyorum', flowId })
        .expect(201);
    type Body = {
      recommendationId: string;
      recommendedIds: string[];
      reasoning: string;
      items: { id: string }[];
      remainingCredits: number;
    };
    const first = data<Body>(await send());
    const callsAfterFirst = ai.calls.length;
    const second = data<Body>(await send());

    expect(ai.calls.length).toBe(callsAfterFirst);
    expect(second.recommendationId).toBe(first.recommendationId);
    expect(second.recommendedIds).toEqual(first.recommendedIds);
    expect(second.items.map((i) => i.id)).toEqual(first.items.map((i) => i.id));
    expect(second.reasoning).toBe(first.reasoning);
    expect(second.remainingCredits).toBe(first.remainingCredits);
    expect(
      await t
        .model('AiRecommendation')
        .countDocuments({ userId: new Types.ObjectId(user.userId) }),
    ).toBe(1);
  });
});
