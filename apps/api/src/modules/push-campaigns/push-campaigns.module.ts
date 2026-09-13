import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Device, DeviceSchema } from '../devices/schemas/device.schema';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import {
  SpecialDay,
  SpecialDaySchema,
} from '../special-days/schemas/special-day.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PushModule } from '../push/push.module';
import {
  PushDispatch,
  PushDispatchSchema,
} from './schemas/push-dispatch.schema';
import { PushCampaignsController } from './push-campaigns.controller';
import { PushCampaignsService } from './push-campaigns.service';
import { WinbackCampaign } from './campaigns/winback.campaign';
import { KandilCampaign } from './campaigns/kandil.campaign';
import { WeeklySummaryCampaign } from './campaigns/weekly-summary.campaign';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PushDispatch.name, schema: PushDispatchSchema },
      { name: Device.name, schema: DeviceSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: SpecialDay.name, schema: SpecialDaySchema },
      { name: User.name, schema: UserSchema },
    ]),
    // PushSenderService.sendToDevices için (bkz. modules/push).
    PushModule,
  ],
  controllers: [PushCampaignsController],
  providers: [
    PushCampaignsService,
    WinbackCampaign,
    KandilCampaign,
    WeeklySummaryCampaign,
  ],
})
export class PushCampaignsModule {}
