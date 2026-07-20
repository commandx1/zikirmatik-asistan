import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from '../devices/devices.module';
import { PushModule } from '../push/push.module';
import {
  SpecialDay,
  SpecialDaySchema,
} from '../special-days/schemas/special-day.schema';
import { CampaignTriggerGuard } from './campaign-trigger.guard';
import { NotificationCampaignsController } from './notification-campaigns.controller';
import { NotificationCampaignsService } from './notification-campaigns.service';
import {
  NotificationDispatch,
  NotificationDispatchSchema,
} from './schemas/notification-dispatch.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: NotificationDispatch.name, schema: NotificationDispatchSchema },
      { name: SpecialDay.name, schema: SpecialDaySchema },
    ]),
    DevicesModule,
    PushModule,
  ],
  controllers: [NotificationCampaignsController],
  providers: [NotificationCampaignsService, CampaignTriggerGuard],
})
export class NotificationCampaignsModule {}
