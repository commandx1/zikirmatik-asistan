import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { StreaksModule } from '../streaks/streaks.module';
import { StatsController } from './stats.controller';
import { StatsService } from './stats.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
    StreaksModule,
  ],
  controllers: [StatsController],
  providers: [StatsService],
})
export class StatsModule {}
