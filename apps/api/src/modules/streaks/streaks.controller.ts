import { Controller, Get, Param, Post } from '@nestjs/common';
import { StreaksService } from './streaks.service';

@Controller('v1/streaks')
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get(':userId')
  getByUser(@Param('userId') userId: string) {
    return this.streaksService.getByUser(userId);
  }

  @Post(':userId/recalculate')
  recalculateForUser(@Param('userId') userId: string) {
    return this.streaksService.recalculateForUser(userId);
  }

  @Post('recalculate-all')
  recalculateAll() {
    return this.streaksService.recalculateAll();
  }
}
