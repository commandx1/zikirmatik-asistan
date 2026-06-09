import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateDhikrLogBulkDto } from './dto/create-dhikr-log-bulk.dto';
import { CreateDhikrLogDto } from './dto/create-dhikr-log.dto';
import { DeleteDhikrLogsByDhikrDto } from './dto/delete-dhikr-logs-by-dhikr.dto';
import { QueryDhikrLogsDto } from './dto/query-dhikr-logs.dto';
import { SetDhikrFavoriteDto } from './dto/set-dhikr-favorite.dto';
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
  async findAll(
    @Query() query: QueryDhikrLogsDto,
    @CurrentUserId() userId: string,
  ) {
    query.userId = userId;
    const a = await this.dhikrLogsService.findAll(query);
    return a;
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.dhikrLogsService.findById(id, userId);
  }

  @Delete('by-dhikr')
  removeByDhikr(
    @Query() query: DeleteDhikrLogsByDhikrDto,
    @CurrentUserId() userId: string,
  ) {
    return this.dhikrLogsService.removeByDhikr(userId, query);
  }

  @Patch('favorite/by-dhikr')
  setFavoriteByDhikr(
    @Body() payload: SetDhikrFavoriteDto,
    @CurrentUserId() userId: string,
  ) {
    return this.dhikrLogsService.setFavoriteByDhikr(userId, payload);
  }
}
