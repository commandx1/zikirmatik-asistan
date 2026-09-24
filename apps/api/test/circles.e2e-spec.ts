/**
 * Zikir Halkası — HTTP katmanı e2e. Atomiklik/race circles.race.e2e-spec.ts'te
 * zaten kapsanıyor; burada rota davranışı, DTO doğrulama, yetkilendirme ve
 * tek-üyeli akışlar test edilir.
 * Önkoşul: pnpm db:test
 */
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { istanbulDateKey, shiftDateKey } from '../src/common/utils/date-keys';
import { CIRCLE_ERROR_CODE } from '../src/modules/circles/circles.constants';
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
    it('ücretsiz kullanıcı → 403 CIRCLE_PREMIUM_REQUIRED', async () => {
      const user = await newUser();
      const dhikrModel = t.model<DhikrDocument>('Dhikr');
      const dhikrId = await seedDhikr(dhikrModel);

      const res = await request(t.http)
        .post('/v1/circles')
        .set(bearer(user.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.PREMIUM_REQUIRED);
    });

    it('premium → 201, code deseni /^[A-HJ-NP-Z2-9]{8}$/', async () => {
      const user = await premiumUser();
      const { circle } = await seedActiveCircle(user);
      expect(circle.code).toMatch(/^[A-HJ-NP-Z2-9]{8}$/);
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

    it('hedef dolunca completed; sonraki katkı 403 CIRCLE_NOT_ACTIVE', async () => {
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

      const res = await contribute(creator, circle.id, dhikrId, 1);
      expect(res.status).toBe(403);
      expect(errCode(res)).toBe(CIRCLE_ERROR_CODE.NOT_ACTIVE);
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
