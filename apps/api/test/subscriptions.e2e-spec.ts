import request from 'supertest';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

describe('Subscriptions (e2e)', () => {
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

  function premiumPayload(
    userId: string,
    overrides: Record<string, unknown> = {},
  ) {
    return {
      userId,
      plan: 'premium',
      provider: 'apple',
      status: 'active',
      productId: 'premium_monthly',
      startDate: new Date().toISOString(),
      endDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      ...overrides,
    };
  }

  it('POST: kendine abonelik yazabilir; CRUD rotaları çalışır', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-1' });

    const createRes = await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);
    const created = data<{ _id: string }>(createRes);

    await request(t.http)
      .get('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .expect(200);

    const patchRes = await request(t.http)
      .patch(`/v1/subscriptions/${created._id}`)
      .set(bearer(user.accessToken))
      .send({ status: 'cancelled' })
      .expect(200);
    expect(data<{ status: string }>(patchRes).status).toBe('cancelled');

    await request(t.http)
      .delete(`/v1/subscriptions/${created._id}`)
      .set(bearer(user.accessToken))
      .expect(200);
  });

  it('BULGU: kullanıcı kendine premium abonelik yazıp isPremium:true yapabiliyor', async () => {
    // TODO(security): POST /v1/subscriptions yalnız "hedef userId == token
    // userId" doğrular; sunucu tarafında gerçek bir satın alma kanıtı
    // (RevenueCat receipt vb.) istemez — istemci doğrudan kendine premium
    // yazabilir.
    const user = await signIn(t.http, { sub: 'sub-user-2' });

    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);

    const userModel = t.model<UserDocument>('User');
    const doc = await userModel.findById(user.userId).lean().exec();
    expect(doc?.isPremium).toBe(true);
  });

  it('başkası için userId ile POST → 403', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-3' });
    const other = await signIn(t.http, { sub: 'sub-user-4' });

    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(other.userId))
      .expect(403);
  });

  it('GET ?userId=başkası → 403', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-5' });
    const other = await signIn(t.http, { sub: 'sub-user-6' });

    await request(t.http)
      .get('/v1/subscriptions')
      .query({ userId: other.userId })
      .set(bearer(user.accessToken))
      .expect(403);
  });

  it('sync-user: aktif entitlement varsa isPremium:true', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-7' });
    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);

    const res = await request(t.http)
      .post(`/v1/subscriptions/sync-user/${user.userId}`)
      .set(bearer(user.accessToken))
      .send({})
      .expect(201);

    expect(data<{ isPremium: boolean }>(res).isPremium).toBe(true);
  });

  it('sync-user: hasActivePremiumEntitlement:false → aktifler expired, isPremium:false', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-8' });
    const createRes = await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);
    const created = data<{ _id: string }>(createRes);

    const res = await request(t.http)
      .post(`/v1/subscriptions/sync-user/${user.userId}`)
      .set(bearer(user.accessToken))
      .send({ hasActivePremiumEntitlement: false, provider: 'apple' })
      .expect(201);

    expect(data<{ isPremium: boolean }>(res).isPremium).toBe(false);

    const getRes = await request(t.http)
      .get(`/v1/subscriptions/${created._id}`)
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ status: string }>(getRes).status).toBe('expired');
  });

  it('sync-user: başkası için → 403', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-9' });
    const other = await signIn(t.http, { sub: 'sub-user-10' });

    await request(t.http)
      .post(`/v1/subscriptions/sync-user/${other.userId}`)
      .set(bearer(user.accessToken))
      .send({})
      .expect(403);
  });
});
