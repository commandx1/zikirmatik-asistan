import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DevicesModule } from '../devices/devices.module';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { PushModule } from '../push/push.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { CirclesController } from './circles.controller';
import { CirclesService } from './circles.service';
import { Circle, CircleSchema } from './schemas/circle.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Circle.name, schema: CircleSchema },
      // DhikrLogsModule'ü/UsersModule'ü/DhikrsModule'ü import ETMEZ:
      // DhikrLogsModule BU modülü import eder (assertCanContribute +
      // applyProgress için), tersi bir döngü olurdu. VirdModule ile aynı
      // desen — modeller doğrudan forFeature ile alınır.
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
      { name: Dhikr.name, schema: DhikrSchema },
    ]),
    PushModule,
    DevicesModule,
  ],
  controllers: [CirclesController],
  providers: [CirclesService],
  exports: [CirclesService],
})
export class CirclesModule {}
