import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { StreaksModule } from '../streaks/streaks.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { VirdModule } from '../vird/vird.module';
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
    // VirdModule bu modülü import ETMEZ (döngü olurdu) — kendi DhikrLog
    // modelini doğrudan forFeature ile alır. Bu import yalnız
    // VirdProgressService.applyLogWrite'ı kullanmak için.
    VirdModule,
  ],
  controllers: [DhikrLogsController],
  providers: [DhikrLogsService],
})
export class DhikrLogsModule {}
