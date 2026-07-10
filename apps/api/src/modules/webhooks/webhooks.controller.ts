import { timingSafeEqual } from 'node:crypto';
import {
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from '../ai/ai.service';
import { CreateSubscriptionDto } from '../subscriptions/dto/create-subscription.dto';
import { SubscriptionsService } from '../subscriptions/subscriptions.service';
import type {
  RevenueCatEvent,
  RevenueCatWebhookPayload,
} from './dto/revenuecat-event.dto';

const EVENTS_THAT_REVOKE_PREMIUM = new Set(['EXPIRATION', 'BILLING_ISSUE']);
const EVENTS_THAT_GRANT_PREMIUM = new Set([
  'INITIAL_PURCHASE',
  'RENEWAL',
  'UNCANCELLATION',
]);
const EVENTS_THAT_GRANT_TOPUP = new Set(['NON_RENEWING_PURCHASE']);

@Controller('v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly aiService: AiService,
    private readonly configService: ConfigService,
  ) {}

  @Post('revenuecat')
  @HttpCode(200)
  async handleRevenueCat(
    @Headers('authorization') authHeader: string | undefined,
    @Body() payload: RevenueCatWebhookPayload,
  ) {
    this.verifySecret(authHeader);

    const event = payload?.event;
    if (!event?.type || !event?.app_user_id) {
      return { received: true };
    }

    if (event.environment === 'SANDBOX') {
      const allowSandbox =
        this.configService.get<string>('REVENUECAT_ALLOW_SANDBOX_EVENTS') ===
        'true';
      if (!allowSandbox) {
        this.logger.debug(`Sandbox event ignored: ${event.type}`);
        return { received: true };
      }
      this.logger.warn(
        `Sandbox event processed (REVENUECAT_ALLOW_SANDBOX_EVENTS=true): ${event.type}`,
      );
    }

    this.logger.log(
      `RevenueCat event: type=${event.type} userId=${event.app_user_id}`,
    );

    // Beklenen sonuçlar (duplicate, unknown_product vb.) handler'lar içinde
    // loglanıp 200 döner; beklenmeyen exception'lar buradan yukarı fırlar
    // (500) ki RevenueCat isteği retry etsin.
    try {
      if (EVENTS_THAT_REVOKE_PREMIUM.has(event.type)) {
        await this.handleRevoke(event);
      } else if (EVENTS_THAT_GRANT_PREMIUM.has(event.type)) {
        await this.handleGrant(event);
      } else if (EVENTS_THAT_GRANT_TOPUP.has(event.type)) {
        await this.handleTopup(event);
      }
    } catch (err) {
      this.logger.error(
        `Error processing RevenueCat event ${event.type}: ${(err as Error).message}`,
      );
      throw err;
    }

    return { received: true };
  }

  private async handleRevoke(event: RevenueCatEvent) {
    const userId = await this.resolveUserId(event);
    if (!userId) {
      return;
    }

    const provider = resolveProvider(event.store);
    await this.subscriptionsService.syncPremiumForUser(userId, {
      hasActivePremiumEntitlement: false,
      provider,
    });
    this.logger.log(`Premium revoked for user ${userId}`);
  }

  private async handleGrant(event: RevenueCatEvent) {
    const userId = await this.resolveUserId(event);
    if (!userId) {
      return;
    }

    const provider = resolveProvider(event.store);

    if (!event.expiration_at_ms) {
      this.logger.warn(
        `Grant event ${event.type} has no expiration_at_ms, skipping subscription creation`,
      );
      return;
    }

    const dto = Object.assign(new CreateSubscriptionDto(), {
      userId,
      plan: 'premium' as const,
      provider,
      status: 'active' as const,
      productId: event.product_id,
      startDate: event.purchased_at_ms
        ? new Date(event.purchased_at_ms)
        : new Date(),
      endDate: new Date(event.expiration_at_ms),
    });
    await this.subscriptionsService.create(dto);
    this.logger.log(`Premium granted for user ${userId}`);
  }

  private async handleTopup(event: RevenueCatEvent) {
    const userId = await this.resolveUserId(event);
    if (!userId) {
      return;
    }

    const providerEventId =
      event.id?.trim() ||
      event.transaction_id?.trim() ||
      [
        event.type,
        event.app_user_id,
        event.product_id,
        String(event.purchased_at_ms ?? ''),
      ].join(':');

    const result = await this.aiService.applyTopupPurchase({
      userId,
      productId: event.product_id,
      providerEventId,
    });

    if (result.applied) {
      this.logger.log(
        `Top-up applied for user ${userId}, +${result.credits} credits (${event.product_id})`,
      );
      return;
    }

    this.logger.log(
      `Top-up skipped for user ${userId} (${event.product_id}) reason=${result.reason}`,
    );
  }

  /**
   * RevenueCat olayındaki app_user_id (öncelikli) veya original_app_user_id
   * ile veritabanındaki gerçek kullanıcıyı bulur. Bulunamazsa net bir uyarı
   * loglar — sessiz hata yerine görünür hata.
   */
  private async resolveUserId(event: RevenueCatEvent): Promise<string | null> {
    const userId = await this.subscriptionsService.resolveExistingUserId(
      event.app_user_id,
      event.original_app_user_id,
    );

    if (!userId) {
      this.logger.warn(
        `RevenueCat olayı eşleşen kullanıcıya bağlanamadı: ` +
          `app_user_id=${event.app_user_id} ` +
          `original_app_user_id=${event.original_app_user_id} type=${event.type}`,
      );
    }

    return userId;
  }

  private verifySecret(authHeader: string | undefined) {
    const secret = this.configService
      .get<string>('REVENUECAT_WEBHOOK_SECRET')
      ?.trim();

    if (!secret) {
      // Production'da fail-closed: secret yapılandırılmamışsa istekleri reddet.
      const nodeEnv =
        this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        this.logger.error(
          'REVENUECAT_WEBHOOK_SECRET not set in production, rejecting webhook',
        );
        throw new UnauthorizedException('Webhook secret yapılandırılmamış.');
      }
      // Geliştirme ortamında doğrulamayı atla
      this.logger.warn('REVENUECAT_WEBHOOK_SECRET not set, skipping auth');
      return;
    }

    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (!token || !safeEquals(token, secret)) {
      throw new UnauthorizedException('Geçersiz webhook secret.');
    }
  }
}

function resolveProvider(store: string): 'apple' | 'google' {
  return store === 'APP_STORE' ? 'apple' : 'google';
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}
