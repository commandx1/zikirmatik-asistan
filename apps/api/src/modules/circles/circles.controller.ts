import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CirclesService } from './circles.service';
import { CreateCircleDto } from './dto/create-circle.dto';
import { JoinCircleDto } from './dto/join-circle.dto';

/**
 * Sahiplik: her korumalı metod @CurrentUserId()'yi servise geçirir; servis
 * her sorguya {memberIds: userId} (veya {creatorId}) ekler.
 *
 * Guard SINIF seviyesinde DEĞİL metod seviyesinde: `GET preview/:code`
 * herkese açıktır (davet linkini tıklayan, henüz üye olmayan kişi görür).
 * `preview/:code` ve `join` rotaları `:id` rotalarından ÖNCE tanımlanır —
 * aksi halde "preview"/"join" birer :id olarak eşleşirdi.
 */
@Controller('v1/circles')
export class CirclesController {
  constructor(private readonly circlesService: CirclesService) {}

  @Get('preview/:code')
  preview(@Param('code') code: string) {
    return this.circlesService.preview(code);
  }

  @Post('join')
  @UseGuards(JwtAuthGuard)
  join(@Body() payload: JoinCircleDto, @CurrentUserId() userId: string) {
    return this.circlesService.join(userId, payload.code);
  }

  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() payload: CreateCircleDto, @CurrentUserId() userId: string) {
    return this.circlesService.create(userId, payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  findMine(@CurrentUserId() userId: string) {
    return this.circlesService.findMine(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  findOne(
    @Param('id') id: string,
    @CurrentUserId() userId: string,
    @Query('date') date?: string,
  ) {
    return this.circlesService.findOne(userId, id, date);
  }

  @Post(':id/leave')
  @UseGuards(JwtAuthGuard)
  leave(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.circlesService.leave(userId, id);
  }

  @Post(':id/close')
  @UseGuards(JwtAuthGuard)
  close(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.circlesService.close(userId, id);
  }
}
