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
import {
  AuthIdentity,
  AuthIdentitySchema,
} from '../auth/schemas/auth-identity.schema';
import {
  VirdDayProgress,
  VirdDayProgressSchema,
} from '../vird/schemas/vird-day-progress.schema';
import {
  VirdProgram,
  VirdProgramSchema,
} from '../vird/schemas/vird-program.schema';

import { Device, DeviceSchema } from '../devices/schemas/device.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: User.name, schema: UserSchema },
      { name: AiRecommendation.name, schema: AiRecommendationSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: Streak.name, schema: StreakSchema },
      { name: Subscription.name, schema: SubscriptionSchema },
      { name: UserDhikr.name, schema: UserDhikrSchema },
      { name: AuthIdentity.name, schema: AuthIdentitySchema },
      // Yalnız şema: deleteUserAllData bu modelleri doğrudan siler (VirdModule
      // import edilmez, tıpkı diğer tüm bağımlılıklar gibi).
      { name: VirdProgram.name, schema: VirdProgramSchema },
      { name: VirdDayProgress.name, schema: VirdDayProgressSchema },
      { name: Device.name, schema: DeviceSchema },
    ]),
  ],
  controllers: [UsersController],
  providers: [UsersService],
  exports: [UsersService, MongooseModule],
})
export class UsersModule {}
