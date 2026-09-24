import request from 'supertest';
import { Types } from 'mongoose';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import type { SubscriptionDocument } from '../src/modules/subscriptions/schemas/subscription.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { data, signIn } from './helpers/fixtures';

const SECRET = 'test-rc-secret'; // setup-env.ts REVENUECAT_WEBHOOK_SECRET

function rcEvent(overrides: Record<string, unknown> = {}) {
  return {
    api_version: '1.0',
    event: {
      id: 'evt-1',
      type: 'INITIAL_PURCHASE',
      app_user_id: 'placeholder',
      original_app_user_id: 'placeholder',
      product_id: 'premium_monthly',
      store: 'APP_STORE',
      purchased_at_ms: Date.now(),
      expiration_at_ms: Date.now() + 30 * 24 * 60 * 60 * 1000,
      ...overrides,
    },
  };
}

describe('Webhooks — RevenueCat (e2e)', () => {
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

  async function newUser(sub: string) {
    return signIn(t.http, { sub });
  }

  it('secret yok → 401', async () => {
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .send(rcEvent())
      .expect(401);
  });

  it('yanlış secret → 401', async () => {
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', 'Bearer wrong-secret')
      .send(rcEvent())
      .expect(401);
  });

  it('SANDBOX event, bayrak yok → 200 ve etki yok', async () => {
    const user = await newUser('rc-sandbox');

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          app_user_id: user.userId,
          original_app_user_id: user.userId,
          environment: 'SANDBOX',
        }),
      )
      .expect(200);

    const subModel = t.model<SubscriptionDocument>('Subscription');
    expect(await subModel.countDocuments({})).toBe(0);
  });

  it('INITIAL_PURCHASE → subscriptions 1 kayıt, isPremium:true', async () => {
    const user = await newUser('rc-initial');

    const res = await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          app_user_id: user.userId,
          original_app_user_id: user.userId,
        }),
      )
      .expect(200);
    expect(data<{ received: boolean }>(res).received).toBe(true);

    const subModel = t.model<SubscriptionDocument>('Subscription');
    expect(await subModel.countDocuments({})).toBe(1);

    const userModel = t.model<UserDocument>('User');
    const doc = await userModel.findById(user.userId).lean().exec();
    expect(doc?.isPremium).toBe(true);
  });

  it('aynı olay tekrar: handleGrant idempotent DEĞİL — dedupe yok, her istek yeni bir abonelik kaydı yaratır (gerçek davranış)', async () => {
    // NOT: subscriptionsService.create() event.id'ye göre bir tekillik
    // kontrolü yapmıyor; RevenueCat aynı INITIAL_PURCHASE olayını retry
    // ederse her seferinde ayrı bir subscriptions belgesi oluşur. isPremium
    // sonucu yine de doğru kalıyor çünkü syncUserPremiumStatus "en az bir
    // aktif premium abonelik var mı" sorusuna bakıyor.
    const user = await newUser('rc-repeat');
    const payload = rcEvent({
      app_user_id: user.userId,
      original_app_user_id: user.userId,
    });

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(payload)
      .expect(200);
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(payload)
      .expect(200);

    const subModel = t.model<SubscriptionDocument>('Subscription');
    expect(await subModel.countDocuments({})).toBe(2);

    const userModel = t.model<UserDocument>('User');
    const doc = await userModel.findById(user.userId).lean().exec();
    expect(doc?.isPremium).toBe(true);
  });

  it('EXPIRATION → isPremium:false', async () => {
    const user = await newUser('rc-expire');

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          app_user_id: user.userId,
          original_app_user_id: user.userId,
        }),
      )
      .expect(200);

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          id: 'evt-expire',
          type: 'EXPIRATION',
          app_user_id: user.userId,
          original_app_user_id: user.userId,
        }),
      )
      .expect(200);

    const userModel = t.model<UserDocument>('User');
    const doc = await userModel.findById(user.userId).lean().exec();
    expect(doc?.isPremium).toBe(false);
  });

  it('expiration_at_ms yok → 200, kayıt yok', async () => {
    const user = await newUser('rc-no-exp');

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          app_user_id: user.userId,
          original_app_user_id: user.userId,
          expiration_at_ms: undefined,
        }),
      )
      .expect(200);

    const subModel = t.model<SubscriptionDocument>('Subscription');
    expect(await subModel.countDocuments({})).toBe(0);
  });

  it('app_user_id eşleşmeyen → 200 etkisiz', async () => {
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          app_user_id: '000000000000000000000000',
          original_app_user_id: '000000000000000000000000',
        }),
      )
      .expect(200);

    const subModel = t.model<SubscriptionDocument>('Subscription');
    expect(await subModel.countDocuments({})).toBe(0);
  });

  it('event alanı eksik → 200 {received:true}', async () => {
    const res = await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send({ api_version: '1.0' })
      .expect(200);

    expect(data<{ received: boolean }>(res)).toEqual({ received: true });
  });

  it('NON_RENEWING_PURCHASE topup → kredi +10, aynı event.id tekrar → duplicate/bakiye aynı, bilinmeyen ürün etkisiz', async () => {
    const user = await newUser('rc-topup');
    const walletModel = t.model('AiCreditWallet');
    const ledgerModel = t.model('AiCreditLedger');
    const userObjectId = new Types.ObjectId(user.userId);

    const topupPayload = rcEvent({
      id: 'evt-topup-1',
      type: 'NON_RENEWING_PURCHASE',
      app_user_id: user.userId,
      original_app_user_id: user.userId,
      product_id: 'topupsmall', // AI_CREDIT_DEFAULT_TOPUP_PRODUCTS: 10 kredi
    });

    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(topupPayload)
      .expect(200);

    let wallet = await walletModel
      .findOne({ userId: userObjectId })
      .lean()
      .exec();
    expect((wallet as unknown as { balance: number }).balance).toBe(10);

    // aynı event.id tekrar → duplicate_event, bakiye aynı kalır
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(topupPayload)
      .expect(200);

    wallet = await walletModel.findOne({ userId: userObjectId }).lean().exec();
    expect((wallet as unknown as { balance: number }).balance).toBe(10);
    expect(
      await ledgerModel.countDocuments({
        userId: userObjectId,
        reason: 'TOPUP_PURCHASE',
      }),
    ).toBe(1);

    // bilinmeyen ürün → 200, etkisiz
    await request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(
        rcEvent({
          id: 'evt-topup-unknown',
          type: 'NON_RENEWING_PURCHASE',
          app_user_id: user.userId,
          original_app_user_id: user.userId,
          product_id: 'not-a-real-product',
        }),
      )
      .expect(200);

    wallet = await walletModel.findOne({ userId: userObjectId }).lean().exec();
    expect((wallet as unknown as { balance: number }).balance).toBe(10);
  });
});
