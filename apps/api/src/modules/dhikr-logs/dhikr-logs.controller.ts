import { Body, Controller, Get, Param, Post, Query, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { DhikrLogsService } from './dhikr-logs.service';

@Controller('v1/dhikr-logs')
@UseGuards(JwtAuthGuard)
export class DhikrLogsController {
  constructor(private readonly dhikrLogsService: DhikrLogsService) {}

  @Post()
  create(@Body() payload: CreateDhikrLogDto, @CurrentUserId() userId: string) {
    payload.userId = userId;
    return this.dhikrLogsService.create(payload);
  }

  @Post('bulk')
  createBulk(
    @Body() payload: CreateDhikrLogBulkDto,
    @CurrentUserId() userId: string,
  ) {
    payload.items = payload.items.map((item) => ({ ...item, userId }));
    return this.dhikrLogsService.createBulk(payload);
  }

  @Get()
  findAll(@Query() query: QueryDhikrLogsDto, @CurrentUserId() userId: string) {
    query.userId = userId;
    return this.dhikrLogsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.dhikrLogsService.findById(id, userId);
  }
}
