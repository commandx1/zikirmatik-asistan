import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { SpecialDaysController } from './special-days.controller';
import { SpecialDaysService } from './special-days.service';
import {
  SpecialDayProgress,
  SpecialDayProgressSchema,
} from './schemas/special-day-progress.schema';
import { SpecialDay, SpecialDaySchema } from './schemas/special-day.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpecialDay.name, schema: SpecialDaySchema },
      { name: SpecialDayProgress.name, schema: SpecialDayProgressSchema },
      { name: Dhikr.name, schema: DhikrSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SpecialDaysController],
  providers: [SpecialDaysService],
})
export class SpecialDaysModule {}
