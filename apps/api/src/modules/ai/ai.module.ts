import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import {
  AiRecommendation,
  AiRecommendationSchema,
} from './schemas/ai-recommendation.schema';
import {
  RecommendationCache,
  RecommendationCacheSchema,
} from './schemas/recommendation-cache.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiRecommendation.name, schema: AiRecommendationSchema },
      { name: RecommendationCache.name, schema: RecommendationCacheSchema },
      { name: Dhikr.name, schema: DhikrSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService],
})
export class AiModule {}
