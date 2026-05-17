import {
  Controller,
  ForbiddenException,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { StreaksService } from './streaks.service';

@Controller('v1/streaks')
@UseGuards(JwtAuthGuard)
export class StreaksController {
  constructor(private readonly streaksService: StreaksService) {}

  @Get(':userId')
  getByUser(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    assertSelfUser(userId, currentUserId);
    return this.streaksService.getByUser(userId);
  }

  @Post(':userId/recalculate')
  recalculateForUser(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    assertSelfUser(userId, currentUserId);
    return this.streaksService.recalculateForUser(userId);
  }

  @Post('recalculate-all')
  recalculateAll() {
    throw new ForbiddenException('Bu endpoint dış istemciler için kapalıdır.');
  }
}

function assertSelfUser(targetUserId: string, currentUserId: string) {
  if (targetUserId !== currentUserId) {
    throw new ForbiddenException(
      'Sadece kendi istatistik verini görebilirsin.',
    );
  }
}
