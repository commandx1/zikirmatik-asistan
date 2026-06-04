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

@Controller('v1/webhooks')
export class WebhooksController {
  private readonly logger = new Logger(WebhooksController.name);

  constructor(
    private readonly subscriptionsService: SubscriptionsService,
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
      this.logger.debug(`Sandbox event ignored: ${event.type}`);
      return { received: true };
    }

    this.logger.log(
      `RevenueCat event: type=${event.type} userId=${event.app_user_id}`,
    );

    try {
      if (EVENTS_THAT_REVOKE_PREMIUM.has(event.type)) {
        await this.handleRevoke(event);
      } else if (EVENTS_THAT_GRANT_PREMIUM.has(event.type)) {
        await this.handleGrant(event);
      }
    } catch (err) {
      // Loglayıp 200 döndür — RevenueCat başarısız istekleri retry'lar
      this.logger.error(
        `Error processing RevenueCat event ${event.type}: ${(err as Error).message}`,
      );
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
      // Secret tanımlı değilse geliştirme ortamında doğrulamayı atla
      this.logger.warn('REVENUECAT_WEBHOOK_SECRET not set, skipping auth');
      return;
    }

    const token = authHeader?.replace(/^Bearer\s+/i, '').trim();
    if (token !== secret) {
      throw new UnauthorizedException('Geçersiz webhook secret.');
    }
  }
}

function resolveProvider(store: string): 'apple' | 'google' {
  return store === 'APP_STORE' ? 'apple' : 'google';
}
