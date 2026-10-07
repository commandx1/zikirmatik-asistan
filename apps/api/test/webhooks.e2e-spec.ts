import request from 'supertest';
import { Types } from 'mongoose';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import type { SubscriptionDocument } from '../src/modules/subscriptions/schemas/subscription.schema';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { bearer, data, signIn } from './helpers/fixtures';

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

  it('aynı olay tekrar (RevenueCat retry): tek abonelik belgesi, isPremium:true', async () => {
    // handleGrant event.id'yi providerEventId (unique sparse) olarak yazar.
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
    expect(await subModel.countDocuments({})).toBe(1);

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
  // ── QA kararları: A-09, WHK-15/B3, A-10 ──────────────────────────────────
  const DAY = 24 * 60 * 60 * 1000;
  const send = (payload: unknown) =>
    request(t.http)
      .post('/v1/webhooks/revenuecat')
      .set('Authorization', `Bearer ${SECRET}`)
      .send(payload as object)
      .expect(200);
  const isPremium = async (userId: string) =>
    (await t.model<UserDocument>('User').findById(userId).lean().exec())
      ?.isPremium;

  it('A-09: BILLING_ISSUE premium düşürmez; grace bitişi endDate olur, yalnız EXPIRATION düşürür', async () => {
    const user = await newUser('rc-billing');
    const ids = { app_user_id: user.userId, original_app_user_id: user.userId };
    await send(rcEvent({ ...ids, id: 'evt-bi-buy' }));

    const grace = Date.now() + 45 * DAY;
    await send(
      rcEvent({
        ...ids,
        id: 'evt-bi',
        type: 'BILLING_ISSUE',
        grace_period_expiration_at_ms: grace,
      }),
    );
    expect(await isPremium(user.userId)).toBe(true);
    const sub = await t
      .model<SubscriptionDocument>('Subscription')
      .findOne({ userId: new Types.ObjectId(user.userId) })
      .lean()
      .exec();
    expect(sub?.status).toBe('active');
    expect(sub?.endDate.getTime()).toBe(grace);

    await send(rcEvent({ ...ids, id: 'evt-bi-exp', type: 'EXPIRATION' }));
    expect(await isPremium(user.userId)).toBe(false);
  });

  it('WHK-15/B3: RENEWAL sonrası geç gelen eski EXPIRATION yeni dönemi düşürmez', async () => {
    const user = await newUser('rc-order');
    const ids = { app_user_id: user.userId, original_app_user_id: user.userId };
    const t0 = Date.now() - 40 * DAY;
    // 1. dönem (bitti), 2. dönem RENEWAL (aktif)
    await send(
      rcEvent({
        ...ids,
        id: 'evt-o-buy',
        purchased_at_ms: t0,
        expiration_at_ms: t0 + 30 * DAY,
        event_timestamp_ms: t0,
      }),
    );
    await send(
      rcEvent({
        ...ids,
        id: 'evt-o-renew',
        type: 'RENEWAL',
        purchased_at_ms: t0 + 30 * DAY,
        expiration_at_ms: t0 + 60 * DAY,
        event_timestamp_ms: t0 + 30 * DAY + 1000,
      }),
    );
    // 1. dönemin EXPIRATION'ı, RENEWAL'dan ÖNCE üretilmiş ama SONRA teslim edildi.
    await send(
      rcEvent({
        ...ids,
        id: 'evt-o-exp-old',
        type: 'EXPIRATION',
        expiration_at_ms: t0 + 30 * DAY,
        event_timestamp_ms: t0 + 30 * DAY,
      }),
    );

    expect(await isPremium(user.userId)).toBe(true);
    const active = await t.model<SubscriptionDocument>('Subscription').find({
      userId: new Types.ObjectId(user.userId),
      status: 'active',
      endDate: { $gte: new Date() },
    });
    expect(active).toHaveLength(1);

    // RENEWAL'dan sonra üretilmiş EXPIRATION ise düşürür.
    await send(
      rcEvent({
        ...ids,
        id: 'evt-o-exp-new',
        type: 'EXPIRATION',
        expiration_at_ms: Date.now(),
        event_timestamp_ms: Date.now(),
      }),
    );
    expect(await isPremium(user.userId)).toBe(false);
  });

  it('A-10: abonelik iadesi (CANCELLATION CUSTOMER_SUPPORT) anında etkisiz — EXPIRATION beklenir', async () => {
    const user = await newUser('rc-sub-refund');
    const ids = { app_user_id: user.userId, original_app_user_id: user.userId };
    await send(rcEvent({ ...ids, id: 'evt-sr-buy' }));
    await send(
      rcEvent({
        ...ids,
        id: 'evt-sr-cancel',
        type: 'CANCELLATION',
        cancel_reason: 'CUSTOMER_SUPPORT',
      }),
    );
    expect(await isPremium(user.userId)).toBe(true);
  });

  it('A-10: kredi paketi iadesi kalan bakiyeden düşer (önce topup, sonra grant), 0 altına inmez, olay başına bir kez', async () => {
    const user = await newUser('rc-topup-refund');
    const ids = { app_user_id: user.userId, original_app_user_id: user.userId };
    const userObjectId = new Types.ObjectId(user.userId);
    const walletModel = t.model<{ balance: number; topupCredits: number }>(
      'AiCreditWallet',
    );
    const balance = async () =>
      (await walletModel.findOne({ userId: userObjectId }).lean().exec())
        ?.balance;

    await send(
      rcEvent({
        ...ids,
        id: 'evt-tr-buy',
        type: 'NON_RENEWING_PURCHASE',
        product_id: 'topupsmall',
      }),
    );
    // Ücretsiz karşılama grant'i (3) → bakiye 13 = topup 10 + grant 3.
    const credits = await request(t.http)
      .get('/v1/ai/credits')
      .set(bearer(user.accessToken))
      .expect(200);
    expect(data<{ balance: number }>(credits).balance).toBe(13);

    const refund = rcEvent({
      ...ids,
      id: 'evt-tr-refund',
      type: 'CANCELLATION',
      cancel_reason: 'CUSTOMER_SUPPORT',
      product_id: 'topupsmall',
    });
    await send(refund);
    expect(await balance()).toBe(3);
    await send(refund); // RC retry → etkisiz
    expect(await balance()).toBe(3);

    // İkinci iade (başka olay): 3 - 10 → 0'da durur.
    await send({
      ...refund,
      event: { ...refund.event, id: 'evt-tr-refund-2' },
    });
    expect(await balance()).toBe(0);
    const wallet = await walletModel
      .findOne({ userId: userObjectId })
      .lean()
      .exec();
    expect(wallet?.topupCredits).toBe(0);

    const ledger = t.model('AiCreditLedger');
    expect(
      await ledger.countDocuments({ userId: userObjectId, reason: 'REFUND' }),
    ).toBe(2);

    // Abonelik ürünü için CANCELLATION kredi düşmez.
    await send(
      rcEvent({
        ...ids,
        id: 'evt-tr-sub-cancel',
        type: 'CANCELLATION',
        cancel_reason: 'CUSTOMER_SUPPORT',
      }),
    );
    expect(
      await ledger.countDocuments({ userId: userObjectId, reason: 'REFUND' }),
    ).toBe(2);
  });
});
