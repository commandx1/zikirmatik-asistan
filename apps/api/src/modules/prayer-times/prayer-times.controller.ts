import { Controller, Get, Query } from '@nestjs/common';
import { QueryPrayerTimesDto } from './dto/query-prayer-times.dto';
import { PrayerTimesService } from './prayer-times.service';

@Controller('v1/prayer-times')
export class PrayerTimesController {
  constructor(private readonly prayerTimesService: PrayerTimesService) {}

  @Get()
  getByCity(@Query() query: QueryPrayerTimesDto) {
    return this.prayerTimesService.getByCity(query.city);
  }
}
