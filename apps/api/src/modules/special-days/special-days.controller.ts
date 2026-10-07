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
import { AdminSecretGuard } from '../../common/guards/admin-secret.guard';
import { OptionalJwtAuthGuard } from '../../common/guards/optional-jwt-auth.guard';
import { CreateSpecialDayDto } from './dto/create-special-day.dto';
import { QuerySpecialDaysHomeDto } from './dto/query-special-days-home.dto';
import { QuerySpecialDaysDto } from './dto/query-special-days.dto';
import { UpdateSpecialDayDto } from './dto/update-special-day.dto';
import { SpecialDaysService } from './special-days.service';

// GET'ler misafire de açık (OptionalJwtAuthGuard), yazmalar yalnız admin secret ile.
@Controller('v1/special-days')
export class SpecialDaysController {
  constructor(private readonly specialDaysService: SpecialDaysService) {}

  @Post()
  @UseGuards(AdminSecretGuard)
  create(@Body() payload: CreateSpecialDayDto) {
    return this.specialDaysService.create(payload);
  }

  @Get()
  @UseGuards(OptionalJwtAuthGuard)
  findAll(@Query() query: QuerySpecialDaysDto) {
    return this.specialDaysService.findAll(query);
  }

  @Get('home')
  @UseGuards(OptionalJwtAuthGuard)
  getHome(@Query() query: QuerySpecialDaysHomeDto) {
    return this.specialDaysService.getHome(query);
  }

  @Get(':id/detail')
  @UseGuards(OptionalJwtAuthGuard)
  getDetail(@Param('id') id: string) {
    return this.specialDaysService.getDetail(id);
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  findById(@Param('id') id: string) {
    return this.specialDaysService.findById(id);
  }

  @Patch(':id')
  @UseGuards(AdminSecretGuard)
  update(@Param('id') id: string, @Body() payload: UpdateSpecialDayDto) {
    return this.specialDaysService.update(id, payload);
  }

  @Delete(':id')
  @UseGuards(AdminSecretGuard)
  remove(@Param('id') id: string) {
    return this.specialDaysService.remove(id);
  }
}
