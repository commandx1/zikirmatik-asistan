import { Controller, Get, UseGuards } from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StatsService } from './stats.service';

@Controller('v1/stats')
@UseGuards(JwtAuthGuard)
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get('summary')
  getSummary(@CurrentUserId() userId: string) {
    return this.statsService.getSummary(userId);
  }
}
