/**
 * Eval harness'inin Nest DI konteynerine tek giriş noktası. `run-*-eval.ts`
 * script'leri gerçek `RecommendationAgentService`/`AiChatService`
 * instance'larına HTTP/controller katmanı olmadan, doğrudan DI üzerinden
 * erişmek için bunu kullanır — böylece production kodunun davranışı
 * (retry, retrieval, prompt, usage-log) birebir test edilir.
 *
 * BİLİNÇLİ OLARAK yalnızca `--dry-run` DIŞINDA import edilir (bkz.
 * run-rehber-eval.ts / run-chat-eval.ts): bu dosyanın import edilmesi
 * `AppModule`'ü (ve dolayısıyla `MongooseModule.forRootAsync`'i) yükler,
 * `bootstrapEvalContext()` çağrısı ise gerçekten Mongo'ya bağlanır.
 */
import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { getModelToken } from '@nestjs/mongoose';
import type { INestApplicationContext } from '@nestjs/common';
import type { Model } from 'mongoose';
import { AppModule } from '../../../src/app.module';
import { RecommendationAgentService } from '../../../src/modules/ai/recommendation-agent.service';
import { AiChatService } from '../../../src/modules/ai-chat/ai-chat.service';
import {
  AiUsageLog,
  type AiUsageLogDocument,
} from '../../../src/modules/ai/schemas/ai-usage-log.schema';

export type EvalContext = {
  app: INestApplicationContext;
  agent: RecommendationAgentService;
  chat: AiChatService;
  usageLogModel: Model<AiUsageLogDocument>;
};

export async function bootstrapEvalContext(): Promise<EvalContext> {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ['warn', 'error'],
  });

  const agent = app.get(RecommendationAgentService, { strict: false });
  const chat = app.get(AiChatService, { strict: false });
  const usageLogModel = app.get<Model<AiUsageLogDocument>>(
    getModelToken(AiUsageLog.name),
    { strict: false },
  );

  return { app, agent, chat, usageLogModel };
}
