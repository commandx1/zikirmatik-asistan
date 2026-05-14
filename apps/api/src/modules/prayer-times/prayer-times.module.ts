import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import { PrayerTimesController } from './prayer-times.controller';
import { PrayerTimesService } from './prayer-times.service';
import { PrayerTime, PrayerTimeSchema } from './schemas/prayer-time.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: PrayerTime.name, schema: PrayerTimeSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [PrayerTimesController],
  providers: [PrayerTimesService],
  exports: [PrayerTimesService],
})
export class PrayerTimesModule {}
