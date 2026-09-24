import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import {
  DhikrLog,
  DhikrLogSchema,
} from '../dhikr-logs/schemas/dhikr-log.schema';
import { Dhikr, DhikrSchema } from '../dhikrs/schemas/dhikr.schema';
import { EmbeddingModule } from '../embedding/embedding.module';
import { User, UserSchema } from '../users/schemas/user.schema';
import { VirdModule } from '../vird/vird.module';
import { AiController } from './ai.controller';
import { AiCreditsService } from './ai-credits.service';
import { AiProgressGateway } from './ai-progress.gateway';
import { AiRuntimeService } from './ai-runtime.service';
import { AiService } from './ai.service';
import { AiUsageService } from './ai-usage.service';
import { AiVirdService } from './ai-vird.service';
import { RecommendationAgentService } from './recommendation-agent.service';
import { RetrievalService } from './retrieval.service';
import { VirdProgramAgentService } from './vird-program-agent.service';
import { MockAiRuntimeService, MockRetrievalService } from './testing/ai-mocks';
import { AiUsageLog, AiUsageLogSchema } from './schemas/ai-usage-log.schema';
import {
  AiRecommendation,
  AiRecommendationSchema,
} from './schemas/ai-recommendation.schema';
import {
  AiCreditWallet,
  AiCreditWalletSchema,
} from './schemas/ai-credit-wallet.schema';
import {
  AiCreditLedger,
  AiCreditLedgerSchema,
} from './schemas/ai-credit-ledger.schema';
import {
  SourcePassage,
  SourcePassageSchema,
} from './schemas/source-passage.schema';

const AI_RUNTIME_MOCK = process.env.AI_RUNTIME_MOCK === '1';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: AiRecommendation.name, schema: AiRecommendationSchema },
      { name: AiCreditWallet.name, schema: AiCreditWalletSchema },
      { name: AiCreditLedger.name, schema: AiCreditLedgerSchema },
      { name: Dhikr.name, schema: DhikrSchema },
      { name: DhikrLog.name, schema: DhikrLogSchema },
      { name: User.name, schema: UserSchema },
      { name: SourcePassage.name, schema: SourcePassageSchema },
      { name: AiUsageLog.name, schema: AiUsageLogSchema },
    ]),
    EmbeddingModule,
    // Yalnızca AiVirdService'in VirdProgramsService.createAiDraft'ı
    // çağırması için — ters yön yok (VirdModule AiModule'ü import ETMEZ).
    VirdModule,
  ],
  controllers: [AiController],
  providers: [
    AiService,
    AiCreditsService,
    AiProgressGateway,
    AiUsageService,
    // AI_RUNTIME_MOCK=1: e2e/k6 için sahte LLM + retrieval (bkz. testing/ai-mocks.ts).
    {
      provide: AiRuntimeService,
      useClass: AI_RUNTIME_MOCK ? MockAiRuntimeService : AiRuntimeService,
    },
    {
      provide: RetrievalService,
      useClass: AI_RUNTIME_MOCK ? MockRetrievalService : RetrievalService,
    },
    RecommendationAgentService,
    VirdProgramAgentService,
    AiVirdService,
  ],
  exports: [
    AiService,
    AiCreditsService,
    AiProgressGateway,
    AiUsageService,
    AiRuntimeService,
    RetrievalService,
  ],
})
export class AiModule {}
