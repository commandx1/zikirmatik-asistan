/**
 * Mutabakat cronu (SubscriptionsService.reconcilePremiumStatuses) — gerçek
 * Mongo, Date dondurularak. API-SUB-18/19/20 + A-09 (grace uzatması).
 * Önkoşul: pnpm db:test
 */
import { Types } from 'mongoose';
import { SubscriptionsService } from '../src/modules/subscriptions/subscriptions.service';
import type { SubscriptionDocument } from '../src/modules/subscriptions/schemas/subscription.schema';
import type { UserDocument } from '../src/modules/users/schemas/user.schema';
import { atInstant } from './helpers/clock';
import { createTestApp, type TestApp } from './helpers/create-test-app';
import { clearCollections, syncIndexes } from './helpers/db';
import { signIn } from './helpers/fixtures';

const DAY = 24 * 60 * 60 * 1000;
const NOW = new Date('2026-06-15T12:00:00.000Z');

describe('Abonelik mutabakat cronu (e2e)', () => {
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

  const run = () =>
    atInstant(NOW, () =>
      t.app.get(SubscriptionsService).reconcilePremiumStatuses(),
    );

  async function seed(
    sub: string,
    opts: {
      isPremium: boolean;
      sub?: {
        status?: 'active' | 'expired';
        endDate: Date;
        plan?: 'premium' | 'free';
      };
    },
  ) {
    const user = await signIn(t.http, { sub });
    const userId = new Types.ObjectId(user.userId);
    await t
      .model<UserDocument>('User')
      .updateOne({ _id: userId }, { $set: { isPremium: opts.isPremium } });
    if (opts.sub) {
      await t.model<SubscriptionDocument>('Subscription').create({
        userId,
        plan: opts.sub.plan ?? 'premium',
        provider: 'apple',
        status: opts.sub.status ?? 'active',
        productId: 'premium_monthly',
        startDate: new Date(NOW.getTime() - 30 * DAY),
        endDate: opts.sub.endDate,
      });
    }
    return userId;
  }
  const premium = async (id: Types.ObjectId) =>
    (await t.model<UserDocument>('User').findById(id).lean().exec())?.isPremium;
  const subStatus = async (id: Types.ObjectId) =>
    (
      await t
        .model<SubscriptionDocument>('Subscription')
        .findOne({ userId: id })
        .lean()
        .exec()
    )?.status;

  it('SUB-19: süresi geçmiş active → expired ve isPremium false', async () => {
    const id = await seed('rec-expired', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime() - DAY) },
    });
    await run();
    expect(await subStatus(id)).toBe('expired');
    expect(await premium(id)).toBe(false);
  });

  it('SUB-19/18: aktif abonelik ama isPremium false → true (iki yönlü eşitleme)', async () => {
    const id = await seed('rec-upgrade', {
      isPremium: false,
      sub: { endDate: new Date(NOW.getTime() + 10 * DAY) },
    });
    await run();
    expect(await premium(id)).toBe(true);
    expect(await subStatus(id)).toBe('active');
  });

  it('SUB-19: aboneliği hiç olmayan premium bayraklı kullanıcı düşer', async () => {
    const id = await seed('rec-orphan', { isPremium: true });
    await run();
    expect(await premium(id)).toBe(false);
  });

  it('SUB-18: plan free (active, ileri tarihli) premium vermez', async () => {
    const id = await seed('rec-free', {
      isPremium: false,
      sub: { plan: 'free', endDate: new Date(NOW.getTime() + 10 * DAY) },
    });
    await run();
    expect(await premium(id)).toBe(false);
  });

  it('A-09: grace ile uzatılmış endDate (gelecekte) premium kalır', async () => {
    const id = await seed('rec-grace', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime() + 45 * DAY) },
    });
    await run();
    expect(await premium(id)).toBe(true);
    expect(await subStatus(id)).toBe('active');
  });

  it('SUB-20: endDate tam şimdi → premium kalır; 1 ms önce → düşer', async () => {
    const exact = await seed('rec-exact', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime()) },
    });
    const before = await seed('rec-before', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime() - 1) },
    });
    await run();
    expect(await premium(exact)).toBe(true);
    expect(await subStatus(exact)).toBe('active');
    expect(await premium(before)).toBe(false);
    expect(await subStatus(before)).toBe('expired');
  });

  it('birkaç kullanıcı tek koşuda doğru ayrışır; ikinci koşu aynı sonucu verir', async () => {
    const stillActive = await seed('rec-m1', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime() + DAY) },
    });
    const lapsed = await seed('rec-m2', {
      isPremium: true,
      sub: { endDate: new Date(NOW.getTime() - 2 * DAY) },
    });
    const missed = await seed('rec-m3', {
      isPremium: false,
      sub: { endDate: new Date(NOW.getTime() + 5 * DAY) },
    });
    const plain = await seed('rec-m4', { isPremium: false });
    const snapshot = async () => [
      await premium(stillActive),
      await premium(lapsed),
      await premium(missed),
      await premium(plain),
      await subStatus(lapsed),
    ];

    await run();
    const first = await snapshot();
    expect(first).toEqual([true, false, true, false, 'expired']);

    await run();
    expect(await snapshot()).toEqual(first);
  });
});
