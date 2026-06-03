import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CreateDhikrDto } from './dto/create-dhikr.dto';
import { QueryDhikrsDto } from './dto/query-dhikrs.dto';
import { UpdateDhikrDto } from './dto/update-dhikr.dto';
import { DhikrsService } from './dhikrs.service';

@Controller('v1/dhikrs')
export class DhikrsController {
  constructor(private readonly dhikrsService: DhikrsService) {}

  @Post()
  create(@Body() payload: CreateDhikrDto) {
    return this.dhikrsService.create(payload);
  }

  @Get()
  findAll(@Query() query: QueryDhikrsDto) {
    return this.dhikrsService.findAll(query);
  }

  @Get('verified-active')
  listVerifiedActive() {
    return this.dhikrsService.listVerifiedActive();
  }

  @Get('lookup')
  findByTransliteration(@Query('transliteration') transliteration?: string) {
    if (!transliteration?.trim()) {
      throw new BadRequestException('Okunuş bilgisi zorunlu.');
    }

    return this.dhikrsService.findVerifiedActiveByTransliteration(
      transliteration,
    );
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.dhikrsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateDhikrDto) {
    return this.dhikrsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.dhikrsService.remove(id);
  }
}
