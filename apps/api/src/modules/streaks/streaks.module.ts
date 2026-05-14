import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StreaksController } from './streaks.controller';
import { StreaksService } from './streaks.service';
import { Streak, StreakSchema } from './schemas/streak.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Streak.name, schema: StreakSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [StreaksController],
  providers: [StreaksService],
})
export class StreaksModule {}
