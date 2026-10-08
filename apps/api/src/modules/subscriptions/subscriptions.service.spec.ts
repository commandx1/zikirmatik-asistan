import {
  ForbiddenException,
  NotFoundException,
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

  describe('gap coverage', () => {
    const chain = <T>(value: T) => {
      const c = {
        sort: jest.fn().mockReturnThis(),
        lean: jest.fn().mockReturnThis(),
        exec: jest.fn().mockResolvedValue(value),
      };
      return c;
    };
    const withModels = (extra: Record<string, unknown>) =>
      new SubscriptionsService(
        { ...subscriptionModel, ...extra } as never,
        userModel as never,
        verifier as never,
        configService as never,
      );

    it('RC aktif ama ürün/sağlayıcı/bitiş döndürmediyse istemci değerleri + varsayılan ürün kalır', async () => {
      env = { REVENUECAT_SECRET_API_KEY: 'sk' };
      verifier.verifyPremium.mockResolvedValue({ active: true });
      const dto = clientDto();
      await service.createFromClient(dto);
      expect(subscriptionModel.create).toHaveBeenCalledWith(
        expect.objectContaining({
          productId: 'revenuecat_premium',
          provider: 'apple',
          endDate: dto.endDate,
          plan: 'premium',
          status: 'active',
        }),
      );
    });

    it('trust modunda sync istemci bayrağını uygular (expire çağrılır)', async () => {
      await service.syncPremiumFromClient(USER, {
        hasActivePremiumEntitlement: false,
      });
      expect(subscriptionModel.updateMany).toHaveBeenCalledTimes(1);
    });

    it('verify modunda geçersiz userId verifier çağrılmadan 404', async () => {
      env = { REVENUECAT_SECRET_API_KEY: 'sk' };
      await expect(service.syncPremiumFromClient('bad-id')).rejects.toThrow(
        NotFoundException,
      );
      expect(verifier.verifyPremium).not.toHaveBeenCalled();
    });

    it('NODE_ENV config boşsa process.env.NODE_ENV kullanılır', async () => {
      env = {};
      const prev = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      try {
        await expect(service.createFromClient(clientDto())).rejects.toThrow(
          ServiceUnavailableException,
        );
      } finally {
        process.env.NODE_ENV = prev;
      }
    });

    it('create: bilinmeyen kullanıcı → 404, geçersiz id → 404', async () => {
      userModel.exists.mockResolvedValueOnce(null);
      await expect(service.create(clientDto())).rejects.toThrow(
        NotFoundException,
      );
      await expect(
        service.create(Object.assign(clientDto(), { userId: 'x' })),
      ).rejects.toThrow(NotFoundException);
    });

    it('create(providerEventId, providerEventAt) olay zamanını kaydeder', async () => {
      const at = new Date('2026-05-01');
      await service.create(clientDto(), 'evt-2', at);
      const [, update] = subscriptionModel.findOneAndUpdate.mock.calls[0];
      expect(update.$setOnInsert.providerEventAt).toBe(at);
    });

    it('findAll yalnız verilen filtreleri uygular', async () => {
      const c = chain([]);
      const find = jest.fn().mockReturnValue(c);
      await withModels({ find }).findAll({});
      expect(find).toHaveBeenLastCalledWith({});
      await withModels({ find }).findAll({
        userId: USER,
        plan: 'premium',
        provider: 'google',
        status: 'active',
      });
      expect(find).toHaveBeenLastCalledWith({
        userId: new Types.ObjectId(USER),
        plan: 'premium',
        provider: 'google',
        status: 'active',
      });
    });

    it('findById: sahiplik filtresi + bulunamayınca 404', async () => {
      const findOne = jest.fn().mockReturnValue(chain(null));
      const svc = withModels({ findOne });
      await expect(svc.findById(USER, USER)).rejects.toThrow(NotFoundException);
      expect(findOne).toHaveBeenCalledWith({
        _id: new Types.ObjectId(USER),
        userId: new Types.ObjectId(USER),
      });
      findOne.mockReturnValue(chain({ _id: 'a' }));
      await expect(svc.findById(USER)).resolves.toEqual({ _id: 'a' });
      expect(findOne).toHaveBeenLastCalledWith({
        _id: new Types.ObjectId(USER),
      });
    });

    it('resolveExistingUserId: boş/geçersiz adayları atlar, var olan ilk kullanıcıyı döner', async () => {
      userModel.exists.mockResolvedValueOnce(null).mockResolvedValueOnce({});
      const other = '507f1f77bcf86cd799439012';
      await expect(
        service.resolveExistingUserId(
          undefined,
          '  ',
          '$RCAnonymousID:x',
          USER,
          other,
        ),
      ).resolves.toBe(other);
      userModel.exists.mockResolvedValue(null);
      await expect(
        service.resolveExistingUserId(null, USER),
      ).resolves.toBeNull();
    });

    it('syncPremiumForUser: kullanıcı yok → 404; kullanıcı okunamazsa isPremium false', async () => {
      userModel.exists.mockResolvedValueOnce(null);
      await expect(service.syncPremiumForUser(USER)).rejects.toThrow(
        NotFoundException,
      );
      userModel.findById.mockReturnValueOnce({
        lean: () => ({ exec: () => null }),
      });
      await expect(service.syncPremiumForUser(USER)).resolves.toEqual({
        userId: USER,
        isPremium: false,
      });
    });

    it('syncPremiumForUser: aktif premium varsa kullanıcı true yazılır', async () => {
      subscriptionModel.exists.mockResolvedValue({ _id: 's' });
      await service.syncPremiumForUser(USER);
      expect(userModel.updateOne).toHaveBeenCalledWith(
        { _id: new Types.ObjectId(USER) },
        { $set: { isPremium: true } },
      );
    });

    it('expirePremiumFromEvent: olay zamanından önceki dönemleri düşürür; sonrakilere dokunmaz', async () => {
      const at = new Date('2026-05-01');
      await service.expirePremiumFromEvent(USER, 'apple', at);
      const [filter] = subscriptionModel.updateMany.mock
        .calls[0] as unknown as [{ provider: string; $or: unknown[] }];
      expect(filter.provider).toBe('apple');
      expect(filter.$or).toEqual([
        { providerEventAt: { $lt: at } },
        { providerEventAt: null, createdAt: { $lte: at } },
      ]);
      await service.expirePremiumFromEvent(USER, 'google');
      expect(subscriptionModel.updateMany).toHaveBeenCalledTimes(2);
    });

    it('extendPremiumForGracePeriod: yalnız grace sonundan önce biten dönemleri uzatır', async () => {
      const grace = new Date('2026-06-01');
      await service.extendPremiumForGracePeriod(USER, 'google', grace);
      const [filter, update] = subscriptionModel.updateMany.mock
        .calls[0] as unknown as [{ endDate: unknown }, { $set: unknown }];
      expect(filter.endDate).toEqual({ $lt: grace });
      expect(update.$set).toEqual({ endDate: grace });
      await expect(
        service.extendPremiumForGracePeriod('bad', 'google', grace),
      ).rejects.toThrow(NotFoundException);
    });

    it('reconcilePremiumStatuses: değişiklik yoksa sessiz, varsa iki yönlü düzeltir', async () => {
      const exec = (n: number) => ({
        exec: jest.fn().mockResolvedValue({ modifiedCount: n }),
      });
      const distinct = jest.fn().mockResolvedValue([new Types.ObjectId()]);
      const um = jest.fn();
      const svc = new SubscriptionsService(
        {
          ...subscriptionModel,
          updateMany: jest.fn(() => exec(0)),
          distinct,
        } as never,
        { ...userModel, updateMany: um.mockReturnValue(exec(0)) } as never,
        verifier as never,
        configService as never,
      );
      const log = jest.spyOn(
        (svc as unknown as { logger: { log: () => void } }).logger,
        'log',
      );
      await svc.reconcilePremiumStatuses();
      expect(log).not.toHaveBeenCalled();
      expect(um).toHaveBeenCalledTimes(2);

      const svc2 = new SubscriptionsService(
        {
          ...subscriptionModel,
          updateMany: jest.fn(() => exec(2)),
          distinct,
        } as never,
        { ...userModel, updateMany: jest.fn(() => exec(1)) } as never,
        verifier as never,
        configService as never,
      );
      const log2 = jest.spyOn(
        (svc2 as unknown as { logger: { log: () => void } }).logger,
        'log',
      );
      await svc2.reconcilePremiumStatuses();
      expect(log2).toHaveBeenCalledTimes(2);
    });
  });
});
