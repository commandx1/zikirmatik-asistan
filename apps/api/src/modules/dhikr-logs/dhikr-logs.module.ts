import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { StreaksModule } from '../streaks/streaks.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { DhikrLogsController } from './dhikr-logs.controller';
import { DhikrLogsService } from './dhikr-logs.service';
import { DhikrLog, DhikrLogSchema } from './schemas/dhikr-log.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Dhikr.name, schema: DhikrSchema },
    ]),
    StreaksModule,
  ],
  controllers: [DhikrLogsController],
  providers: [DhikrLogsService],
})
export class DhikrLogsModule {}
