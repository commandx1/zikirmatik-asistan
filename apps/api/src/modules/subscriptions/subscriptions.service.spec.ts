import {
  ForbiddenException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Types } from 'mongoose';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

type ExpireSubscriptionsFilter = {
  userId: Types.ObjectId;
  plan: 'premium';
  status: 'active';
  provider?: 'apple' | 'google';
};

type ExpireSubscriptionsUpdate = {
  $set: {
    status: 'expired';
    endDate: Date;
  };
};

type UpdateManyResult = {
  exec: jest.Mock;
};

type UpdateManyFn = (
  filter: ExpireSubscriptionsFilter,
  update: ExpireSubscriptionsUpdate,
) => UpdateManyResult;

type FindOneAndUpdateResult = {
  lean: () => { exec: () => Promise<{ _id: string } | null> };
};

type FindOneAndUpdateFn = (
  filter: { providerEventId: string },
  update: { $setOnInsert: Record<string, unknown> },
  options: { upsert: true; returnDocument: 'after' },
) => FindOneAndUpdateResult;

describe('SubscriptionsService', () => {
  const subscriptionModel = {
    updateMany: jest.fn(() => ({
      exec: jest.fn(),
    })) as unknown as jest.MockedFunction<UpdateManyFn>,
    exists: jest.fn(),
    create: jest.fn(),
    findOneAndUpdate:
      jest.fn() as unknown as jest.MockedFunction<FindOneAndUpdateFn>,
  };
  const verifier = { verifyPremium: jest.fn() };
  let env: Record<string, string | undefined> = {};
  const configService = { get: (key: string) => env[key] };
  const userModel = {
    exists: jest.fn(),
    findById: jest.fn(),
    updateOne: jest.fn(),
  };

  let service: SubscriptionsService;

  beforeEach(() => {
    subscriptionModel.updateMany.mockReset();
    subscriptionModel.exists.mockReset();
    userModel.exists.mockReset();
    userModel.findById.mockReset();
    userModel.updateOne.mockReset();

    subscriptionModel.updateMany.mockImplementation(() => ({
      exec: jest.fn(),
    }));
    subscriptionModel.exists.mockResolvedValue(null);
    userModel.exists.mockResolvedValue({ _id: 'user' });
    userModel.findById.mockReturnValue({
      lean: () => ({
        exec: () => ({ _id: '507f1f77bcf86cd799439011', isPremium: false }),
      }),
    });
    userModel.updateOne.mockResolvedValue({ acknowledged: true });

    subscriptionModel.create.mockReset();
    subscriptionModel.create.mockImplementation((doc: unknown) =>
      Promise.resolve({ toObject: () => doc }),
    );
    subscriptionModel.findOneAndUpdate.mockReset();
    subscriptionModel.findOneAndUpdate.mockReturnValue({
      lean: () => ({ exec: () => Promise.resolve({ _id: 'sub-1' }) }),
    });
    verifier.verifyPremium.mockReset();
    env = { NODE_ENV: 'test' };

    service = new SubscriptionsService(
      subscriptionModel as never,
      userModel as never,
      verifier as never,
      configService as never,
    );
  });

  it('expires active premium subscriptions when RevenueCat reports no active entitlement', async () => {
    const userId = '507f1f77bcf86cd799439011';

    const result = await service.syncPremiumForUser(userId, {
      hasActivePremiumEntitlement: false,
      provider: 'google',
    });

    const [filter, update] = subscriptionModel.updateMany.mock.calls[0];
    expect(filter).toEqual({
      userId: new Types.ObjectId(userId),
      plan: 'premium',
      status: 'active',
      provider: 'google',
    });
    expect(update.$set.status).toBe('expired');
    expect(update.$set.endDate).toBeInstanceOf(Date);
    expect(userModel.updateOne).toHaveBeenCalledWith(
      { _id: new Types.ObjectId(userId) },
      { $set: { isPremium: false } },
    );
    expect(result).toEqual({ userId, isPremium: false });
  });

  const USER = '507f1f77bcf86cd799439011';
  const clientDto = () =>
    Object.assign(new CreateSubscriptionDto(), {
      userId: USER,
      plan: 'premium' as const,
      provider: 'apple' as const,
      status: 'active' as const,
      productId: 'client_product',
      startDate: new Date('2026-01-01'),
      endDate: new Date('2099-01-01'),
    });

  describe('createFromClient', () => {
    it('dev/test + anahtar yok → istemciye güvenir, verifier çağrılmaz', async () => {
      await service.createFromClient(clientDto());
      expect(verifier.verifyPremium).not.toHaveBeenCalled();
      expect(subscriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({ productId: 'client_product' }),
      );
    });

    it('production + anahtar yok → 503 SUBSCRIPTION_VERIFIER_UNCONFIGURED, yazmaz', async () => {
      env = { NODE_ENV: 'production' };
      const err = await service
        .createFromClient(clientDto())
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      expect((err as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'SUBSCRIPTION_VERIFIER_UNCONFIGURED',
      });
      expect(subscriptionModel.create).not.toHaveBeenCalled();
    });

    it('anahtar var + RC aktif değil → 403 SUBSCRIPTION_NOT_VERIFIED', async () => {
      env = { NODE_ENV: 'production', REVENUECAT_SECRET_API_KEY: 'sk' };
      verifier.verifyPremium.mockResolvedValueOnce({ active: false });
      const err = await service
        .createFromClient(clientDto())
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ForbiddenException);
      expect((err as ForbiddenException).getResponse()).toMatchObject({
        code: 'SUBSCRIPTION_NOT_VERIFIED',
      });
      expect(subscriptionModel.create).not.toHaveBeenCalled();
    });

    it('anahtar var + RC ulaşılamaz (null) → 503 SUBSCRIPTION_VERIFIER_UNAVAILABLE (geçici)', async () => {
      env = { NODE_ENV: 'production', REVENUECAT_SECRET_API_KEY: 'sk' };
      verifier.verifyPremium.mockResolvedValueOnce(null);
      const err = await service
        .createFromClient(clientDto())
        .catch((e: unknown) => e);
      expect(err).toBeInstanceOf(ServiceUnavailableException);
      expect((err as ServiceUnavailableException).getResponse()).toMatchObject({
        code: 'SUBSCRIPTION_VERIFIER_UNAVAILABLE',
      });
      expect(subscriptionModel.create).not.toHaveBeenCalled();
    });

    it('anahtar var + RC aktif → RC değerleriyle yazar', async () => {
      env = { REVENUECAT_SECRET_API_KEY: 'sk' };
      const expiresAt = new Date('2026-12-01');
      verifier.verifyPremium.mockResolvedValue({
        active: true,
        productId: 'rc_product',
        expiresAt,
        provider: 'google',
      });
      await service.createFromClient(clientDto());
      expect(subscriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'rc_product',
          endDate: expiresAt,
          provider: 'google',
        }),
      );
    });
  });

  describe('syncPremiumFromClient', () => {
    it('production + anahtar yok → istemci bayrağı yok sayılır (expire yok)', async () => {
      env = { NODE_ENV: 'production' };
      await service.syncPremiumFromClient(USER, {
        hasActivePremiumEntitlement: false,
      });
      expect(subscriptionModel.updateMany).not.toHaveBeenCalled();
      expect(verifier.verifyPremium).not.toHaveBeenCalled();
    });

    it('anahtar var → RC sonucu kullanılır, null ise DB durumuna dokunmaz', async () => {
      env = { REVENUECAT_SECRET_API_KEY: 'sk' };
      verifier.verifyPremium.mockResolvedValueOnce(null);
      await service.syncPremiumFromClient(USER, {
        hasActivePremiumEntitlement: false,
      });
      expect(subscriptionModel.updateMany).not.toHaveBeenCalled();

      verifier.verifyPremium.mockResolvedValueOnce({ active: false });
      await service.syncPremiumFromClient(USER, {
        hasActivePremiumEntitlement: true,
      });
      expect(subscriptionModel.updateMany).toHaveBeenCalledTimes(1);
    });
  });

  it('create(providerEventId) → upsert ile idempotent yazar', async () => {
    await service.create(clientDto(), 'evt-1');
    const expectedSetOnInsert = expect.objectContaining({
      providerEventId: 'evt-1',
    }) as Record<string, unknown>;
    expect(subscriptionModel.findOneAndUpdate).toHaveBeenCalledWith(
      { providerEventId: 'evt-1' },
      { $setOnInsert: expectedSetOnInsert },
      { upsert: true, returnDocument: 'after' },
    );
    expect(subscriptionModel.create).not.toHaveBeenCalled();
  });
});
