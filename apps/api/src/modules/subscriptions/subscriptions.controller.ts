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
import { CreateSubscriptionDto } from './dto/create-subscription.dto';
import { QuerySubscriptionsDto } from './dto/query-subscriptions.dto';
import { UpdateSubscriptionDto } from './dto/update-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

@Controller('v1/subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Post()
  create(@Body() payload: CreateSubscriptionDto) {
    return this.subscriptionsService.create(payload);
  }

  @Get()
  findAll(@Query() query: QuerySubscriptionsDto) {
    return this.subscriptionsService.findAll(query);
  }

  @Get(':id')
  findById(@Param('id') id: string) {
    return this.subscriptionsService.findById(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() payload: UpdateSubscriptionDto) {
    return this.subscriptionsService.update(id, payload);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.subscriptionsService.remove(id);
  }

  @Post('sync-user/:userId')
  syncPremiumForUser(@Param('userId') userId: string) {
    return this.subscriptionsService.syncPremiumForUser(userId);
  }
}
