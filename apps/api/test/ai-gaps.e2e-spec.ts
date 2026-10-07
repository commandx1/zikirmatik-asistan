/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-member-access -- mongoose Model<any> ve ai SDK sahte modelleri tipsiz */
/**
 * QA davranış kataloğu — AI Rehber / kredi / AI Vird / AI Sohbet boşlukları.
 * Gerçek Mongo + sahte LLM (MockAiRuntimeService). Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { ConfigService } from '@nestjs/config';
import { Types } from 'mongoose';
import request from 'supertest';
import { AiCreditsService } from '../src/modules/ai/ai-credits.service';
import { AI_UNAVAILABLE_MESSAGE } from '../src/modules/ai/ai-errors';
import { AiProgressGateway } from '../src/modules/ai/ai-progress.gateway';
import { AiRuntimeService } from '../src/modules/ai/ai-runtime.service';
import { FREE_SIGNUP_BONUS_CREDIT_AMOUNT } from '../src/modules/ai/credits.constants';
import { RetrievalService } from '../src/modules/ai/retrieval.service';
import {
  MockAiRuntimeService,
  MockRetrievalService,
} from '../src/modules/ai/testing/ai-mocks';
import { toDhikrCandidate } from '../src/modules/ai/retrieval.service';
import { VirdProgramsService } from '../src/modules/vird/vird-programs.service';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { parseSse, rawSse } from './helpers/sse';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

describe('AI boşlukları (e2e)', () => {
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

  afterEach(() => jest.restoreAllMocks());

  afterAll(async () => {
    await t?.close();
  });

  const newUser = () => signIn(t.http, { sub: `e2e-gap-${randomUUID()}` });
  const seedThree = async () => {
    const m = t.model<DhikrDocument>('Dhikr');
    const ids: string[] = [];
    for (const nameArabic of ['سبحان الله', 'الحمد لله', 'الله أكبر'])
      ids.push(await seedDhikr(m, { nameArabic }));
    return ids;
  };
  const fundWallet = async (
    user: { userId: string; accessToken: string },
    amount = 30,
  ) => {
    await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    await t
      .model('AiCreditWallet')
      .updateOne(
        { userId: new Types.ObjectId(user.userId) },
        { $set: { grantCredits: amount, balance: amount } },
      );
  };
  const recommend = (
    user: { userId: string; accessToken: string },
    flowId = randomUUID(),
  ) =>
    request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText: 'huzur', flowId });

  describe('AI Rehber', () => {
    it('AIR-17: ikinci DB kapısı — adayda aktif olmayan zikir seçilse bile önerilmez', async () => {
      const user = await newUser();
      await seedThree();
      const inactiveId = await seedDhikr(t.model<DhikrDocument>('Dhikr'), {
        nameArabic: 'لا إله إلا الله',
        isActive: false,
      });
      const retrieval = t.app.get<MockRetrievalService>(RetrievalService);
      const orig = retrieval.searchDhikrsByText.bind(retrieval);
      jest
        .spyOn(retrieval, 'searchDhikrsByText')
        .mockImplementation(async (p) => {
          const doc = await t
            .model<DhikrDocument>('Dhikr')
            .findById(inactiveId)
            .lean();
          return [
            toDhikrCandidate(
              doc as Parameters<typeof toDhikrCandidate>[0],
              p.locale,
            ),
            ...(await orig(p)),
          ];
        });

      const res = await recommend(user).expect(201);
      const ids = data<{ recommendedIds: string[] }>(res).recommendedIds;
      expect(ids.length).toBeGreaterThan(0);
      expect(ids).not.toContain(inactiveId);
    });

    it('AIR-22: seçim tekrarlanırsa selectionCount yine artar, selectedDhikrId üzerine yazılır', async () => {
      const user = await newUser();
      await seedThree();
      const body = data<{ recommendationId: string; recommendedIds: string[] }>(
        await recommend(user).expect(201),
      );
      const [a, b] = body.recommendedIds;
      const select = (id: string) =>
        request(t.http)
          .patch(`/v1/ai/recommendations/${body.recommendationId}/select`)
          .set(bearer(user.accessToken))
          .send({ selectedDhikrId: id })
          .expect(200);
      await select(a);
      await select(a);
      const last = await select(b);
      expect(data<{ selectedDhikrId: string }>(last).selectedDhikrId).toBe(b);
      const dhikr = t.model('Dhikr');
      expect(
        (await dhikr.findById(a).lean<{ selectionCount: number }>())
          ?.selectionCount,
      ).toBe(2);
      expect(
        (await dhikr.findById(b).lean<{ selectionCount: number }>())
          ?.selectionCount,
      ).toBe(1);
    });

    it('AIR-25: kullanıcı silinmiş (token hâlâ geçerli) → 404, kredi işlemi yok', async () => {
      const user = await newUser();
      await seedThree();
      await t.model('User').deleteOne({ _id: user.userId });

      await recommend(user).expect(404);
      const userId = new Types.ObjectId(user.userId);
      expect(await t.model('AiCreditLedger').countDocuments({ userId })).toBe(
        0,
      );
      expect(await t.model('AiCreditWallet').countDocuments({ userId })).toBe(
        0,
      );
    });
  });

  describe('AI kredi', () => {
    const fresh = async () => {
      const user = await newUser();
      return { user, userId: new Types.ObjectId(user.userId) };
    };
    const topup = (userId: string, productId: string) =>
      t.app.get(AiCreditsService).applyTopupPurchase({
        userId,
        productId,
        providerEventId: randomUUID(),
      });

    it('CRD-15: AI_CREDIT_TOPUP_PRODUCTS (JSON ve csv) varsayılan kataloğu ezer', async () => {
      const { user } = await fresh();
      const config = t.app.get(ConfigService);
      const spy = jest
        .spyOn(config, 'get')
        .mockImplementation((key: string) =>
          key === 'AI_CREDIT_TOPUP_PRODUCTS'
            ? '{"skuJson":7}'
            : process.env[key],
        );
      expect(await topup(user.userId, 'skuJson')).toMatchObject({
        applied: true,
        credits: 7,
      });
      // varsayılan katalog artık geçersiz
      expect(await topup(user.userId, 'topupsmall')).toMatchObject({
        applied: false,
        reason: 'unknown_product',
      });
      spy.mockImplementation((key: string) =>
        key === 'AI_CREDIT_TOPUP_PRODUCTS'
          ? 'skuCsv:9, other:11'
          : process.env[key],
      );
      expect(await topup(user.userId, 'other')).toMatchObject({
        applied: true,
        credits: 11,
      });
      spy.mockRestore();
      // env yoksa varsayılan katalog geri gelir
      expect(await topup(user.userId, 'topupsmall')).toMatchObject({
        applied: true,
        credits: 10,
      });
    });

    it('CRD-17: kesimde cüzdan güncellemesi fırlarsa ledger telafi silinir; aynı flowId yeniden denenir', async () => {
      const { user, userId } = await fresh();
      await seedThree();
      const flowId = randomUUID();
      const wallet = t.model('AiCreditWallet');
      const orig = wallet.findOneAndUpdate.bind(wallet);
      const spy = jest
        .spyOn(wallet, 'findOneAndUpdate')
        .mockImplementation(((filter: Record<string, unknown>, ...rest: []) =>
          filter && 'balance' in filter
            ? { exec: () => Promise.reject(new Error('wallet down')) }
            : (orig as (...a: unknown[]) => unknown)(
                filter,
                ...rest,
              )) as never);

      await recommend(user, flowId).expect(500);
      const debits = () =>
        t
          .model('AiCreditLedger')
          .countDocuments({ userId, reason: 'RECOMMENDATION_DEBIT' });
      expect(await debits()).toBe(0);

      spy.mockRestore();
      const retry = await recommend(user, flowId).expect(201);
      expect(data<{ remainingCredits: number }>(retry).remainingCredits).toBe(
        FREE_SIGNUP_BONUS_CREDIT_AMOUNT - 1,
      );
      expect(await debits()).toBe(1);
    });

    it('CRD-18: grant uygulanırken eşzamanlı topup → bakiye grant+topup (kalıcı kayıp yok)', async () => {
      for (let i = 0; i < 5; i++) {
        const { user } = await fresh();
        await Promise.all([
          topup(user.userId, 'topupsmall'),
          ...Array.from({ length: 4 }, () =>
            request(t.http).get('/v1/ai/credits').set(bearer(user.accessToken)),
          ),
        ]);
        const res = await request(t.http)
          .get('/v1/ai/credits')
          .set(bearer(user.accessToken))
          .expect(200);
        expect(data<{ balance: number }>(res).balance).toBe(
          FREE_SIGNUP_BONUS_CREDIT_AMOUNT + 10,
        );
      }
    });
  });

  describe('AI Vird', () => {
    const body = (over: Record<string, unknown> = {}) => ({
      flowId: randomUUID(),
      freeText: 'sabah zikirleri',
      durationDays: 7,
      slots: ['morning', 'evening'],
      ...over,
    });
    const create = (
      user: { accessToken: string },
      payload: Record<string, unknown>,
      headers: Record<string, string> = {},
    ) =>
      request(t.http)
        .post('/v1/ai/vird-programs')
        .set(bearer(user.accessToken))
        .set(headers)
        .send(payload);
    const programs = (user: { userId: string }) =>
      t
        .model('VirdProgram')
        .find({ userId: new Types.ObjectId(user.userId) })
        .lean<
          Array<{
            _id: Types.ObjectId;
            startDate: string;
            expiresAt: Date;
            title: { tr: string; en: string };
          }>
        >();

    it('AIV-04 (HTTP): aynı flowId tekrar → mevcut taslak, kredi tekrar düşmez, ajan yeniden çalışmaz', async () => {
      const user = await newUser();
      await seedThree();
      const payload = body();
      const first = data<{ programId: string; remainingCredits: number }>(
        await create(user, payload).expect(201),
      );
      const callsAfterFirst = ai.calls.length;
      const second = data<{ programId: string; remainingCredits: number }>(
        await create(user, payload).expect(201),
      );
      expect(second).toMatchObject(first);
      expect(ai.calls.length).toBe(callsAfterFirst);
      expect(await programs(user)).toHaveLength(1);
    });

    it.each([
      ['süre', { durationDays: 14 }],
      ['dilim', { slots: ['morning'] }],
      ['metin', { freeText: 'başka bir istek' }],
      ['vakit', { prayerSelection: [1, 2] }],
    ])('AIV-05: aynı flowId farklı %s → 403', async (_n, change) => {
      const user = await newUser();
      await seedThree();
      const payload = body();
      await create(user, payload).expect(201);
      await create(user, { ...payload, ...change }).expect(403);
      expect(await programs(user)).toHaveLength(1);
    });

    const virdDebits = (user: { userId: string }) =>
      t.model('AiCreditLedger').countDocuments({
        userId: new Types.ObjectId(user.userId),
        reason: 'VIRD_PROGRAM_DEBIT',
      });
    const balance = async (user: { accessToken: string }) =>
      data<{ balance: number }>(
        await request(t.http)
          .get('/v1/ai/credits')
          .set(bearer(user.accessToken))
          .expect(200),
      ).balance;

    it.each([
      [
        'DELETE /v1/vird/programs/:id (mobil Vazgeç)',
        (user: { accessToken: string }, programId: string) =>
          request(t.http)
            .delete(`/v1/vird/programs/${programId}`)
            .set(bearer(user.accessToken))
            .expect(200),
      ],
      [
        'TTL / arşiv sınırı (doğrudan silme)',
        () => t.model('VirdProgram').deleteMany({}),
      ],
    ])(
      'AIV-06: taslak teslim edildikten sonra silinirse (%s) aynı flowId → 409, kredisiz üretim yok',
      async (_n, removeDraft) => {
        const user = await newUser();
        await seedThree();
        const payload = body();
        const first = data<{ programId: string }>(
          await create(user, payload).expect(201),
        );
        await removeDraft(user, first.programId);
        const callsAfterFirst = ai.calls.length;

        const res = await create(user, payload).expect(409);
        expect(JSON.stringify(res.body)).toContain('AI_FLOW_ALREADY_USED');
        expect(await programs(user)).toHaveLength(0);
        expect(await virdDebits(user)).toBe(1);
        expect(ai.calls.length).toBe(callsAfterFirst);
      },
    );

    // Debit ile taslak yazımı arasında süreç ölür (B9 sırası): kredi düşmüş,
    // taslak yok, makbuz yok.
    const crashAfterDebit = async (
      user: { accessToken: string },
      payload: Record<string, unknown>,
    ) => {
      jest
        .spyOn(t.app.get(VirdProgramsService), 'createAiDraft')
        .mockRejectedValueOnce(new Error('simulated crash'));
      await create(user, payload).expect(500);
    };

    it('AIV-06: debit sonrası çöküş → retry 201, kredi tekrar düşmez, tek program', async () => {
      const user = await newUser();
      await seedThree();
      const payload = body();
      const before = await balance(user);
      await crashAfterDebit(user, payload);
      expect(await programs(user)).toHaveLength(0);
      expect(await balance(user)).toBe(before - 3);

      const retry = data<{ programId: string; remainingCredits: number }>(
        await create(user, payload).expect(201),
      );
      expect(retry.remainingCredits).toBe(before - 3);
      expect(await virdDebits(user)).toBe(1);
      expect(await programs(user)).toHaveLength(1);

      // Bu taslak artık teslim edildi: silinirse yeniden üretilmez.
      await t.model('VirdProgram').deleteMany({});
      await create(user, payload).expect(409);
    });

    it('AIV-06: debit sonrası çöküş + eşzamanlı retry → tek program, tek debit', async () => {
      const user = await newUser();
      await seedThree();
      const payload = body();
      const before = await balance(user);
      await crashAfterDebit(user, payload);

      const results = await Promise.all(
        [0, 1, 2].map(() => create(user, payload)),
      );
      expect(results.map((r) => r.status)).toEqual([201, 201, 201]);
      const ids = new Set(
        results.map((r) => data<{ programId: string }>(r).programId),
      );
      expect(ids.size).toBe(1);
      expect(await programs(user)).toHaveLength(1);
      expect(await virdDebits(user)).toBe(1);
      expect(await balance(user)).toBe(before - 3);
    });

    it('AIV-08: dil önceliği gövde locale > Accept-Language > tr', async () => {
      const user = await newUser();
      const ids = await seedThree();
      await fundWallet(user);
      const nameFor = async (
        payload: Record<string, unknown>,
        headers: Record<string, string> = {},
      ) => {
        const res = await create(user, body(payload), headers).expect(201);
        const slots = data<{
          program: {
            phases: Array<{ slots: { morning: Array<{ name: string }> } }>;
          };
        }>(res).program.phases[0].slots;
        return slots.morning[0].name;
      };
      const d = await t.model('Dhikr').findById(ids[0]).lean<{
        key: string;
      }>();
      expect(d).toBeTruthy();
      expect(
        await nameFor({ locale: 'en' }, { 'accept-language': 'tr' }),
      ).toMatch(/^en-/);
      expect(
        await nameFor({ locale: 'tr' }, { 'accept-language': 'en' }),
      ).toMatch(/^tr-/);
      expect(await nameFor({}, { 'accept-language': 'en-US' })).toMatch(/^en-/);
      expect(await nameFor({})).toMatch(/^tr-/);
    });

    it('AIV-11: AI taslağı 7 gün sonra silinmek üzere işaretlenir (TTL index)', async () => {
      const user = await newUser();
      await seedThree();
      await create(user, body()).expect(201);
      const [draft] = await programs(user);
      const days = (draft.expiresAt.getTime() - Date.now()) / 86_400_000;
      expect(days).toBeGreaterThan(6.9);
      expect(days).toBeLessThan(7.1);
      const idx = await t.model('VirdProgram').collection.indexes();
      expect(
        idx.some((i) => i.key.expiresAt === 1 && i.expireAfterSeconds === 0),
      ).toBe(true);
    });

    it('AIV-13: başlık tek dilde üretilir, title.tr = title.en (her iki locale)', async () => {
      const user = await newUser();
      await seedThree();
      await fundWallet(user);
      await create(user, body({ locale: 'en' })).expect(201);
      await create(user, body({ locale: 'tr' })).expect(201);
      const all = await programs(user);
      expect(all).toHaveLength(2);
      for (const p of all) {
        expect(p.title.tr).toBeTruthy();
        expect(p.title.tr).toBe(p.title.en);
      }
    });

    it('AIV-15: aynı flowId iki eşzamanlı istek → tek taslak, tek kesim, aynı programId', async () => {
      const user = await newUser();
      await seedThree();
      const payload = body();
      const results = await Promise.all([
        create(user, payload),
        create(user, payload),
      ]);
      expect(results.map((r) => r.status)).toEqual([201, 201]);
      const [a, b] = results.map((r) => data<{ programId: string }>(r));
      expect(a.programId).toBe(b.programId);
      expect(await programs(user)).toHaveLength(1);
      expect(
        await t.model('AiCreditLedger').countDocuments({
          userId: new Types.ObjectId(user.userId),
          reason: 'VIRD_PROGRAM_DEBIT',
        }),
      ).toBe(1);
    });

    it('AIV-16: startDate = isteğin saat dilimindeki bugün', async () => {
      const user = await newUser();
      await seedThree();
      await fundWallet(user);
      const ahead = 'Pacific/Kiritimati';
      const behind = 'Pacific/Pago_Pago';
      const dayIn = (tz: string) =>
        new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
      expect(dayIn(ahead) > dayIn(behind)).toBe(true);
      await create(user, body(), { 'x-client-timezone': ahead }).expect(201);
      await create(user, body(), { 'x-client-timezone': behind }).expect(201);
      const starts = (await programs(user)).map((p) => p.startDate).sort();
      expect(starts).toEqual([dayIn(behind), dayIn(ahead)].sort());
    });

    it('WA-04: AI Vird ucu socketId almaz (alan elenir, soket adımı yayınlanmaz)', async () => {
      const user = await newUser();
      await seedThree();
      const step = jest
        .spyOn(t.app.get(AiProgressGateway), 'emitStep')
        .mockImplementation(() => undefined);
      const chat = jest
        .spyOn(t.app.get(AiProgressGateway), 'emitChatStep')
        .mockImplementation(() => undefined);
      await create(user, body({ socketId: 'sock-1' })).expect(201);
      expect(step).not.toHaveBeenCalled();
      expect(chat).not.toHaveBeenCalled();
    });
  });

  describe('AI Sohbet', () => {
    const chatModelPrompts = () => {
      const seen: Array<{ prompt: Array<{ role: string }> }[]> = [];
      const orig = ai.model.bind(ai);
      jest.spyOn(ai, 'model').mockImplementation((kind) => {
        const m = orig(kind);
        if (kind === 'chat') seen.push(m.doGenerateCalls as never);
        return m;
      });
      return seen;
    };

    it('CHT-12: dil gövde locale > Accept-Language > tr; sonraki mesajlar konuşmanın kayıtlı dilini kullanır', async () => {
      const user = await newUser();
      await fundWallet(user);
      const start = async (
        payload: Record<string, unknown>,
        headers: Record<string, string> = {},
      ) => {
        const res = await request(t.http)
          .post('/v1/ai/chat/conversations')
          .set(bearer(user.accessToken))
          .set(headers)
          .send({ firstMessage: 'merhaba', ...payload })
          .expect(201);
        return data<{ conversation: { _id: string; locale: string } }>(res)
          .conversation;
      };
      expect(
        (await start({ locale: 'en' }, { 'accept-language': 'tr' })).locale,
      ).toBe('en');
      expect(
        (await start({ locale: 'tr' }, { 'accept-language': 'en' })).locale,
      ).toBe('tr');
      const enConv = await start({}, { 'accept-language': 'en-US' });
      expect(enConv.locale).toBe('en');
      expect((await start({})).locale).toBe('tr');

      // Sonraki mesaj: Accept-Language tr olsa da konuşma en → hata mesajı en.
      ai.setMode('error503');
      const res = await rawSse(
        request(t.http)
          .post(`/v1/ai/chat/conversations/${enConv._id}/messages/stream`)
          .set(bearer(user.accessToken))
          .set('accept-language', 'tr')
          .send({ message: 'ikinci' }),
      );
      const err = parseSse(res.body as string).find((e) => e.event === 'error');
      expect(err?.data.code).toBe('AI_UNAVAILABLE');
      expect(err?.data.message).toMatch(/[A-Za-z]/);
      expect(err?.data.message).toBe(AI_UNAVAILABLE_MESSAGE.en);
    });

    it('CHT-13: bağlam penceresi son 10 mesaj', async () => {
      const user = await newUser();
      const created = await request(t.http)
        .post('/v1/ai/chat/conversations')
        .set(bearer(user.accessToken))
        .send({ firstMessage: 'ilk' })
        .expect(201);
      const conversationId = new Types.ObjectId(
        data<{ conversation: { _id: string } }>(created).conversation._id,
      );
      const base = Date.now() + 1000;
      await t.model('AiChatMessage').insertMany(
        Array.from({ length: 20 }, (_, i) => ({
          conversationId,
          userId: new Types.ObjectId(user.userId),
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `eski-${i}`,
          createdAt: new Date(base + i * 1000),
        })),
      );
      const seen = chatModelPrompts();
      await request(t.http)
        .post(`/v1/ai/chat/conversations/${conversationId.toString()}/messages`)
        .set(bearer(user.accessToken))
        .send({ message: 'yeni mesaj' })
        .expect(201);
      const calls = seen.flat();
      expect(calls).toHaveLength(1);
      const turns = calls[0].prompt.filter((m) => m.role !== 'system');
      expect(turns).toHaveLength(10);
      const text = JSON.stringify(turns);
      expect(text).toContain('yeni mesaj');
      expect(text).toContain('eski-19');
      expect(text).not.toContain('eski-10');
    });

    it('CHT-19: SSE beklenmeyen hata → code:INTERNAL, gerçek neden sızmaz', async () => {
      const user = await newUser();
      jest
        .spyOn(t.app.get(AiCreditsService), 'debitCreditForFlow')
        .mockRejectedValue(new Error('SECRET-DB-DETAIL'));
      const res = await rawSse(
        request(t.http)
          .post('/v1/ai/chat/conversations/stream')
          .set(bearer(user.accessToken))
          .send({ firstMessage: 'merhaba' }),
      );
      const raw = res.body as string;
      const err = parseSse(raw).find((e) => e.event === 'error');
      expect(err?.data.code).toBe('INTERNAL');
      expect(raw).not.toContain('SECRET-DB-DETAIL');
    });
  });
});
