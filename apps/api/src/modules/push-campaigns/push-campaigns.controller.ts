import { timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  HttpCode,
  Logger,
  Param,
  Post,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushCampaignsService } from './push-campaigns.service';
import {
  CAMPAIGN_KEYS,
  type CampaignKey,
  type TriggerCampaignBody,
} from './push-campaigns.types';

// Dış tetik: GitHub Actions cron -> bu uç (bkz. .github/workflows/campaign-triggers.yml
// ve apps/api/docs/notification-campaigns-runbook.md). In-process @Cron
// kasıtlı olarak KULLANILMIYOR (Render Free'de instance boşta uyuyor).
@Controller('internal/campaigns')
export class PushCampaignsController {
  private readonly logger = new Logger(PushCampaignsController.name);

  constructor(
    private readonly pushCampaignsService: PushCampaignsService,
    private readonly configService: ConfigService,
  ) {}

  @Post(':campaign')
  @HttpCode(200)
  async trigger(
    @Param('campaign') campaign: string,
    @Headers('x-campaign-secret') secret: string | undefined,
    @Body() body: TriggerCampaignBody,
  ) {
    this.verifySecret(secret);

    if (!isCampaignKey(campaign)) {
      throw new BadRequestException(`Bilinmeyen kampanya: ${campaign}`);
    }

    return this.pushCampaignsService.run(campaign, {
      dryRun: Boolean(body?.dryRun),
      force: Boolean(body?.force),
    });
  }

  // webhooks.controller.ts ile aynı desen: production'da secret zorunlu
  // (fail-closed 401), development'ta yoksa uyarı loglayıp geçer.
  private verifySecret(secret: string | undefined) {
    const expected = this.configService
      .get<string>('CAMPAIGN_TRIGGER_SECRET')
      ?.trim();

    if (!expected) {
      const nodeEnv =
        this.configService.get<string>('NODE_ENV') ?? process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        this.logger.error(
          'CAMPAIGN_TRIGGER_SECRET not set in production, rejecting request',
        );
        throw new UnauthorizedException('Kampanya secret yapılandırılmamış.');
      }
      this.logger.warn(
        'CAMPAIGN_TRIGGER_SECRET not set, skipping auth (development only)',
      );
      return;
    }

    if (!secret || !safeEquals(secret.trim(), expected)) {
      throw new UnauthorizedException('Geçersiz kampanya secret.');
    }
  }
}

function isCampaignKey(value: string): value is CampaignKey {
  return (CAMPAIGN_KEYS as string[]).includes(value);
}

function safeEquals(a: string, b: string): boolean {
  const bufferA = Buffer.from(a);
  const bufferB = Buffer.from(b);
  if (bufferA.length !== bufferB.length) {
    return false;
  }
  return timingSafeEqual(bufferA, bufferB);
}
