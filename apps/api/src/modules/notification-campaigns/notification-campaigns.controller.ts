import { Controller, HttpCode, Post, UseGuards } from '@nestjs/common';
import { CampaignTriggerGuard } from './campaign-trigger.guard';
import {
  type CampaignRunResult,
  NotificationCampaignsService,
} from './notification-campaigns.service';

// Internal trigger endpoints for the push campaigns. On Render Free the
// instance sleeps and misses the in-process @Cron ticks, so an external
// scheduler (GitHub Actions) POSTs here instead. Both endpoints are
// idempotent per Istanbul day (claimDispatch) and respect quiet hours,
// so retries/late triggers are safe.
@Controller('internal/campaigns')
@UseGuards(CampaignTriggerGuard)
export class NotificationCampaignsController {
  constructor(
    private readonly campaignsService: NotificationCampaignsService,
  ) {}

  @Post('friday')
  @HttpCode(200)
  runFriday(): Promise<CampaignRunResult> {
    return this.campaignsService.runFridayCampaign();
  }

  @Post('special-day-eve')
  @HttpCode(200)
  runSpecialDayEve(): Promise<CampaignRunResult> {
    return this.campaignsService.runSpecialDayEveCampaign();
  }
}
