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
import { CreateVirdProgramDto } from './dto/create-vird-program.dto';
import { UpdateVirdProgramDto } from './dto/update-vird-program.dto';
import { VirdHistoryQueryDto } from './dto/vird-history-query.dto';
import { VirdTodayQueryDto } from './dto/vird-today-query.dto';
import { VirdProgramsService } from './vird-programs.service';
import { VirdProgressService } from './vird-progress.service';

/**
 * Sahiplik: her metod @CurrentUserId() ile alınan userId'yi servise geçirir;
 * servisler her sorguya {userId, ...} filtresi ekler — bir kullanıcı başka
 * bir kullanıcının programına asla erişemez (bulunamadı olarak görünür).
 */
@Controller('v1/vird')
@UseGuards(JwtAuthGuard)
export class VirdController {
  constructor(
    private readonly programsService: VirdProgramsService,
    private readonly progressService: VirdProgressService,
  ) {}

  @Get('programs')
  findAll(@CurrentUserId() userId: string) {
    return this.programsService.findAllForUser(userId);
  }

  @Post('programs')
  create(
    @Body() payload: CreateVirdProgramDto,
    @CurrentUserId() userId: string,
  ) {
    return this.programsService.create(userId, payload);
  }

  @Get('programs/:id')
  findOne(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.programsService.findOne(userId, id);
  }

  @Patch('programs/:id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateVirdProgramDto,
    @CurrentUserId() userId: string,
  ) {
    return this.programsService.update(userId, id, payload);
  }

  @Delete('programs/:id')
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.programsService.remove(userId, id);
  }

  @Post('programs/:id/activate')
  activate(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.programsService.activate(userId, id);
  }

  @Get('today')
  getToday(@Query() query: VirdTodayQueryDto, @CurrentUserId() userId: string) {
    return this.progressService.getToday(userId, query.date);
  }

  @Get('history')
  getHistory(
    @Query() query: VirdHistoryQueryDto,
    @CurrentUserId() userId: string,
  ) {
    return this.progressService.getHistory(userId, query.from, query.to);
  }
}
