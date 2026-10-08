/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-return -- mongoose Model<any> ve servis casus'ları tipsiz */
/**
 * AI kötüye kullanım sınırları (tek uçuşta istek kirası, günlük ücretsiz koşu
 * sınırı), AIV-06 iade/kurtarma güvenliği (kredi basma, teslim edilmiş programa
 * iade) ve MOB-AIM-10 sohbet mesaj sayfalaması. Gerçek Mongo + sahte LLM.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import { ForbiddenException } from '@nestjs/common';
import fc from 'fast-check';
import { Types } from 'mongoose';
import request from 'supertest';
import { AiCreditsService } from '../src/modules/ai/ai-credits.service';
import { AiRuntimeService } from '../src/modules/ai/ai-runtime.service';
import { AiVirdService } from '../src/modules/ai/ai-vird.service';
import { MockAiRuntimeService } from '../src/modules/ai/testing/ai-mocks';
import { VirdProgramAgentService } from '../src/modules/ai/vird-program-agent.service';
import { VirdProgramsService } from '../src/modules/vird/vird-programs.service';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import { atInstant } from './helpers/clock';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, seedDhikr, signIn } from './helpers/fixtures';

type User = { userId: string; accessToken: string };

function deferred<T = void>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('AI sınırları + iade güvenliği (e2e)', () => {
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

  // Kapıda bekletilen istek test başarısız olsa da bırakılır (yoksa close() asılır).
  const pendingReleases: Array<() => void> = [];
  afterEach(() => {
    pendingReleases.splice(0).forEach((release) => release());
    jest.restoreAllMocks();
  });

  afterAll(async () => {
    await t?.close();
  });

  const newUser = () => signIn(t.http, { sub: `e2e-lim-${randomUUID()}` });
  const oid = (u: { userId: string }) => new Types.ObjectId(u.userId);
  const seedThree = async () => {
    const m = t.model<DhikrDocument>('Dhikr');
    for (const nameArabic of ['سبحان الله', 'الحمد لله', 'الله أكبر'])
      await seedDhikr(m, { nameArabic });
  };
  const fund = async (user: User, amount = 30) => {
    await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    await t
      .model('AiCreditWallet')
      .updateOne(
        { userId: oid(user) },
        { $set: { grantCredits: amount, balance: amount } },
      );
  };
  const wallet = (user: User) =>
    t
      .model('AiCreditWallet')
      .findOne({ userId: oid(user) })
      .lean<{
        balance: number;
        freeRunCount?: number;
        freeRunDayKey?: string;
      }>();
  const balance = async (user: User) => (await wallet(user))!.balance;
  const virdBody = (over: Record<string, unknown> = {}) => ({
    flowId: randomUUID(),
    freeText: 'sabah zikirleri',
    durationDays: 7,
    slots: ['morning', 'evening'],
    ...over,
  });
  const createVird = (user: User, payload: Record<string, unknown>) =>
    request(t.http)
      .post('/v1/ai/vird-programs')
      .set(bearer(user.accessToken))
      .send(payload);
  const recommend = (user: User, freeText = 'huzur', flowId = randomUUID()) =>
    request(t.http)
      .post('/v1/ai/recommendations')
      .set(bearer(user.accessToken))
      .send({ userId: user.userId, freeText, flowId });
  const chat = (user: User, body: Record<string, unknown>) =>
    request(t.http)
      .post('/v1/ai/chat/conversations')
      .set(bearer(user.accessToken))
      .send(body);
  const chatStream = (user: User, body: Record<string, unknown>) =>
    request(t.http)
      .post('/v1/ai/chat/conversations/stream')
      .set(bearer(user.accessToken))
      .send(body);
  const virdDebits = (user: User) =>
    t
      .model('AiCreditLedger')
      .countDocuments({ userId: oid(user), reason: 'VIRD_PROGRAM_DEBIT' });
  const programs = (user: User) =>
    t.model('VirdProgram').countDocuments({ userId: oid(user) });
  const codeOf = (res: { body: unknown }) => JSON.stringify(res.body);

  /** Bir sonraki vird ajan koşusunu kapıda bekletir (istek "uçuşta" kalır). */
  const holdNextVirdAgent = () => {
    const agent = t.app.get(VirdProgramAgentService);
    const real = agent.run.bind(agent);
    const entered = deferred();
    const gate = deferred();
    jest.spyOn(agent, 'run').mockImplementationOnce(async (input) => {
      entered.resolve();
      await gate.promise;
      return real(input);
    });
    pendingReleases.push(() => gate.resolve());
    return { entered: entered.promise, release: () => gate.resolve() };
  };

  describe('MOB-AIM-10: sohbet mesaj sayfalaması', () => {
    it('60 mesaj: sayfa 1 (limit 50) = SON 50 mesaj artan sırada, sayfa 2 = ilk 10', async () => {
      const user = await newUser();
      const userId = oid(user);
      const conversationId = new Types.ObjectId();
      await t.model('AiConversation').collection.insertOne({
        _id: conversationId,
        userId,
        title: 'uzun sohbet',
        status: 'active',
        lastMessageAt: new Date(),
        locale: 'tr',
      });
      const base = Date.parse('2026-10-01T10:00:00.000Z');
      await t.model('AiChatMessage').collection.insertMany(
        Array.from({ length: 60 }, (_, i) => ({
          conversationId,
          userId,
          role: i % 2 === 0 ? 'user' : 'assistant',
          content: `m${i + 1}`,
          createdAt: new Date(base + i * 1000),
        })),
      );
      const page = async (n: number) =>
        data<{
          items: Array<{ content: string }>;
          total: number;
          hasMore: boolean;
        }>(
          await request(t.http)
            .get(
              `/v1/ai/chat/conversations/${conversationId.toString()}/messages?page=${n}&limit=50`,
            )
            .set(bearer(user.accessToken))
            .expect(200),
        );

      const first = await page(1);
      expect(first.total).toBe(60);
      expect(first.items.map((m) => m.content)).toEqual(
        Array.from({ length: 50 }, (_, i) => `m${i + 11}`),
      );
      expect(first.hasMore).toBe(true);

      const second = await page(2);
      expect(second.items.map((m) => m.content)).toEqual(
        Array.from({ length: 10 }, (_, i) => `m${i + 1}`),
      );
      expect(second.hasMore).toBe(false);
    });
  });

  describe('tek uçuşta AI isteği (AI_REQUEST_IN_FLIGHT)', () => {
    it('vird üretimi sürerken öneri / vird / sohbet REST / sohbet SSE → anında 429, ajan koşmaz; bitince yeni istek geçer', async () => {
      const user = await newUser();
      await seedThree();
      await fund(user);
      const hold = holdNextVirdAgent();
      const first = createVird(user, virdBody()).then((r) => r);
      await hold.entered;
      const callsWhileHeld = ai.calls.length;

      const blocked = await Promise.all([
        recommend(user),
        createVird(user, virdBody()),
        chat(user, { firstMessage: 'selam' }),
        chatStream(user, { firstMessage: 'selam' }),
      ]);
      for (const res of blocked) {
        expect(res.status).toBe(429);
        expect(codeOf(res)).toContain('AI_REQUEST_IN_FLIGHT');
      }
      expect(blocked[3].headers['content-type']).toMatch(/application\/json/);
      expect(ai.calls.length).toBe(callsWhileHeld);

      hold.release();
      expect((await first).status).toBe(201);
      // Kira bırakıldı: sıradaki istek normal çalışır.
      await chat(user, { firstMessage: 'selam' }).expect(201);
      // 429'lar ücretsiz koşu sayılmaz (ajan hiç koşmadı).
      expect((await wallet(user))?.freeRunCount ?? 0).toBe(0);
    });

    it('kayıtlı sonucun tekrarı (aynı flowId / clientMessageId) kira tutulurken de döner ve sayılmaz', async () => {
      const user = await newUser();
      await seedThree();
      await fund(user);
      const doneVird = virdBody();
      const virdFirst = data<{ programId: string }>(
        await createVird(user, doneVird).expect(201),
      );
      const recFlow = randomUUID();
      await recommend(user, 'huzur', recFlow).expect(201);
      const clientMessageId = randomUUID();
      const chatFirst = await chat(user, {
        firstMessage: 'ilk',
        clientMessageId,
      }).expect(201);

      const hold = holdNextVirdAgent();
      const inFlight = createVird(user, virdBody()).then((r) => r);
      await hold.entered;
      const before = await wallet(user);

      const replayVird = await createVird(user, doneVird).expect(201);
      expect(data<{ programId: string }>(replayVird).programId).toBe(
        virdFirst.programId,
      );
      await recommend(user, 'huzur', recFlow).expect(201);
      const replayChat = await chat(user, {
        firstMessage: 'ilk',
        clientMessageId,
      }).expect(201);
      expect(
        data<{ conversation: { _id: string } }>(replayChat).conversation._id,
      ).toBe(
        data<{ conversation: { _id: string } }>(chatFirst).conversation._id,
      );

      hold.release();
      expect((await inFlight).status).toBe(201);
      const after = await wallet(user);
      expect(after?.freeRunCount ?? 0).toBe(before?.freeRunCount ?? 0);
    });

    it('süresi geçmiş kira (ölü süreç) devralınır; geçerli kira 429 verir', async () => {
      const user = await newUser();
      await fund(user);
      const setLease = (expiresAt: Date) =>
        t
          .model('AiCreditWallet')
          .updateOne(
            { userId: oid(user) },
            { $set: { aiLeaseToken: 'dead', aiLeaseExpiresAt: expiresAt } },
          );

      await setLease(new Date(Date.now() + 60_000));
      const res = await chat(user, { firstMessage: 'selam' }).expect(429);
      expect(codeOf(res)).toContain('AI_REQUEST_IN_FLIGHT');

      await setLease(new Date(Date.now() - 1_000));
      await chat(user, { firstMessage: 'selam' }).expect(201);
      const w = await t
        .model('AiCreditWallet')
        .findOne({ userId: oid(user) })
        .lean<{ aiLeaseToken?: string }>();
      expect(w?.aiLeaseToken).toBeUndefined();
    });
  });

  describe('günlük ücretsiz koşu sınırı (AI_DAILY_FREE_LIMIT)', () => {
    it('kredisiz koşular (netleştirme, 503) sayılır; 20 dolunca 429; ücretli koşu ve tekrar sayılmaz; yeni UTC gün sıfırlar', async () => {
      const user = await newUser();
      await seedThree();
      await fund(user);
      const today = new Date().toISOString().slice(0, 10);

      await recommend(user, 'x [mock:clarify]').expect(201);
      await chat(user, { firstMessage: 'y [mock:error503]' }).expect(503);
      expect(await wallet(user)).toMatchObject({
        freeRunCount: 2,
        freeRunDayKey: today,
      });

      // Ücretli koşu sayacı artırmaz.
      const before = await balance(user);
      const paid = virdBody();
      await createVird(user, paid).expect(201);
      expect(await balance(user)).toBe(before - 3);
      expect((await wallet(user))?.freeRunCount).toBe(2);

      await t
        .model('AiCreditWallet')
        .updateOne({ userId: oid(user) }, { $set: { freeRunCount: 19 } });
      await recommend(user, 'x [mock:clarify]').expect(201); // 20. kredisiz koşu
      const callsAtLimit = ai.calls.length;
      for (const res of [
        await recommend(user, 'x [mock:clarify]'),
        await recommend(user), // ücretli olacak koşu da önceden bilinemez
        await chatStream(user, { firstMessage: 'selam' }),
        await createVird(user, virdBody()),
      ]) {
        expect(res.status).toBe(429);
        expect(codeOf(res)).toContain('AI_DAILY_FREE_LIMIT');
      }
      expect(ai.calls.length).toBe(callsAtLimit);
      expect((await wallet(user))?.freeRunCount).toBe(20);

      // Kayıtlı sonucun tekrarı sınırda da döner.
      await createVird(user, paid).expect(201);

      // Dünün sayacı bugünü bağlamaz.
      await t
        .model('AiCreditWallet')
        .updateOne(
          { userId: oid(user) },
          { $set: { freeRunDayKey: '2000-01-01', freeRunCount: 20 } },
        );
      await recommend(user, 'x [mock:clarify]').expect(201);
      expect(await wallet(user)).toMatchObject({
        freeRunCount: 1,
        freeRunDayKey: today,
      });
    });
  });

  describe('AIV-06 iade / kurtarma güvenliği', () => {
    // Süreç debit ile taslak arasında öldü: kredi düşmüş, taslak ve makbuz yok.
    const simulateCrashAfterDebit = async (
      user: User,
      payload: Record<string, unknown>,
      patch: Record<string, unknown> = {},
    ) => {
      await createVird(user, payload).expect(201);
      await t.model('VirdProgram').deleteMany({ userId: oid(user) });
      await t.model('AiCreditLedger').updateOne(
        {
          userId: oid(user),
          reason: 'VIRD_PROGRAM_DEBIT',
          flowId: payload.flowId,
        },
        { $unset: { 'metadata.fulfilledRef': 1 }, ...patch },
      );
    };

    it('iade, kopya isteğin teslim ettiği programın kesimini geri vermez (kira aşılmış olsa bile)', async () => {
      const user = await newUser();
      await seedThree();
      const payload = virdBody();
      await fund(user, 10);
      const before = await balance(user);
      const svc = t.app.get(AiVirdService);
      const programsSvc = t.app.get(VirdProgramsService);
      const credits = t.app.get(AiCreditsService);
      // Kira süresinin aşıldığı (iki istek üst üste bindiği) durumu canlandır.
      jest
        .spyOn(credits, 'runGuarded')
        .mockImplementation((_u, run) => run(() => undefined));
      const realCreate = programsSvc.createAiDraft.bind(programsSvc);
      const realFind = programsSvc.findAiDraftByFlowId.bind(programsSvc);
      const realMark = credits.markFlowFulfilled.bind(credits);
      const bInserted = deferred();
      const markGate = deferred();
      let aFailed = false;
      let b: Promise<unknown> | undefined;

      jest
        .spyOn(programsSvc, 'createAiDraft')
        .mockImplementationOnce(() => {
          aFailed = true;
          return Promise.reject(new Error('A: geçici yazım hatası'));
        })
        .mockImplementationOnce(async (input) => {
          const draft = await realCreate(input);
          bInserted.resolve();
          return draft;
        });
      // A'nın iade öncesi taslak kontrolü, B'nin yazımından hemen önce okur.
      jest
        .spyOn(programsSvc, 'findAiDraftByFlowId')
        .mockImplementation(async (u, f) => {
          if (!aFailed) return realFind(u, f);
          aFailed = false;
          b = svc.createVirdProgram(user.userId, payload as never, 'tr');
          await bInserted.promise;
          return null;
        });
      jest
        .spyOn(credits, 'markFlowFulfilled')
        .mockImplementation(async (...args) => {
          await markGate.promise;
          return realMark(...args);
        });

      await expect(
        svc.createVirdProgram(user.userId, payload as never, 'tr'),
      ).rejects.toThrow('A: geçici yazım hatası');
      markGate.resolve();
      await b;

      expect(await programs(user)).toBe(1);
      expect(await virdDebits(user)).toBe(1);
      expect(await balance(user)).toBe(before - 3);
    });

    it('kurtarma koşusu başarısız → iade YOK (eski satır teslim edilmiş olabilir), hak serbest; tekrar ücretsiz kurtarır', async () => {
      const user = await newUser();
      await seedThree();
      const payload = virdBody();
      await fund(user, 10);
      const before = await balance(user);
      await simulateCrashAfterDebit(user, payload, {
        $unset: { 'metadata.fulfilledRef': 1, 'metadata.grantTake': 1 },
      });
      jest
        .spyOn(t.app.get(VirdProgramsService), 'createAiDraft')
        .mockRejectedValueOnce(new Error('transient'));

      await createVird(user, payload).expect(500);
      expect(await balance(user)).toBe(before - 3);
      expect(await virdDebits(user)).toBe(1);

      const ok = data<{ remainingCredits: number }>(
        await createVird(user, payload).expect(201),
      );
      expect(ok.remainingCredits).toBe(before - 3);
      expect(await virdDebits(user)).toBe(1);
      expect(await programs(user)).toBe(1);
    });

    it('askıda kalmış kurtarma talebi (recoveryAt kira süresinden eski) yeniden talep edilir', async () => {
      const user = await newUser();
      await seedThree();
      const payload = virdBody();
      await simulateCrashAfterDebit(user, payload, {
        $set: { 'metadata.recoveryAt': new Date(Date.now() - 10 * 60_000) },
      });
      await createVird(user, payload).expect(201);
      expect(await programs(user)).toBe(1);
      expect(await virdDebits(user)).toBe(1);
    });

    // ── Kredi basma özelliği (property): sıralı işlemler, gün dönümü, eski satır ──
    type SeqOp =
      | { kind: 'debit'; k: number; amount: number }
      | { kind: 'legacy'; k: number }
      | { kind: 'deliver'; k: number }
      | { kind: 'refund'; k: number }
      | { kind: 'topup' }
      | { kind: 'read' }
      | { kind: 'days'; n: number };
    const seqOp: fc.Arbitrary<SeqOp> = fc.oneof(
      fc.record({
        kind: fc.constant('debit' as const),
        k: fc.integer({ min: 0, max: 3 }),
        amount: fc.constantFrom(1, 3),
      }),
      fc.record({
        kind: fc.constant('legacy' as const),
        k: fc.integer({ min: 0, max: 3 }),
      }),
      fc.record({
        kind: fc.constant('deliver' as const),
        k: fc.integer({ min: 0, max: 3 }),
      }),
      fc.record({
        kind: fc.constant('refund' as const),
        k: fc.integer({ min: 0, max: 3 }),
      }),
      fc.record({ kind: fc.constant('topup' as const) }),
      fc.record({ kind: fc.constant('read' as const) }),
      fc.record({
        kind: fc.constant('days' as const),
        n: fc.integer({ min: 0, max: 2 }),
      }),
    );

    it('property: iade hiçbir zaman "kesim hiç olmasaydı" bakiyesini aşmaz; bakiye ≤ grant + topup − kesimler; artış yalnız grant/topup/eşit iade', async () => {
      const credits = t.app.get(AiCreditsService);
      const ledger = t.model('AiCreditLedger');
      const reason = 'VIRD_PROGRAM_DEBIT' as const;

      await fc.assert(
        fc.asyncProperty(fc.array(seqOp, { maxLength: 18 }), async (ops) => {
          const user = await newUser();
          const userId = oid(user);
          let now = Date.parse('2026-10-08T23:00:00.000Z');
          const at = <T>(fn: () => Promise<T>) => atInstant(new Date(now), fn);
          const walletBalance = async () =>
            (
              await t
                .model('AiCreditWallet')
                .findOne({ userId })
                .lean<{ balance: number }>()
            )?.balance ?? 0;
          const debitRow = (k: number) =>
            ledger.findOne({ userId, reason, flowId: `f${k}` }).lean<{
              _id: Types.ObjectId;
              delta: number;
            }>();
          const grantRows = () =>
            ledger
              .find({ userId, reason: 'FREE_DAILY_GRANT' })
              .sort({ createdAt: 1, _id: 1 })
              .lean<Array<{ _id: Types.ObjectId; delta: number }>>();

          // Referans model: başarılı kesimler sırayla, iade edilenler HİÇ
          // olmamış gibi yeniden oynatılır (grant döngüsü sıfırlar, topup birikir).
          type Ev =
            | { type: 'grant'; amount: number }
            | { type: 'topup'; amount: number }
            | { type: 'debit'; amount: number; id: string; erased: boolean };
          const events: Ev[] = [];
          const seenGrants = new Set<string>();
          const syncGrants = async () => {
            let added = 0;
            for (const g of await grantRows()) {
              if (seenGrants.has(g._id.toString())) continue;
              seenGrants.add(g._id.toString());
              events.push({ type: 'grant', amount: g.delta });
              added += g.delta;
            }
            return added;
          };
          const modelBalance = () => {
            let g = 0;
            let tp = 0;
            for (const e of events) {
              if (e.type === 'grant') g = e.amount;
              else if (e.type === 'topup') tp += e.amount;
              else if (!e.erased) {
                const fromGrant = Math.min(g, e.amount);
                g -= fromGrant;
                tp -= e.amount - fromGrant;
              }
            }
            return g + tp;
          };

          await at(() => credits.getCredits(user.userId));
          await syncGrants();
          let seq = 0;
          for (const op of ops) {
            const before = await walletBalance();
            let allowedIncrease = 0;
            if (op.kind === 'days') {
              now += op.n * 24 * 60 * 60 * 1000;
              continue;
            } else if (op.kind === 'debit') {
              const had = await debitRow(op.k);
              await at(() =>
                credits.debitCreditForFlow(
                  userId,
                  `f${op.k}`,
                  false,
                  'h',
                  reason,
                  op.amount,
                ),
              ).catch((e: unknown) => {
                if (!(e instanceof ForbiddenException)) throw e;
              });
              allowedIncrease += await syncGrants();
              const row = await debitRow(op.k);
              if (!had && row)
                events.push({
                  type: 'debit',
                  amount: -row.delta,
                  id: row._id.toString(),
                  erased: false,
                });
            } else if (op.kind === 'read') {
              await at(() => credits.getCredits(user.userId));
              allowedIncrease += await syncGrants();
            } else if (op.kind === 'legacy') {
              await ledger.updateOne(
                { userId, reason, flowId: `f${op.k}` },
                { $unset: { 'metadata.grantTake': 1 } },
              );
            } else if (op.kind === 'deliver') {
              await credits.markFlowFulfilled(
                userId,
                `f${op.k}`,
                reason,
                'draft',
              );
            } else if (op.kind === 'refund') {
              const row = await debitRow(op.k);
              await at(() =>
                credits.refundFlowDebit(userId, `f${op.k}`, reason),
              );
              if (row && !(await debitRow(op.k))) {
                allowedIncrease += -row.delta;
                const ev = events.find(
                  (e) => e.type === 'debit' && e.id === row._id.toString(),
                );
                if (ev && ev.type === 'debit') ev.erased = true;
              }
            } else {
              await at(() =>
                credits.applyTopupPurchase({
                  userId: user.userId,
                  productId: 'topupsmall',
                  providerEventId: `ev-${user.userId}-${++seq}`,
                }),
              );
              events.push({ type: 'topup', amount: 10 });
              allowedIncrease += 10;
            }

            const after = await walletBalance();
            expect(after).toBeGreaterThanOrEqual(0);
            expect(after - before).toBeLessThanOrEqual(allowedIncrease);
            expect(after).toBeLessThanOrEqual(modelBalance());
            const [sum] = await ledger.aggregate<{ s: number }>([
              { $match: { userId } },
              { $group: { _id: null, s: { $sum: '$delta' } } },
            ]);
            expect(after).toBeLessThanOrEqual(sum?.s ?? 0);
          }
        }),
        {
          numRuns: 40,
          // Sabit karşı örnek: D gününün grant'inden kesim → gün döner, grant
          // yenilenir → iade (eski kod grant payını yeni güne ekleyip basıyordu).
          examples: [
            [
              [
                { kind: 'debit', k: 0, amount: 1 },
                { kind: 'days', n: 1 },
                { kind: 'read' },
                { kind: 'refund', k: 0 },
              ],
            ],
          ],
        },
      );
    }, 180_000);

    // ── Eşzamanlı karışık işlemler: kesim / teslim (rezervasyon+makbuz) / iade ──
    type ParOp =
      | { kind: 'debit'; k: number }
      | { kind: 'deliver'; k: number }
      | { kind: 'refund'; k: number }
      | { kind: 'topup' };
    const parOp: fc.Arbitrary<ParOp> = fc.oneof(
      fc.record({
        kind: fc.constant('debit' as const),
        k: fc.integer({ min: 0, max: 2 }),
      }),
      fc.record({
        kind: fc.constant('deliver' as const),
        k: fc.integer({ min: 0, max: 2 }),
      }),
      fc.record({
        kind: fc.constant('refund' as const),
        k: fc.integer({ min: 0, max: 2 }),
      }),
      fc.record({ kind: fc.constant('topup' as const) }),
    );

    it('property: eşzamanlı kesim/teslim/iade → bakiye = grant+topup ≥ 0, bakiye ≤ defter toplamı, teslim edilmiş kesim asla iade edilmez', async () => {
      const credits = t.app.get(AiCreditsService);
      const ledger = t.model('AiCreditLedger');
      const reason = 'VIRD_PROGRAM_DEBIT' as const;

      await fc.assert(
        fc.asyncProperty(
          fc.array(fc.array(parOp, { minLength: 1, maxLength: 4 }), {
            maxLength: 6,
          }),
          async (batches) => {
            const user = await newUser();
            const userId = oid(user);
            await credits.getCredits(user.userId);
            const delivered = new Set<number>();
            let seq = 0;
            const run = async (op: ParOp) => {
              if (op.kind === 'debit') {
                await credits
                  .debitCreditForFlow(userId, `p${op.k}`, false, 'h', reason, 3)
                  .catch((e: unknown) => {
                    if (!(e instanceof ForbiddenException)) throw e;
                  });
              } else if (op.kind === 'deliver') {
                // AiVirdService sırası: rezervasyon → taslak → makbuz.
                if (
                  await credits.reserveFlowDelivery(
                    userId,
                    `p${op.k}`,
                    reason,
                    randomUUID(),
                  )
                ) {
                  await credits.markFlowFulfilled(
                    userId,
                    `p${op.k}`,
                    reason,
                    'draft',
                  );
                  delivered.add(op.k);
                }
              } else if (op.kind === 'refund') {
                await credits.refundFlowDebit(userId, `p${op.k}`, reason);
              } else {
                await credits.applyTopupPurchase({
                  userId: user.userId,
                  productId: 'topupsmall',
                  providerEventId: `pev-${user.userId}-${++seq}`,
                });
              }
            };

            for (const batch of batches) {
              await Promise.all(batch.map(run));
              const w = await t
                .model('AiCreditWallet')
                .findOne({ userId })
                .lean<{
                  balance: number;
                  grantCredits: number;
                  topupCredits: number;
                }>();
              expect(w!.balance).toBeGreaterThanOrEqual(0);
              expect(w!.balance).toBe(w!.grantCredits + w!.topupCredits);
              const [sum] = await ledger.aggregate<{ s: number }>([
                { $match: { userId } },
                { $group: { _id: null, s: { $sum: '$delta' } } },
              ]);
              expect(w!.balance).toBeLessThanOrEqual(sum?.s ?? 0);
              for (const k of delivered) {
                expect(
                  await ledger.countDocuments({
                    userId,
                    reason,
                    flowId: `p${k}`,
                    'metadata.fulfilledRef': 'draft',
                  }),
                ).toBe(1);
              }
            }
          },
        ),
        { numRuns: 40 },
      );
    }, 180_000);
  });
});
