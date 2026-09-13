import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  VirdDayProgress,
  VirdDayProgressSchema,
} from '../vird/schemas/vird-day-progress.schema';
import { StreaksController } from './streaks.controller';
import { StreaksService } from './streaks.service';
import { Streak, StreakSchema } from './schemas/streak.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Streak.name, schema: StreakSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
      // Yalnız şema: recalculateVirdForUser bu modeli doğrudan okur (vird
      // modülünü import etmeden — döngü riski yok, StreaksModule zaten
      // VirdModule tarafından import ediliyor).
      { name: VirdDayProgress.name, schema: VirdDayProgressSchema },
    ]),
  ],
  controllers: [StreaksController],
  providers: [StreaksService],
  exports: [StreaksService],
})
export class StreaksModule {}
