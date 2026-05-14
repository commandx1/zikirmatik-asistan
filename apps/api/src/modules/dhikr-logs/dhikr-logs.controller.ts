import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { DhikrLogsService } from './dhikr-logs.service';

@Controller('v1/dhikr-logs')
export class DhikrLogsController {
  constructor(private readonly dhikrLogsService: DhikrLogsService) {}

  @Post()
  create(@Body() payload: CreateDhikrLogDto) {
    return this.dhikrLogsService.create(payload);
  }

  @Post('bulk')
  createBulk(@Body() payload: CreateDhikrLogBulkDto) {
    return this.dhikrLogsService.createBulk(payload);
  }

  @Get()
  findAll(@Query() query: QueryDhikrLogsDto) {
    return this.dhikrLogsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.dhikrLogsService.findById(id);
  }
}
