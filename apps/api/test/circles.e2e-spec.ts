/**
 * Zikir Halkası — HTTP katmanı e2e. Atomiklik/race circles.race.e2e-spec.ts'te
 * zaten kapsanıyor; burada rota davranışı, DTO doğrulama, yetkilendirme ve
 * tek-üyeli akışlar test edilir.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { Types } from 'mongoose';
import {
  dateKeyInZone,
  istanbulDateKey,
  shiftDateKey,
} from '../src/common/utils/date-keys';
import { CIRCLE_ERROR_CODE } from '../src/modules/circles/circles.constants';
import {
  Circle,
  type CircleDocument,
} from '../src/modules/circles/schemas/circle.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
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
  type SignInResult,
} from './helpers/fixtures';

// bkz. ai.e2e-spec.ts errCode — ForbiddenException({code,message}) hem düz
// hem de Nest'in {message:{code,message}} sarmalamasıyla dönebilir.
type ErrorBody = { code?: string; message?: string | { code?: string } };
function errCode(res: { body: unknown }): string | undefined {
  const body = res.body as ErrorBody;
  return (
    body.code ??
    (typeof body.message === 'object' ? body.message?.code : undefined)
  );
}

describe('Zikir Halkası (e2e)', () => {
  let t: TestApp;

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
  });

  afterAll(async () => {
    await t?.close();
  });

  async function newUser() {
    return signIn(t.http, { sub: `e2e-circle-${randomUUID()}` });
  }

  async function premiumUser() {
    const user = await newUser();
    await makePremium(t.model<UserDocument>(User.name), user.userId);
    return user;
  }

  async function seedActiveCircle(
    creator: SignInResult,
    overrides: Record<string, unknown> = {},
  ) {
    const dhikrModel = t.model<DhikrDocument>('Dhikr');
    const dhikrId = await seedDhikr(dhikrModel);
    const res = await request(t.http)
      .post('/v1/circles')
      .set(bearer(creator.accessToken))
      .send({ dhikrId, goalCount: 100, ...overrides })
      .expect(201);
    return { dhikrId, circle: data<{ id: string; code: string }>(res) };
  }

  function contribute(
    user: SignInResult,
    circleId: string,
    dhikrId: string,
    count: number,
  ) {
    return request(t.http)
      .post('/v1/dhikr-logs')
      .set(bearer(user.accessToken))
      .send({
        userId: user.userId,
        dhikrId,
        count,
        targetCount: count,
        date: istanbulDateKey(new Date()),
        source: 'circle',
        circleId,
      });
  }

  describe('create', () => {
    it('ücretsiz kullanıcı → ilk halka 201, memberLimit 5', async () => {
      const user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);

      const res = await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      expect(data<{ memberLimit: number }>(res).memberLimit).toBe(5);
    });

    it('ücretsiz kullanıcı → ikinci aktif halka 403 CIRCLE_PREMIUM_REQUIRED', async () => {
      const user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);

      const res = await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.PREMIUM_REQUIRED);
    });

    it('CIR-03: ücretsiz kurucu, önceki halka closed/completed ise yeni halka kurabilir', async () => {
      const user = await newUser();
      const create = (dhikrId: string, goalCount = 100) =>
        request(t.http)
          .post('/v1/circles')
          .set(bearer(user.accessToken))
          .send({ dhikrId, goalCount });
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));

      const first = data<{ id: string }>(await create(dhikrId).expect(201));
      await create(dhikrId).expect(403);
      await request(t.http)
        .post(`/v1/circles/${first.id}/close`)
        .set(bearer(user.accessToken))
        .expect(201);

      const second = data<{ id: string }>(
        await create(dhikrId, 10).expect(201),
      );
      await create(dhikrId).expect(403);
      await contribute(user, second.id, dhikrId, 10).expect(201);
      const stored = await t
        .model<CircleDocument>(Circle.name)
        .findById(second.id)
        .lean();
      expect(stored?.status).toBe('completed');

      await create(dhikrId).expect(201);
    });

    it('CIR-51: kurucu premium’u kaybedince halka ve memberLimit sürer; yeni halka kurulamaz', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator);
      await t
        .model<UserDocument>(User.name)
        .updateOne({ _id: creator.userId }, { $set: { isPremium: false } });

      const detail = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(
        data<{ status: string; memberLimit: number }>(detail),
      ).toMatchObject({
        status: 'active',
        memberLimit: 200,
      });

      // 6. üye bile katılabilir: limit kuruluşta yazıldı, ücretsiz 5'e inmez.
      for (let i = 0; i < 5; i += 1) {
        const member = await newUser();
        await request(t.http)
          .post('/v1/circles/join')
          .set(bearer(member.accessToken))
          .send({ code: circle.code })
          .expect(201);
      }
      const res = await request(t.http)
        .post('/v1/circles')
        .set(bearer(creator.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.PREMIUM_REQUIRED);
    });

    it('premium → 201, code deseni /^[A-HJ-NP-Z2-9]{8}$/, memberLimit 200', async () => {
      const user = await premiumUser();
      const { circle } = await seedActiveCircle(user);
      expect(circle.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
      expect((circle as unknown as { memberLimit: number }).memberLimit).toBe(
        200,
      );
    });

    it('endDate geçmiş → 400', async () => {
      const user = await premiumUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({
          dhikrId,
          goalCount: 10,
          endDate: shiftDateKey(istanbulDateKey(new Date()), -1),
        })
        .expect(400);
    });

    it('goalCount 0 → 400', async () => {
      const user = await premiumUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({ dhikrId, goalCount: 0 })
        .expect(400);
    });
  });

  describe('preview', () => {
    it('tokensız 200, kişisel alan yok', async () => {
      const user = await premiumUser();
      const { circle } = await seedActiveCircle(user);

      const res = await request(t.http)
        .get(`/v1/circles/preview/${circle.code}`)
        .expect(200);
      const body = data<Record<string, unknown>>(res);
      expect(body).not.toHaveProperty('code');
      expect(body).not.toHaveProperty('myTotal');
      expect(body).not.toHaveProperty('members');
      expect(body).toMatchObject({ status: 'active', memberCount: 1 });
    });

    it('küçük harf/boşluklu kod normalize edilir', async () => {
      const user = await premiumUser();
      const { circle } = await seedActiveCircle(user);
      const messy = circle.code
        .toLowerCase()
        .replace(/(.{4})/, '$1-')
        .concat(' ');

      await request(t.http).get(`/v1/circles/preview/${messy}`).expect(200);
    });

    it('bilinmeyen kod → 404', async () => {
      await request(t.http).get('/v1/circles/preview/ZZZZZZZZ').expect(404);
    });
  });

  describe('join', () => {
    it('idempotent: 2 kez join → memberCount aynı', async () => {
      const creator = await premiumUser();
      const { circle } = await seedActiveCircle(creator);
      const joiner = await newUser();

      const first = await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(joiner.accessToken))
        .send({ code: circle.code })
        .expect(201);
      const second = await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(joiner.accessToken))
        .send({ code: circle.code })
        .expect(201);

      expect(data<{ memberCount: number }>(first).memberCount).toBe(2);
      expect(data<{ memberCount: number }>(second).memberCount).toBe(2);
    });

    it('ücretsiz kurucunun halkası 5 üyede dolar → 403 CIRCLE_FULL', async () => {
      const creator = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      const createRes = await request(t.http)
        .post('/v1/circles')
        .set(bearer(creator.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      const circle = data<{ code: string }>(createRes);

      // Kurucu dahil 5 üye: 4 katılımcı daha eklenir.
      for (let i = 0; i < 4; i += 1) {
        const member = await newUser();
        await request(t.http)
          .post('/v1/circles/join')
          .set(bearer(member.accessToken))
          .send({ code: circle.code })
          .expect(201);
      }

      const sixth = await newUser();
      const res = await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(sixth.accessToken))
        .send({ code: circle.code })
        .expect(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.FULL);
    });

    it('memberLimit alanı olmayan eski halka 5 üyeyi aşabilir (varsayılan 200)', async () => {
      const creator = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);
      const createRes = await request(t.http)
        .post('/v1/circles')
        .set(bearer(creator.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      const circle = data<{ id: string; code: string }>(createRes);

      // Alanı fiilen kaldırarak göç öncesi bir belgeyi taklit eder.
      await t
        .model<CircleDocument>(Circle.name)
        .updateOne({ _id: circle.id }, { $unset: { memberLimit: 1 } })
        .exec();

      // Kurucu dahil 6 üye: alan olmadan CIRCLE_FREE_MAX_MEMBERS (5) aşılırdı.
      for (let i = 0; i < 5; i += 1) {
        const member = await newUser();
        await request(t.http)
          .post('/v1/circles/join')
          .set(bearer(member.accessToken))
          .send({ code: circle.code })
          .expect(201);
      }
    });
  });

  describe('katkı / ilerleme', () => {
    it('3 üye × log → totalCount = Σ max; aynı üye 10→30→20 → 30 (monoton)', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator, {
        goalCount: 1_000_000,
      });
      const memberA = await newUser();
      const memberB = await newUser();
      for (const member of [memberA, memberB]) {
        await request(t.http)
          .post('/v1/circles/join')
          .set(bearer(member.accessToken))
          .send({ code: circle.code })
          .expect(201);
      }

      await contribute(creator, circle.id, dhikrId, 10).expect(201);
      await contribute(memberA, circle.id, dhikrId, 5).expect(201);
      await contribute(memberB, circle.id, dhikrId, 7).expect(201);

      const after1 = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ totalCount: number }>(after1).totalCount).toBe(22);

      // Aynı üye (creator) upsert filtresiyle kendi kaydını 10→30 günceller.
      await contribute(creator, circle.id, dhikrId, 30).expect(201);
      const after2 = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ totalCount: number }>(after2).totalCount).toBe(42);

      // Geri düşen bir sayım (20 < 30) toplamı asla geri almaz (monoton).
      await contribute(creator, circle.id, dhikrId, 20).expect(201);
      const after3 = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ totalCount: number }>(after3).totalCount).toBe(42);
    });

    it('A-03: halka kuruluş gününden önceki tarih → 400; bugün ve yarın → 201', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator);
      const today = istanbulDateKey(new Date());
      const send = (date: string) =>
        request(t.http)
          .post('/v1/dhikr-logs')
          .set(bearer(creator.accessToken))
          .send({
            userId: creator.userId,
            dhikrId,
            count: 3,
            targetCount: 3,
            date,
            source: 'circle',
            circleId: circle.id,
          });

      await send(shiftDateKey(today, -1)).expect(400);
      await send(today).expect(201);
      await send(shiftDateKey(today, 1)).expect(201);
    });

    it('A-03: kuruluş günü katkı yapanın saat diliminde — kurucudan batıdaki üye kendi "bugün"ünü yazabilir', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator);
      const zone = 'America/Los_Angeles';
      const laToday = dateKeyInZone(new Date(), zone);
      // Kuruluş anı: İstanbul'da laToday+1 01:00 = LA'da laToday 15:00.
      await t.model<CircleDocument>(Circle.name).collection.updateOne(
        { _id: new Types.ObjectId(circle.id) },
        {
          $set: {
            createdAt: new Date(`${shiftDateKey(laToday, 1)}T01:00:00+03:00`),
          },
        },
      );
      const send = (date: string, timezone?: string) =>
        request(t.http)
          .post('/v1/dhikr-logs')
          .set({
            ...bearer(creator.accessToken),
            ...(timezone ? { 'x-client-timezone': timezone } : {}),
          })
          .send({
            userId: creator.userId,
            dhikrId,
            count: 3,
            targetCount: 3,
            date,
            source: 'circle',
            circleId: circle.id,
          });

      // İstanbul'a göre (başlık yok) laToday kuruluştan önceki gün → 400.
      await send(laToday).expect(400);
      // LA'daki üye için aynı gün kuruluş günüdür → 201 (eski uygulama da başlığı gönderir).
      await send(laToday, zone).expect(201);
      await send(shiftDateKey(laToday, -1), zone).expect(400);
    });

    it('A-01: hedef dolunca completed; sonraki katkı KABUL edilir, toplam hedefi aşar, completed kalır', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator, {
        goalCount: 5,
      });

      await contribute(creator, circle.id, dhikrId, 5).expect(201);
      const after = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ status: string }>(after).status).toBe('completed');

      await contribute(creator, circle.id, dhikrId, 6).expect(201);
      const late = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ status: string }>(late).status).toBe('completed');
      expect(data<{ totalCount: number }>(late).totalCount).toBe(6);
    });

    it('A-21: ad verilmezse yanıtta name null, dhikr bilgisi döner', async () => {
      const creator = await premiumUser();
      const { circle } = await seedActiveCircle(creator);
      const res = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      const body = data<{
        name: string | null;
        dhikr: { name: { tr: string } };
      }>(res);
      expect(body.name).toBeNull();
      expect(body.dhikr.name.tr).toBeTruthy();
    });

    it('üye olmayan katkı → 403 CIRCLE_NOT_MEMBER', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator);
      const outsider = await newUser();

      const res = await contribute(outsider, circle.id, dhikrId, 5);
      expect(res.status).toBe(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.NOT_MEMBER);
    });

    it('farklı zikir → 400 CIRCLE_DHIKR_MISMATCH', async () => {
      const creator = await premiumUser();
      const { circle } = await seedActiveCircle(creator);
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const otherDhikrId = await seedDhikr(dhikrModel);

      const res = await contribute(creator, circle.id, otherDhikrId, 5);
      expect(res.status).toBe(400);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.DHIKR_MISMATCH);
    });
  });

  describe('leave / close', () => {
    it('close yalnız kurucu → CREATOR_ONLY', async () => {
      const creator = await premiumUser();
      const { circle } = await seedActiveCircle(creator);
      const joiner = await newUser();
      await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(joiner.accessToken))
        .send({ code: circle.code })
        .expect(201);

      const res = await request(t.http)
        .post(`/v1/circles/${circle.id}/close`)
        .set(bearer(joiner.accessToken))
        .expect(404);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.NOT_FOUND);

      // kurucu ayrılmaya çalışırsa CREATOR_ONLY.
      const leaveRes = await request(t.http)
        .post(`/v1/circles/${circle.id}/leave`)
        .set(bearer(creator.accessToken))
        .expect(403);
      expect(errCode(leaveRes)).toBe(CIRCLE_ERROR_CODE.CREATOR_ONLY);

      await request(t.http)
        .post(`/v1/circles/${circle.id}/close`)
        .set(bearer(creator.accessToken))
        .expect(201);
    });

    it('leave sonrası totalCount korunur', async () => {
      const creator = await premiumUser();
      const { dhikrId, circle } = await seedActiveCircle(creator, {
        goalCount: 1_000_000,
      });
      const joiner = await newUser();
      await request(t.http)
        .post('/v1/circles/join')
        .set(bearer(joiner.accessToken))
        .send({ code: circle.code })
        .expect(201);
      await contribute(joiner, circle.id, dhikrId, 15).expect(201);

      await request(t.http)
        .post(`/v1/circles/${circle.id}/leave`)
        .set(bearer(joiner.accessToken))
        .expect(201);

      const after = await request(t.http)
        .get(`/v1/circles/${circle.id}`)
        .set(bearer(creator.accessToken))
        .expect(200);
      expect(data<{ totalCount: number }>(after).totalCount).toBe(15);
    });
  });
});
