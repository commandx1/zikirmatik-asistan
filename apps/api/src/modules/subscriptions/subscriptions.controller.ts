import {
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentUserId } from '../../common/auth/current-user-id.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('v1/subscriptions')
@UseGuards(JwtAuthGuard)
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(
    @Body() payload: CreateSubscriptionDto,
    @CurrentUserId() userId: string,
  ) {
    assertSelfUser(payload.userId, userId);
    return this.subscriptionsService.create(payload);
  }

  @Get()
  findAll(
    @Query() query: QuerySubscriptionsDto,
    @CurrentUserId() userId: string,
  ) {
    if (query.userId && query.userId !== userId) {
      throw new ForbiddenException(
        'Sadece kendi abonelik kayıtlarını görebilirsin.',
      );
    }
    query.userId = userId;
    return this.subscriptionsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.subscriptionsService.findById(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() payload: UpdateSubscriptionDto,
    @CurrentUserId() userId: string,
  ) {
    if (payload.userId && payload.userId !== userId) {
      throw new ForbiddenException(
        'Sadece kendi abonelik kaydını güncelleyebilirsin.',
      );
    }
    return this.subscriptionsService.update(id, payload, userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @CurrentUserId() userId: string) {
    return this.subscriptionsService.remove(id, userId);
  }

  @Post('sync-user/:userId')
  syncPremiumForUser(
    @Param('userId') userId: string,
    @CurrentUserId() currentUserId: string,
  ) {
    assertSelfUser(userId, currentUserId);
    return this.subscriptionsService.syncPremiumForUser(userId);
  }
}

function assertSelfUser(targetUserId: string, currentUserId: string) {
  if (targetUserId !== currentUserId) {
    throw new ForbiddenException(
      'Sadece kendi kullanıcı kaydını yönetebilirsin.',
    );
  }
}
