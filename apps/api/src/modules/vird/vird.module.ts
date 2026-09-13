import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { StreaksModule } from '../streaks/streaks.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  VirdDayProgress,
  VirdDayProgressSchema,
} from './schemas/vird-day-progress.schema';
import { VirdProgram, VirdProgramSchema } from './schemas/vird-program.schema';
import {
  VirdTemplate,
  VirdTemplateSchema,
} from './schemas/vird-template.schema';
import { VirdController } from './vird.controller';
import { VirdProgramsService } from './vird-programs.service';
import { VirdProgressService } from './vird-progress.service';
import { VirdTemplatesController } from './vird-templates.controller';
import { VirdTemplatesService } from './vird-templates.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VirdProgram.name, schema: VirdProgramSchema },
      { name: VirdDayProgress.name, schema: VirdDayProgressSchema },
      { name: VirdTemplate.name, schema: VirdTemplateSchema },
      // DhikrLogsModule'ü/DhikrsModule'ü import ETMEZ (döngü olurdu) — log ve
      // zikir modellerini burada doğrudan forFeature ile alır, tıpkı
      // StreaksModule/StatsModule/AiModule gibi. Dhikr modeli
      // VirdTemplatesService'in dhikrKey -> katalog çözümlemesi içindir.
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: Dhikr.name, schema: DhikrSchema },
      { name: User.name, schema: UserSchema },
    ]),
    StreaksModule,
  ],
  controllers: [VirdController, VirdTemplatesController],
  providers: [VirdProgramsService, VirdProgressService, VirdTemplatesService],
  exports: [
    VirdProgramsService,
    VirdProgressService,
    VirdTemplatesService,
    MongooseModule,
  ],
})
export class VirdModule {}
