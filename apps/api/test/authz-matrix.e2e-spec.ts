/**
 * Yetki matrisi e2e — docs/qa/davranis-katalogu.md Bölüm 1 / 25 (API-YTK-01..04).
 * Satırlar KATALOGDAN ELLE yazıldı (controller metadata'sından üretilmedi):
 * bir rota eklenir/kaldırılır ya da korumasını kaybederse bu tablo kırılır.
 * Önkoşul: pnpm db:test
 */
import { Types } from 'mongoose';
import request from 'supertest';
import { createAccessToken } from '../src/common/auth/access-token';
import type { DhikrLogDocument } from '../src/modules/dhikr-logs/schemas/dhikr-log.schema';
import type { DhikrDocument } from '../src/modules/dhikrs/schemas/dhikr.schema';
import type { SubscriptionDocument } from '../src/modules/subscriptions/schemas/subscription.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import {
  bearer,
  data,
  seedDhikr,
  signIn,
  type SignInResult,
} from './helpers/fixtures';

type Method = 'get' | 'post' | 'patch' | 'delete';
type Route = [Method, string];

const ID = '507f1f77bcf86cd799439011'; // geçerli biçimli, var olmayan ObjectId

// ---- Katalog tablosu: JWT korumalı her rota (guard validasyondan ÖNCE koşar) ----
const JWT_ROUTES: Route[] = [
  ['get', `/v1/users/${ID}`],
  ['patch', `/v1/users/${ID}/onboarding`],
  ['patch', `/v1/users/${ID}/preferences`],
  ['delete', `/v1/users/${ID}`],
  ['post', '/v1/dhikr-logs'],
  ['post', '/v1/dhikr-logs/bulk'],
  ['get', '/v1/dhikr-logs'],
  ['get', `/v1/dhikr-logs/${ID}`],
  ['delete', '/v1/dhikr-logs/by-dhikr'],
  ['patch', '/v1/dhikr-logs/favorite/by-dhikr'],
  ['get', `/v1/streaks/${ID}`],
  ['post', `/v1/streaks/${ID}/recalculate`],
  ['post', '/v1/streaks/recalculate-all'],
  ['get', '/v1/stats/summary'],
  ['post', '/v1/ai/recommendations'],
  ['get', '/v1/ai/recommendations'],
  ['get', '/v1/ai/quota'],
  ['get', '/v1/ai/credits'],
  ['patch', `/v1/ai/recommendations/${ID}/select`],
  ['post', '/v1/ai/vird-programs'],
  ['post', '/v1/ai/chat/conversations'],
  ['get', '/v1/ai/chat/conversations'],
  ['post', '/v1/ai/chat/conversations/stream'],
  ['post', `/v1/ai/chat/conversations/${ID}/messages`],
  ['get', `/v1/ai/chat/conversations/${ID}/messages`],
  ['post', `/v1/ai/chat/conversations/${ID}/messages/stream`],
  ['post', '/v1/subscriptions'],
  ['get', '/v1/subscriptions'],
  ['get', `/v1/subscriptions/${ID}`],
  ['post', `/v1/subscriptions/sync-user/${ID}`],
  ['post', '/v1/user-dhikrs'],
  ['get', '/v1/user-dhikrs'],
  ['patch', '/v1/user-dhikrs/some-client-id'],
  ['delete', '/v1/user-dhikrs/some-client-id'],
  ['get', '/v1/vird/programs'],
  ['post', '/v1/vird/programs'],
  ['get', `/v1/vird/programs/${ID}`],
  ['patch', `/v1/vird/programs/${ID}`],
  ['delete', `/v1/vird/programs/${ID}`],
  ['post', `/v1/vird/programs/${ID}/activate`],
  ['get', '/v1/vird/today'],
  ['get', '/v1/vird/history'],
  ['post', '/v1/circles'],
  ['get', '/v1/circles'],
  ['post', '/v1/circles/join'],
  ['get', `/v1/circles/${ID}`],
  ['post', `/v1/circles/${ID}/leave`],
  ['post', `/v1/circles/${ID}/close`],
];

// Admin secret (x-admin-secret) rotaları.
const ADMIN_ROUTES: Route[] = [
  ['post', '/v1/dhikrs'],
  ['patch', `/v1/dhikrs/${ID}`],
  ['delete', `/v1/dhikrs/${ID}`],
  ['post', '/v1/special-days'],
  ['patch', `/v1/special-days/${ID}`],
  ['delete', `/v1/special-days/${ID}`],
];

// Token olmadan 200 dönmesi gereken açık rotalar (kayıt gerektirmeyenler).
const PUBLIC_GET_ROUTES: string[] = [
  '/health',
  '/app-config',
  '/v1/dhikrs',
  '/v1/dhikrs/verified-active',
  '/v1/dhikr-collections',
  '/v1/special-days',
  '/v1/special-days/home',
  '/v1/vird/templates',
];

describe('Yetki matrisi (e2e)', () => {
  let t: TestApp;
  let userA: SignInResult;
  let userB: SignInResult;

  const call = (method: Method, path: string) => request(t.http)[method](path);

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
    userA = await signIn(t.http, { sub: 'authz-a' });
    userB = await signIn(t.http, { sub: 'authz-b' });
  });

  afterAll(async () => {
    await t?.close();
  });

  // ---------------------------------------------------------------- API-YTK-01
  describe('API-YTK-01: tokensız JWT rotaları → 401', () => {
    it.each(JWT_ROUTES)('%s %s', async (method, path) => {
      await call(method, path).send({}).expect(401);
    });
  });

  // ---------------------------------------------------------------- API-YTK-02
  describe('API-YTK-02: bozuk / süresi geçmiş / yanlış imzalı token → 401', () => {
    const SECRET = 'e2e-access'; // setup-env AUTH_ACCESS_TOKEN_SECRET
    const forged = () =>
      createAccessToken({
        userId: new Types.ObjectId().toHexString(),
        secret: 'wrong-secret',
        ttlSeconds: 3600,
      });
    const expired = () => {
      const spy = jest.spyOn(Date, 'now').mockReturnValue(1_000_000_000);
      try {
        return createAccessToken({
          userId: new Types.ObjectId().toHexString(),
          secret: SECRET,
          ttlSeconds: 60,
        });
      } finally {
        spy.mockRestore();
      }
    };
    const nonObjectIdSub = () =>
      createAccessToken({
        userId: 'not-an-id',
        secret: SECRET,
        ttlSeconds: 60,
      });

    const headers: [string, () => string][] = [
      ['rastgele metin', () => 'Bearer garbage'],
      ['boş Bearer', () => 'Bearer '],
      ['3 parçalı ama bozuk', () => 'Bearer a.b.c'],
      ['yanlış imzalı', () => `Bearer ${forged()}`],
      ['süresi geçmiş', () => `Bearer ${expired()}`],
      ['sub ObjectId değil', () => `Bearer ${nonObjectIdSub()}`],
      ['Basic şeması', () => 'Basic abc123'],
    ];

    // Tüm rotalar × tüm bozuk token türleri: 1 temsilci + hepsi tek bir türle.
    it.each(headers)('tüm JWT rotaları: %s', async (_name, header) => {
      const value = header();
      for (const [method, path] of JWT_ROUTES) {
        const res = await call(method, path).set('Authorization', value);
        expect({ route: `${method} ${path}`, status: res.status }).toEqual({
          route: `${method} ${path}`,
          status: 401,
        });
      }
    });
  });

  // ---------------------------------------------------------------- API-YTK-04
  describe('API-YTK-04: admin rotaları (x-admin-secret)', () => {
    it.each(ADMIN_ROUTES)('%s %s — header yok → 401', async (m, p) => {
      await call(m, p).send({}).expect(401);
    });

    it.each(ADMIN_ROUTES)('%s %s — yanlış secret → 401', async (m, p) => {
      await call(m, p).set('x-admin-secret', 'nope').send({}).expect(401);
    });

    it.each(ADMIN_ROUTES)(
      "%s %s — kullanıcı token'ı yetmez → 401",
      async (m, p) => {
        await call(m, p).set(bearer(userA.accessToken)).send({}).expect(401);
      },
    );

    it.each(ADMIN_ROUTES)(
      "%s %s — doğru secret guard'ı geçer (401 değil)",
      async (m, p) => {
        const res = await call(m, p)
          .set('x-admin-secret', 'test-admin-secret')
          .send({});
        expect(res.status).not.toBe(401);
        expect(res.status).toBeLessThan(500);
      },
    );
  });

  describe('iç rotalar: kampanya + webhook secret', () => {
    it('POST /internal/campaigns/:campaign — x-campaign-secret yok/yanlış → 401', async () => {
      await request(t.http).post('/internal/campaigns/winback').expect(401);
      await request(t.http)
        .post('/internal/campaigns/winback')
        .set('x-campaign-secret', 'wrong')
        .expect(401);
      // kullanıcı token'ı ve admin secret bu rota için geçersiz
      await request(t.http)
        .post('/internal/campaigns/winback')
        .set(bearer(userA.accessToken))
        .set('x-admin-secret', 'test-admin-secret')
        .expect(401);
    });

    it('POST /internal/campaigns/:campaign — doğru secret → 200 (dryRun)', async () => {
      await request(t.http)
        .post('/internal/campaigns/winback')
        .set('x-campaign-secret', 'test-campaign-secret')
        .send({ dryRun: true })
        .expect(200);
    });

    it('POST /v1/webhooks/revenuecat — Authorization yok/yanlış → 401', async () => {
      await request(t.http)
        .post('/v1/webhooks/revenuecat')
        .send({})
        .expect(401);
      await request(t.http)
        .post('/v1/webhooks/revenuecat')
        .set('Authorization', 'Bearer wrong')
        .send({})
        .expect(401);
      await request(t.http)
        .post('/v1/webhooks/revenuecat')
        .set(bearer(userA.accessToken)) // kullanıcı JWT'si webhook secret'ı değildir
        .send({})
        .expect(401);
    });

    it("POST /v1/webhooks/revenuecat — doğru secret (Bearer'lı/'siz) → 200", async () => {
      await request(t.http)
        .post('/v1/webhooks/revenuecat')
        .set('Authorization', 'Bearer test-rc-secret')
        .send({})
        .expect(200);
      await request(t.http)
        .post('/v1/webhooks/revenuecat')
        .set('Authorization', 'test-rc-secret')
        .send({})
        .expect(200);
    });
  });

  // ------------------------------------------------------------ açık rotalar
  describe('açık rotalar: tokensız 200', () => {
    it.each(PUBLIC_GET_ROUTES)('GET %s', async (path) => {
      await request(t.http).get(path).expect(200);
    });

    it('GET /v1/dhikrs/:id, /lookup, /v1/dhikr-collections/:key, special-days/:id(+/detail), vird/templates/:key, circles/preview/:code', async () => {
      const dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'), {
        nameArabic: 'سبحان الله',
        transliteration: { tr: 'subhanallah', en: 'subhanallah' },
      });
      await request(t.http).get(`/v1/dhikrs/${dhikrId}`).expect(200);
      await request(t.http)
        .get('/v1/dhikrs/lookup')
        .query({ transliteration: 'subhanallah' })
        .expect(200);

      const sd = await t.model('SpecialDay').create({
        name: { tr: 'Gün', en: 'Day' },
        type: 'kandil',
        date: '2026-12-01',
        hijriDate: '1448-06-01',
      });
      await request(t.http)
        .get(`/v1/special-days/${String(sd._id)}`)
        .expect(200);
      await request(t.http)
        .get(`/v1/special-days/${String(sd._id)}/detail`)
        .expect(200);

      const created = await request(t.http)
        .post('/v1/circles')
        .set(bearer(userA.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      const code = data<{ code: string }>(created).code;
      await request(t.http).get(`/v1/circles/preview/${code}`).expect(200);

      await t.model('VirdTemplate').create({
        key: 'authz-tpl',
        kind: 'routine',
        title: { tr: 'Ş', en: 'T' },
        description: { tr: 'a', en: 'a' },
        isActive: true,
        phases: [],
      });
      await request(t.http).get(`/v1/vird/templates/authz-tpl`).expect(200);
    });

    it('GET /v1/dhikr-collections/:key (seed varsa) tokensız 200', async () => {
      await t.model('DhikrCollection').create({
        key: 'authz-coll',
        label: { tr: 'K', en: 'C' },
        category: 'gunluk',
        dhikrIds: [],
        dhikrCount: 0,
        isActive: true,
      });
      await request(t.http).get('/v1/dhikr-collections/authz-coll').expect(200);
    });

    it('opsiyonel JWT: bozuk Bearer ile bile devices/register ve events 200 (misafir gibi)', async () => {
      const junk = { Authorization: 'Bearer junk' };
      await request(t.http)
        .post('/v1/devices/register')
        .set(junk)
        .send({ deviceId: 'authz-device-1', platform: 'ios' })
        .expect(200);
      await request(t.http)
        .post('/v1/events')
        .set(junk)
        .send({
          deviceId: 'authz-device-1',
          events: [{ name: 'app_open', ts: new Date().toISOString() }],
        })
        .expect(200);
    });

    it('tokensız: devices/register, devices/unlink, events → 200', async () => {
      await request(t.http)
        .post('/v1/devices/register')
        .send({ deviceId: 'authz-device-2', platform: 'android' })
        .expect(200);
      await request(t.http)
        .post('/v1/devices/unlink')
        .send({ deviceId: 'authz-device-2' })
        .expect(200);
      await request(t.http)
        .post('/v1/events')
        .send({
          deviceId: 'authz-device-2',
          events: [{ name: 'app_open', ts: new Date().toISOString() }],
        })
        .expect(200);
    });

    it('auth: provider/verify, refresh, logout bearer istemez (401 yalnız geçersiz refresh)', async () => {
      await request(t.http)
        .post('/v1/auth/provider/verify')
        .send({})
        .expect(400);
      await request(t.http)
        .post('/v1/auth/refresh')
        .send({ refreshToken: 'junk' })
        .expect(401);
      await request(t.http)
        .post('/v1/auth/logout')
        .send({ refreshToken: 'junk' })
        .expect(204);
    });

    it('PATCH/DELETE /v1/subscriptions/:id rotaları kaldırıldı → 404 (token olsa da)', async () => {
      await request(t.http)
        .patch(`/v1/subscriptions/${ID}`)
        .set(bearer(userA.accessToken))
        .send({ status: 'active' })
        .expect(404);
      await request(t.http)
        .delete(`/v1/subscriptions/${ID}`)
        .set(bearer(userA.accessToken))
        .expect(404);
    });
  });

  // ---------------------------------------------------------------- API-YTK-03
  describe('API-YTK-03: başkasının kaynağı (A sahibi, B saldırgan)', () => {
    const today = new Date().toISOString().slice(0, 10);
    let dhikrId: string;

    beforeEach(async () => {
      dhikrId = await seedDhikr(t.model<DhikrDocument>('Dhikr'));
    });

    const asB = (method: Method, path: string) =>
      call(method, path).set(bearer(userB.accessToken));

    it('users/:id GET, PATCH onboarding, PATCH preferences, DELETE → 403; hesap silinmez', async () => {
      await asB('get', `/v1/users/${userA.userId}`).expect(403);
      await asB('patch', `/v1/users/${userA.userId}/onboarding`)
        .send({ purpose: 'x' })
        .expect(403);
      await asB('patch', `/v1/users/${userA.userId}/preferences`)
        .send({ theme: 'dark' })
        .expect(403);
      await asB('delete', `/v1/users/${userA.userId}`).expect(403);

      const doc = await t
        .model<{ purpose?: string; theme?: string }>('User')
        .findById(userA.userId)
        .lean();
      expect(doc).not.toBeNull();
      expect(doc?.purpose).toBeUndefined();
    });

    it('dhikr-logs: gövde userId yok sayılır; GET/:id → 404; liste/silme/favori yalnız kendi kapsamı', async () => {
      const logRes = await call('post', '/v1/dhikr-logs')
        .set(bearer(userA.accessToken))
        .send({
          userId: userA.userId,
          dhikrId,
          count: 3,
          targetCount: 33,
          date: today,
        })
        .expect(201);
      const logId = data<{ _id: string }>(logRes)._id;

      // B, gövdede A'nın userId'sini göndererek A adına yazamaz.
      const forgedRes = await asB('post', '/v1/dhikr-logs')
        .send({
          userId: userA.userId,
          dhikrId,
          count: 7,
          targetCount: 33,
          date: today,
        })
        .expect(201);
      expect(data<{ userId: string }>(forgedRes).userId).toBe(userB.userId);
      const bulkRes = await asB('post', '/v1/dhikr-logs/bulk')
        .send({
          items: [
            {
              userId: userA.userId,
              dhikrId,
              count: 1,
              targetCount: 1,
              date: '2026-01-01',
            },
          ],
        })
        .expect(201);
      expect(JSON.stringify(bulkRes.body)).not.toContain(userA.userId);

      await asB('get', `/v1/dhikr-logs/${logId}`).expect(404);

      // ?userId=A verilse de sunucu token sahibine zorlar.
      const list = await asB('get', '/v1/dhikr-logs')
        .query({ userId: userA.userId })
        .expect(200);
      expect(
        data<{ userId: string }[]>(list).every(
          (l) => l.userId === userB.userId,
        ),
      ).toBe(true);

      // B'nin by-dhikr silmesi/favorisi A'nın kaydına dokunmaz.
      await asB('delete', '/v1/dhikr-logs/by-dhikr')
        .query({ dhikrId })
        .expect(200);
      await asB('patch', '/v1/dhikr-logs/favorite/by-dhikr')
        .send({ dhikrId, isFavorite: true })
        .expect(200);
      const aLog = await t
        .model<DhikrLogDocument>('DhikrLog')
        .findById(logId)
        .lean();
      expect(aLog).not.toBeNull();
      expect(aLog?.isFavorite).toBeFalsy();
      expect(
        await t
          .model<DhikrLogDocument>('DhikrLog')
          .countDocuments({ userId: new Types.ObjectId(userA.userId) }),
      ).toBe(1);
    });

    it('streaks/:userId GET + recalculate → 403; recalculate-all herkese 403', async () => {
      await asB('get', `/v1/streaks/${userA.userId}`).expect(403);
      await asB('post', `/v1/streaks/${userA.userId}/recalculate`).expect(403);
      await asB('post', '/v1/streaks/recalculate-all').expect(403);
      await call('post', '/v1/streaks/recalculate-all')
        .set(bearer(userA.accessToken))
        .expect(403);
    });

    it("stats/summary yalnız kendi: A loglarken B'nin özeti değişmez", async () => {
      const before = await asB('get', '/v1/stats/summary').expect(200);
      await call('post', '/v1/dhikr-logs')
        .set(bearer(userA.accessToken))
        .send({
          userId: userA.userId,
          dhikrId,
          count: 50,
          targetCount: 33,
          date: today,
        })
        .expect(201);
      const after = await asB('get', '/v1/stats/summary').expect(200);
      expect(after.body).toEqual(before.body);
    });

    it('ai: recommendations liste/select yalnız kendi (select başkasının → 404)', async () => {
      for (let i = 0; i < 3; i++)
        await seedDhikr(t.model<DhikrDocument>('Dhikr'));
      const created = await call('post', '/v1/ai/recommendations')
        .set(bearer(userA.accessToken))
        .send({
          userId: userA.userId,
          freeText: 'huzur',
          flowId: '3f2b6d0e-8a52-4c1e-9a7b-1b2c3d4e5f60',
        })
        .expect(201);
      const body = data<{ recommendationId: string; recommendedIds: string[] }>(
        created,
      );

      const list = await asB('get', '/v1/ai/recommendations').expect(200);
      expect(data<unknown[]>(list)).toHaveLength(0);

      await asB(
        'patch',
        `/v1/ai/recommendations/${body.recommendationId}/select`,
      )
        .send({ selectedDhikrId: body.recommendedIds[0] })
        .expect(404);
      const stored = await t
        .model<{ selectedDhikrId?: unknown }>('AiRecommendation')
        .findById(body.recommendationId)
        .lean();
      expect(stored?.selectedDhikrId).toBeUndefined();

      // Gövdedeki userId'si A olan istek B'nin tokenıyla: B adına işlenir ya da reddedilir, A'ya yazılmaz.
      const forged = await asB('post', '/v1/ai/recommendations').send({
        userId: userA.userId,
        freeText: 'huzur',
        flowId: '4f2b6d0e-8a52-4c1e-9a7b-1b2c3d4e5f61',
      });
      expect(forged.status).toBeLessThan(500);
      const aRecs = await t
        .model('AiRecommendation')
        .countDocuments({ userId: new Types.ObjectId(userA.userId) });
      expect(aRecs).toBe(1);
    });

    it('ai chat: konuşma listesi yalnız kendi; başkasının konuşmasında mesaj GET/POST/stream → 404', async () => {
      const created = await call('post', '/v1/ai/chat/conversations')
        .set(bearer(userA.accessToken))
        .send({ firstMessage: 'selam' })
        .expect(201);
      const convId = data<{ conversation: { _id: string } }>(created)
        .conversation._id;

      const list = await asB('get', '/v1/ai/chat/conversations').expect(200);
      expect(JSON.stringify(list.body)).not.toContain(convId);

      await asB('get', `/v1/ai/chat/conversations/${convId}/messages`).expect(
        404,
      );
      await asB('post', `/v1/ai/chat/conversations/${convId}/messages`)
        .send({ message: 'x' })
        .expect(404);
      const stream = await asB(
        'post',
        `/v1/ai/chat/conversations/${convId}/messages/stream`,
      ).send({ message: 'x' });
      expect(stream.status).toBe(404);
    });

    it('subscriptions: gövde userId / ?userId / sync-user başkasına 403; GET/:id başkasının → 404', async () => {
      const sub = await t.model<SubscriptionDocument>('Subscription').create({
        userId: new Types.ObjectId(userA.userId),
        plan: 'premium',
        provider: 'google',
        status: 'active',
        productId: 'p',
        startDate: new Date(),
        endDate: new Date(Date.now() + 86_400_000),
      });
      await asB('post', '/v1/subscriptions')
        .send({
          userId: userA.userId,
          plan: 'premium',
          provider: 'google',
          status: 'active',
          productId: 'p',
          startDate: new Date().toISOString(),
          endDate: new Date(Date.now() + 86_400_000).toISOString(),
        })
        .expect(403);
      await asB('get', '/v1/subscriptions')
        .query({ userId: userA.userId })
        .expect(403);
      await asB('post', `/v1/subscriptions/sync-user/${userA.userId}`)
        .send({})
        .expect(403);
      await asB('get', `/v1/subscriptions/${String(sub._id)}`).expect(404);
      await call('get', `/v1/subscriptions/${String(sub._id)}`)
        .set(bearer(userA.accessToken))
        .expect(200);
    });

    it("user-dhikrs: PATCH/DELETE başkasının clientId'si → 404; liste yalnız kendi", async () => {
      await call('post', '/v1/user-dhikrs')
        .set(bearer(userA.accessToken))
        .send({ clientId: 'a-private', name: 'Gizli' })
        .expect(201);
      await asB('patch', '/v1/user-dhikrs/a-private')
        .send({ name: 'Ele geçirildi' })
        .expect(404);
      await asB('delete', '/v1/user-dhikrs/a-private').expect(404);
      const list = await asB('get', '/v1/user-dhikrs').expect(200);
      expect(JSON.stringify(list.body)).not.toContain('a-private');
      const stored = await t
        .model<{ name?: string }>('UserDhikr')
        .findOne({ clientId: 'a-private' })
        .lean();
      expect(stored?.name).toBe('Gizli');
    });

    it('vird: programs/:id GET/PATCH/DELETE/activate başkasının → 404; liste yalnız kendi', async () => {
      const created = await call('post', '/v1/vird/programs')
        .set(bearer(userA.accessToken))
        .send({
          title: { tr: 'A', en: 'A' },
          kind: 'routine',
          startDate: today,
          phases: [
            {
              fromDay: 1,
              slots: { morning: [{ dhikrId, target: 5 }] },
            },
          ],
        })
        .expect(201);
      const programId = data<{ _id: string }>(created)._id;

      await asB('get', `/v1/vird/programs/${programId}`).expect(404);
      await asB('patch', `/v1/vird/programs/${programId}`)
        .send({ title: { tr: 'x', en: 'x' } })
        .expect(404);
      await asB('post', `/v1/vird/programs/${programId}/activate`).expect(404);
      await asB('delete', `/v1/vird/programs/${programId}`).expect(404);
      await asB('get', '/v1/vird/today')
        .query({ programId })
        .expect((res) => {
          // başkasının programı sızdırılmaz: 404 ya da boş/null içerik
          expect(JSON.stringify(res.body)).not.toContain(programId);
        });
      const list = await asB('get', '/v1/vird/programs').expect(200);
      expect(data<unknown[]>(list)).toHaveLength(0);
      expect(
        await t
          .model('VirdProgram')
          .countDocuments({ _id: new Types.ObjectId(programId) }),
      ).toBe(1);
    });

    it('circles: üye olmayan GET/:id, leave, close → 404; preview kişisel veri sızdırmaz', async () => {
      const created = await call('post', '/v1/circles')
        .set(bearer(userA.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      const circle = data<{ id: string; code: string }>(created);

      await asB('get', `/v1/circles/${circle.id}`).expect(404);
      await asB('post', `/v1/circles/${circle.id}/leave`).expect(404);
      await asB('post', `/v1/circles/${circle.id}/close`).expect(404);
      const mine = await asB('get', '/v1/circles').expect(200);
      expect(data<unknown[]>(mine)).toHaveLength(0);

      const preview = await request(t.http)
        .get(`/v1/circles/preview/${circle.code}`)
        .expect(200);
      const text = JSON.stringify(preview.body);
      expect(text).not.toContain(userA.userId);
      expect(text).not.toContain('memberIds');
      expect(text).not.toContain('creatorId');
    });

    it('circles: halkaya üye (kurucu olmayan) close → 404 (katalog satırıyla uyumlu)', async () => {
      const created = await call('post', '/v1/circles')
        .set(bearer(userA.accessToken))
        .send({ dhikrId, goalCount: 100 })
        .expect(201);
      const circle = data<{ id: string; code: string }>(created);
      await asB('post', '/v1/circles/join')
        .send({ code: circle.code })
        .expect(201);
      await asB('post', `/v1/circles/${circle.id}/close`).expect(404);
    });
  });
});
