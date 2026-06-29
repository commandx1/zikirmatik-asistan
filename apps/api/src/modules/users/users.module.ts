import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { User, UserSchema } from './schemas/user.schema';
import {
  AiRecommendation,
  AiRecommendationSchema,
} from '../ai/schemas/ai-recommendation.schema';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Streak, StreakSchema } from '../streaks/schemas/streak.schema';
import {
  Subscription,
  SubscriptionSchema,
} from '../subscriptions/schemas/subscription.schema';
import {
  UserDhikr,
  UserDhikrSchema,
} from '../user-dhikrs/schemas/user-dhikr.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AiRecommendation.name, schema: AiRecommendationSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: Streak.name, schema: StreakSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: UserDhikr.name, schema: UserDhikrSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
