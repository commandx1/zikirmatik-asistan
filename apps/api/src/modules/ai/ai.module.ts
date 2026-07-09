import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { AiController } from './ai.controller';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiService } from './ai.service';
import {
  AiRecommendation,
  AiRecommendationSchema,
} from './schemas/ai-recommendation.schema';
import {
  RecommendationCache,
  RecommendationCacheSchema,
} from './schemas/recommendation-cache.schema';
import {
  AiCreditWallet,
  AiCreditWalletSchema,
} from './schemas/ai-credit-wallet.schema';
import {
  AiCreditLedger,
  AiCreditLedgerSchema,
} from './schemas/ai-credit-ledger.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiRecommendation.name, schema: AiRecommendationSchema },
      { name: RecommendationCache.name, schema: RecommendationCacheSchema },
      { name: AiCreditWallet.name, schema: AiCreditWalletSchema },
      { name: AiCreditLedger.name, schema: AiCreditLedgerSchema },
      { name: Dhikr.name, schema: DhikrSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
    ]),
  ],
  controllers: [AiController],
  providers: [AiService, AiProgressGateway],
  exports: [AiService],
})
export class AiModule {}
