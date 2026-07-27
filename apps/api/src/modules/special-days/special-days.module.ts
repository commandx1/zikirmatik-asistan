import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { SpecialDaysController } from './special-days.controller';
import { SpecialDaysService } from './special-days.service';
import { SpecialDay, SpecialDaySchema } from './schemas/special-day.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: SpecialDay.name, schema: SpecialDaySchema },
    ]),
  ],
  controllers: [SpecialDaysController],
  providers: [SpecialDaysService],
})
export class SpecialDaysModule {}
