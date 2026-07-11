import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from '../devices/devices.module';
import { PushModule } from '../push/push.module';
import {
  SpecialDay,
  SpecialDaySchema,
} from '../special-days/schemas/special-day.schema';
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
  providers: [NotificationCampaignsService],
})
export class NotificationCampaignsModule {}
