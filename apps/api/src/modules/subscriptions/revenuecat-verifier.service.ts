import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export type RevenueCatPremium = {
  active: boolean;
  productId?: string;
  expiresAt?: Date;
  provider?: 'apple' | 'google';
};

type Entitlement = {
  expires_date?: string | null;
  product_identifier?: string;
};
type SubscriberResponse = {
  subscriber?: {
    entitlements?: Record<string, Entitlement>;
    subscriptions?: Record<string, { store?: string }>;
  };
};

/**
 * İstemcinin premium beyanını RevenueCat REST'ten doğrular
 * (app_user_id = bizim userId; mobil Purchases.configure({ appUserID })).
 * null = belirsiz (anahtar yok / ağ / beklenmeyen yanıt).
 */
@Injectable()
export class RevenueCatVerifierService {
  private readonly logger = new Logger(RevenueCatVerifierService.name);

  constructor(private readonly configService: ConfigService) {}

  async verifyPremium(userId: string): Promise<RevenueCatPremium | null> {
    const apiKey = this.configService
      .get<string>('REVENUECAT_SECRET_API_KEY')
      ?.trim();
    if (!apiKey) {
      return null;
    }
    const entitlementId =
      this.configService
        .get<string>('REVENUECAT_PREMIUM_ENTITLEMENT_ID')
        ?.trim() || 'premium';

    try {
      const res = await fetch(
        `https://api.revenuecat.com/v1/subscribers/${encodeURIComponent(userId)}`,
        {
          headers: { Authorization: `Bearer ${apiKey}` },
          signal: AbortSignal.timeout(5_000),
        },
      );
      if (!res.ok) {
        this.logger.warn(`RevenueCat subscriber lookup failed: ${res.status}`);
        return null;
      }
      const body = (await res.json()) as SubscriberResponse;
      const entitlement = body.subscriber?.entitlements?.[entitlementId];
      if (!entitlement) {
        return { active: false };
      }
      // expires_date null = ömür boyu (ürün kuralında yok ama RC şemasında var).
      const expiresAt = entitlement.expires_date
        ? new Date(entitlement.expires_date)
        : undefined;
      if (expiresAt && expiresAt.getTime() <= Date.now()) {
        return { active: false };
      }
      const productId = entitlement.product_identifier;
      const store = productId
        ? body.subscriber?.subscriptions?.[productId]?.store
        : undefined;
      return {
        active: true,
        productId,
        expiresAt,
        provider:
          store === 'app_store' || store === 'mac_app_store'
            ? 'apple'
            : store === 'play_store'
              ? 'google'
              : undefined,
      };
    } catch (err) {
      this.logger.warn(
        `RevenueCat subscriber lookup error: ${(err as Error).message}`,
      );
      return null;
    }
  }
}
