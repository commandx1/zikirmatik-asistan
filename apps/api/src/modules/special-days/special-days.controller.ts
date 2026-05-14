import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateSpecialDayDto } from './dto/create-special-day.dto';
import { QuerySpecialDayDetailDto } from './dto/query-special-day-detail.dto';
import { QuerySpecialDaysHomeDto } from './dto/query-special-days-home.dto';
import { QuerySpecialDaysDto } from './dto/query-special-days.dto';
import { UpdateSpecialDayDto } from './dto/update-special-day.dto';
import { UpdateSpecialDayProgressDto } from './dto/update-special-day-progress.dto';
import { SpecialDaysService } from './special-days.service';

@Controller('v1/special-days')
export class SpecialDaysController {
  constructor(private readonly specialDaysService: SpecialDaysService) {}

  @Post()
  create(@Body() payload: CreateSpecialDayDto) {
    return this.specialDaysService.create(payload);
  }

  @Get()
  findAll(@Query() query: QuerySpecialDaysDto) {
    return this.specialDaysService.findAll(query);
  }

  @Get('home')
  getHome(@Query() query: QuerySpecialDaysHomeDto) {
    return this.specialDaysService.getHome(query);
  }

  @Get(':id/detail')
  getDetail(
    @Param('id') id: string,
    @Query() query: QuerySpecialDayDetailDto,
  ) {
    return this.specialDaysService.getDetail(id, query.userId);
  }

  @Patch(':id/progress')
  updateProgress(
    @Param('id') id: string,
    @Body() payload: UpdateSpecialDayProgressDto,
  ) {
    return this.specialDaysService.updateProgress(id, payload);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.specialDaysService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateSpecialDayDto) {
    return this.specialDaysService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.specialDaysService.remove(id);
  }
}
