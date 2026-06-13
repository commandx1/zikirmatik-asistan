import { Controller, Get, Param, Query } from '@nestjs/common';
import { DhikrCollectionsService } from './dhikr-collections.service';
import { QueryDhikrCollectionsDto } from './dto/query-dhikr-collections.dto';

@Controller('v1/dhikr-collections')
export class DhikrCollectionsController {
  constructor(
    private readonly dhikrCollectionsService: DhikrCollectionsService,
  ) {}

  @Get()
  findAll(@Query() query: QueryDhikrCollectionsDto) {
    return this.dhikrCollectionsService.findAll(query);
  }

  @Get(':key')
  getDetail(@Param('key') key: string) {
    return this.dhikrCollectionsService.getDetail(key);
  }
}
