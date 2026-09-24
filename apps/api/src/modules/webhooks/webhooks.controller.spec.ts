import { UnauthorizedException } from '@nestjs/common';
import { WebhooksController } from './webhooks.controller';
import type { RevenueCatWebhookPayload } from './dto/revenuecat-event.dto';

describe('WebhooksController', () => {
  const subscriptionsService = {
    syncPremiumForUser: jest.fn(),
    create: jest.fn(),
    resolveExistingUserId: jest.fn(),
  };
  const aiCreditsService = { applyTopupPurchase: jest.fn() };
  const configService = { get: jest.fn() };

  let controller: WebhooksController;

  const secret = 'wh-secret';

  function payload(
    overrides: Partial<RevenueCatWebhookPayload['event']> = {},
  ): RevenueCatWebhookPayload {
    return {
      api_version: '1.0',
      event: {
        type: 'INITIAL_PURCHASE',
        app_user_id: 'user-1',
        original_app_user_id: 'user-1',
        product_id: 'premium_monthly',
        store: 'APP_STORE',
        purchased_at_ms: 1000,
        expiration_at_ms: 2000,
        ...overrides,
      },
    };
  }

  beforeEach(() => {
    Object.values(subscriptionsService).forEach((fn) => fn.mockReset());
    aiCreditsService.applyTopupPurchase.mockReset();
    configService.get.mockReset();
    configService.get.mockImplementation((key: string) =>
      key === 'REVENUECAT_WEBHOOK_SECRET' ? secret : undefined,
    );
    subscriptionsService.resolveExistingUserId.mockResolvedValue(
      'user-mongo-id',
    );

    controller = new WebhooksController(
      subscriptionsService as never,
      aiCreditsService as never,
      configService as never,
    );
  });

  describe('secret doğrulama', () => {
    it('secret yanlışsa 401 fırlatır', async () => {
      await expect(
        controller.handleRevenueCat('Bearer wrong-secret', payload()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("authorization header 'Bearer <secret>' doğruysa geçer", async () => {
      subscriptionsService.syncPremiumForUser.mockResolvedValue(undefined);
      subscriptionsService.create.mockResolvedValue(undefined);

      const result = await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload(),
      );

      expect(result).toEqual({ received: true });
    });

    it('production ortamında secret tanımsızsa fail-closed (401)', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'production' : undefined,
      );

      await expect(
        controller.handleRevenueCat(undefined, payload()),
      ).rejects.toThrow(UnauthorizedException);
    });

    it('development ortamında secret tanımsızsa doğrulamayı atlar (dev bypass)', async () => {
      configService.get.mockImplementation((key: string) =>
        key === 'NODE_ENV' ? 'development' : undefined,
      );
      subscriptionsService.create.mockResolvedValue(undefined);

      const result = await controller.handleRevenueCat(undefined, payload());

      expect(result).toEqual({ received: true });
    });
  });

  it('event.type veya app_user_id eksikse hiçbir işlem yapmadan received:true döner', async () => {
    const result = await controller.handleRevenueCat(`Bearer ${secret}`, {
      api_version: '1.0',
      event: { app_user_id: '' } as never,
    });

    expect(result).toEqual({ received: true });
    expect(subscriptionsService.syncPremiumForUser).not.toHaveBeenCalled();
  });

  describe('SANDBOX bayrağı', () => {
    it("environment SANDBOX ve REVENUECAT_ALLOW_SANDBOX_EVENTS != 'true' ise event yok sayılır", async () => {
      const result = await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ environment: 'SANDBOX' }),
      );

      expect(result).toEqual({ received: true });
      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it("REVENUECAT_ALLOW_SANDBOX_EVENTS='true' ise sandbox event işlenir", async () => {
      configService.get.mockImplementation((key: string) => {
        if (key === 'REVENUECAT_WEBHOOK_SECRET') return secret;
        if (key === 'REVENUECAT_ALLOW_SANDBOX_EVENTS') return 'true';
        return undefined;
      });
      subscriptionsService.create.mockResolvedValue(undefined);

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ environment: 'SANDBOX' }),
      );

      expect(subscriptionsService.create).toHaveBeenCalled();
    });
  });

  describe('event türü yönlendirme', () => {
    it('EXPIRATION → syncPremiumForUser(false) çağırır', async () => {
      subscriptionsService.syncPremiumForUser.mockResolvedValue(undefined);

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'EXPIRATION' }),
      );

      expect(subscriptionsService.syncPremiumForUser).toHaveBeenCalledWith(
        'user-mongo-id',
        { hasActivePremiumEntitlement: false, provider: 'apple' },
      );
    });

    it('BILLING_ISSUE → syncPremiumForUser(false) çağırır', async () => {
      subscriptionsService.syncPremiumForUser.mockResolvedValue(undefined);

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'BILLING_ISSUE', store: 'PLAY_STORE' }),
      );

      expect(subscriptionsService.syncPremiumForUser).toHaveBeenCalledWith(
        'user-mongo-id',
        { hasActivePremiumEntitlement: false, provider: 'google' },
      );
    });

    it('INITIAL_PURCHASE/RENEWAL/UNCANCELLATION → subscriptionsService.create çağırır', async () => {
      subscriptionsService.create.mockResolvedValue(undefined);

      await controller.handleRevenueCat(`Bearer ${secret}`, payload());

      expect(subscriptionsService.create).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-mongo-id',
          plan: 'premium',
          provider: 'apple',
        }),
      );
    });

    it('expiration_at_ms yoksa grant event atlanır (create çağrılmaz)', async () => {
      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ expiration_at_ms: undefined }),
      );

      expect(subscriptionsService.create).not.toHaveBeenCalled();
    });

    it('NON_RENEWING_PURCHASE → aiCreditsService.applyTopupPurchase çağırır', async () => {
      aiCreditsService.applyTopupPurchase.mockResolvedValue({
        applied: true,
        credits: 10,
      });

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'NON_RENEWING_PURCHASE', id: 'evt-1' }),
      );

      expect(aiCreditsService.applyTopupPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          userId: 'user-mongo-id',
          productId: 'premium_monthly',
          providerEventId: 'evt-1',
        }),
      );
    });

    it('CANCELLATION gibi bilinmeyen tipler hiçbir handler çağırmaz', async () => {
      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'CANCELLATION' }),
      );

      expect(subscriptionsService.syncPremiumForUser).not.toHaveBeenCalled();
      expect(subscriptionsService.create).not.toHaveBeenCalled();
      expect(aiCreditsService.applyTopupPurchase).not.toHaveBeenCalled();
    });
  });

  describe('providerEventId türetme', () => {
    it('event.id varsa öncelikli kullanılır', async () => {
      aiCreditsService.applyTopupPurchase.mockResolvedValue({
        applied: true,
        credits: 5,
      });

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({
          type: 'NON_RENEWING_PURCHASE',
          id: 'evt-id',
          transaction_id: 'txn-1',
        }),
      );

      expect(aiCreditsService.applyTopupPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ providerEventId: 'evt-id' }),
      );
    });

    it('event.id yoksa transaction_id kullanılır', async () => {
      aiCreditsService.applyTopupPurchase.mockResolvedValue({
        applied: true,
        credits: 5,
      });

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'NON_RENEWING_PURCHASE', transaction_id: 'txn-1' }),
      );

      expect(aiCreditsService.applyTopupPurchase).toHaveBeenCalledWith(
        expect.objectContaining({ providerEventId: 'txn-1' }),
      );
    });

    it('id ve transaction_id yoksa type:app_user_id:product_id:purchased_at_ms birleşimi kullanılır', async () => {
      aiCreditsService.applyTopupPurchase.mockResolvedValue({
        applied: true,
        credits: 5,
      });

      await controller.handleRevenueCat(
        `Bearer ${secret}`,
        payload({ type: 'NON_RENEWING_PURCHASE' }),
      );

      expect(aiCreditsService.applyTopupPurchase).toHaveBeenCalledWith(
        expect.objectContaining({
          providerEventId: 'NON_RENEWING_PURCHASE:user-1:premium_monthly:1000',
        }),
      );
    });
  });

  it('kullanıcı çözümlenemezse (resolveExistingUserId null) handler sessizce atlanır', async () => {
    subscriptionsService.resolveExistingUserId.mockResolvedValue(null);

    const result = await controller.handleRevenueCat(
      `Bearer ${secret}`,
      payload(),
    );

    expect(result).toEqual({ received: true });
    expect(subscriptionsService.create).not.toHaveBeenCalled();
  });

  it('handler içinde beklenmeyen hata yukarı fırlatılır (RevenueCat retry etsin diye)', async () => {
    subscriptionsService.create.mockRejectedValue(new Error('db error'));

    await expect(
      controller.handleRevenueCat(`Bearer ${secret}`, payload()),
    ).rejects.toThrow('db error');
  });
});
