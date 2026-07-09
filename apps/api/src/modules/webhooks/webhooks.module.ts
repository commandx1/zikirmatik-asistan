import { Module } from '@nestjs/common';
import { AiModule } from '../ai/ai.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { WebhooksController } from './webhooks.controller';

@Module({
  imports: [SubscriptionsModule, AiModule],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
