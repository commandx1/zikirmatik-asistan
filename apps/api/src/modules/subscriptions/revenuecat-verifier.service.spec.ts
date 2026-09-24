import type { ConfigService } from '@nestjs/config';
import { RevenueCatVerifierService } from './revenuecat-verifier.service';

describe('RevenueCatVerifierService', () => {
  const fetchMock = jest.fn();
  const originalFetch = global.fetch;
  const make = (key?: string) =>
    new RevenueCatVerifierService({
      get: (k: string) => (k === 'REVENUECAT_SECRET_API_KEY' ? key : undefined),
    } as unknown as ConfigService);
  const respond = (body: unknown, ok = true) =>
    fetchMock.mockResolvedValue({
      ok,
      status: ok ? 200 : 500,
      json: () => body,
    });

  beforeEach(() => {
    fetchMock.mockReset();
    global.fetch = fetchMock;
  });
  afterAll(() => {
    global.fetch = originalFetch;
  });

  it('anahtar yok → null, istek atılmaz', async () => {
    expect(await make().verifyPremium('u1')).toBeNull();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('aktif premium entitlement → active + RC değerleri', async () => {
    respond({
      subscriber: {
        entitlements: {
          premium: {
            expires_date: '2099-01-01T00:00:00Z',
            product_identifier: 'annual',
          },
        },
        subscriptions: { annual: { store: 'play_store' } },
      },
    });
    const result = await make('sk').verifyPremium('u1');
    expect(result).toEqual({
      active: true,
      productId: 'annual',
      expiresAt: new Date('2099-01-01T00:00:00Z'),
      provider: 'google',
    });
    expect(fetchMock).toHaveBeenCalledWith(
      'https://api.revenuecat.com/v1/subscribers/u1',
      expect.anything(),
    );
  });

  it('süresi geçmiş veya entitlement yok → active:false', async () => {
    respond({
      subscriber: {
        entitlements: { premium: { expires_date: '2000-01-01T00:00:00Z' } },
      },
    });
    expect(await make('sk').verifyPremium('u1')).toEqual({ active: false });
    respond({ subscriber: { entitlements: {} } });
    expect(await make('sk').verifyPremium('u1')).toEqual({ active: false });
  });

  it('HTTP hatası veya ağ hatası → null', async () => {
    respond({}, false);
    expect(await make('sk').verifyPremium('u1')).toBeNull();
    fetchMock.mockRejectedValue(new Error('timeout'));
    expect(await make('sk').verifyPremium('u1')).toBeNull();
  });
});
