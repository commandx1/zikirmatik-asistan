import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { User, UserSchema } from '../users/schemas/user.schema';
import {
  Subscription,
  SubscriptionSchema,
} from './schemas/subscription.schema';
import { RevenueCatVerifierService } from './revenuecat-verifier.service';
import { SubscriptionsController } from './subscriptions.controller';
import { SubscriptionsService } from './subscriptions.service';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [SubscriptionsController],
  providers: [SubscriptionsService, RevenueCatVerifierService],
  exports: [SubscriptionsService],
})
export class SubscriptionsModule {}
