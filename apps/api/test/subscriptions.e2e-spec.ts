import { Types } from 'mongoose';
import request from 'supertest';
import { RevenueCatVerifierService } from '../src/modules/subscriptions/revenuecat-verifier.service';
import type { SubscriptionDocument } from '../src/modules/subscriptions/schemas/subscription.schema';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

// setup-env REVENUECAT_SECRET_API_KEY tanımlı → istemci yolu verifier'dan geçer.
describe('Subscriptions (e2e)', () => {
  let t: TestApp;
  let verifyPremium: jest.Mock;
  const RC_EXPIRES = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  beforeAll(async () => {
    t = await createTestApp();
    await syncIndexes(t.connection);
    const verifier = t.app.get<{ verifyPremium: jest.Mock }>(
      RevenueCatVerifierService,
    );
    verifyPremium = verifier.verifyPremium;
  });

  beforeEach(async () => {
    await clearCollections(t.connection);
    verifyPremium.mockReset().mockResolvedValue({
      active: true,
      productId: 'rc_annual',
      expiresAt: RC_EXPIRES,
      provider: 'apple',
    });
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

  it('POST: kendine abonelik yazabilir; GET listeler', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-1' });

    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);

    await request(t.http)
      .get('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .expect(200);
  });

  it('PATCH /:id rotası yok → 404; süresi geçmiş kayıt 2099 ile premium yapılamaz', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-patch' });
    const subModel = t.model('Subscription');
    const sub = await subModel.create({
      ...premiumPayload(user.userId, { status: 'expired' }),
      userId: new Types.ObjectId(user.userId),
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-02-01'),
    });

    await request(t.http)
      .patch(`/v1/subscriptions/${String(sub._id)}`)
      .set(bearer(user.accessToken))
      .send({ status: 'active', plan: 'premium', endDate: '2099-01-01' })
      .expect(404);

    const stored = await subModel
      .findById(sub._id)
      .lean<{ status?: string }>()
      .exec();
    expect(stored?.status).toBe('expired');
    const userDoc = await t
      .model<UserDocument>('User')
      .findById(user.userId)
      .lean()
      .exec();
    expect(userDoc?.isPremium).toBe(false);
  });

  it('DELETE /:id rotası yok → 404; kayıt silinmez', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-delete' });
    const subModel = t.model('Subscription');
    const sub = await subModel.create({
      ...premiumPayload(user.userId),
      userId: new Types.ObjectId(user.userId),
    });

    await request(t.http)
      .delete(`/v1/subscriptions/${String(sub._id)}`)
      .set(bearer(user.accessToken))
      .expect(404);

    expect(await subModel.findById(sub._id).lean().exec()).not.toBeNull();
  });

  it('RevenueCat aktif değilse POST → 403 SUBSCRIPTION_NOT_VERIFIED, isPremium false kalır', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-2' });
    verifyPremium.mockResolvedValue({ active: false });

    const res = await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(403);
    expect(JSON.stringify(res.body)).toContain('SUBSCRIPTION_NOT_VERIFIED');
    expect(verifyPremium).toHaveBeenCalledWith(user.userId);

    const userModel = t.model<UserDocument>('User');
    const doc = await userModel.findById(user.userId).lean().exec();
    expect(doc?.isPremium).toBe(false);
  });

  it('RevenueCat aktifse POST → 201, kayıt istemci değil RevenueCat değerleriyle', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-2b' });

    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(
        premiumPayload(user.userId, {
          productId: 'client_lie',
          endDate: new Date('2099-01-01').toISOString(),
        }),
      )
      .expect(201);

    const sub = await t
      .model<SubscriptionDocument>('Subscription')
      .findOne({}) // beforeEach koleksiyonları temizler — tek kayıt
      .lean()
      .exec();
    expect(sub?.productId).toBe('rc_annual');
    expect(sub?.endDate.getTime()).toBe(RC_EXPIRES.getTime());

    const doc = await t
      .model<UserDocument>('User')
      .findById(user.userId)
      .lean()
      .exec();
    expect(doc?.isPremium).toBe(true);
  });

  it('sync-user: RevenueCat aktif değilken payload true olsa bile isPremium:false', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-2c' });
    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);

    verifyPremium.mockResolvedValue({ active: false });
    const res = await request(t.http)
      .post(`/v1/subscriptions/sync-user/${user.userId}`)
      .set(bearer(user.accessToken))
      .send({ hasActivePremiumEntitlement: true, provider: 'apple' })
      .expect(201);
    expect(data<{ isPremium: boolean }>(res).isPremium).toBe(false);
  });

  it('sync-user: RevenueCat ulaşılamazsa (null) DB durumu korunur', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-2d' });
    await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);

    verifyPremium.mockResolvedValue(null);
    const res = await request(t.http)
      .post(`/v1/subscriptions/sync-user/${user.userId}`)
      .set(bearer(user.accessToken))
      .send({ hasActivePremiumEntitlement: false })
      .expect(201);
    expect(data<{ isPremium: boolean }>(res).isPremium).toBe(true);
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

  it('sync-user: RevenueCat entitlement yok → aktifler expired, isPremium:false', async () => {
    const user = await signIn(t.http, { sub: 'sub-user-8' });
    const createRes = await request(t.http)
      .post('/v1/subscriptions')
      .set(bearer(user.accessToken))
      .send(premiumPayload(user.userId))
      .expect(201);
    const created = data<{ _id: string }>(createRes);
    verifyPremium.mockResolvedValue({ active: false });

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
