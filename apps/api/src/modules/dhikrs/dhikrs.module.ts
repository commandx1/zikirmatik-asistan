import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { DhikrsController } from './dhikrs.controller';
import { DhikrsService } from './dhikrs.service';
import { Dhikr, DhikrSchema } from './schemas/dhikr.schema';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Dhikr.name, schema: DhikrSchema }]),
  ],
  controllers: [DhikrsController],
  providers: [DhikrsService],
  exports: [DhikrsService, MongooseModule],
})
export class DhikrsModule {}
