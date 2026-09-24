import type { INestApplication } from '@nestjs/common';
import { getConnectionToken } from '@nestjs/mongoose';
import { Test } from '@nestjs/testing';
import type { Connection, Model } from 'mongoose';
import type { App } from 'supertest/types';
import { AppModule } from '../../src/app.module';
import { configureApp } from '../../src/app.setup';
import { AiRuntimeService } from '../../src/modules/ai/ai-runtime.service';
import { RetrievalService } from '../../src/modules/ai/retrieval.service';
import {
  MockAiRuntimeService,
  MockEmbeddingService,
  MockRetrievalService,
} from '../../src/modules/ai/testing/ai-mocks';
import { EmbeddingService } from '../../src/modules/embedding/embedding.service';
import { PushSenderService } from '../../src/modules/push/push-sender.service';
import { RevenueCatVerifierService } from '../../src/modules/subscriptions/revenuecat-verifier.service';
import { assertTestMongoUri, dropTestDatabase } from './db';

type Override = { token: any; useValue?: any; useClass?: any };

export async function createTestApp(opts: { overrides?: Override[] } = {}) {
  // Prod DB koruması — Nest'e dokunmadan önce.
  assertTestMongoUri(process.env.MONGODB_URI);

  const overrides: Override[] = [
    {
      token: PushSenderService,
      useValue: {
        sendToDevices: jest.fn().mockResolvedValue({
          sentCount: 0,
          skippedCount: 0,
          ticketErrorCount: 0,
          deactivatedDeviceIds: [],
        }),
      },
    },
    // setup-env REVENUECAT_SECRET_API_KEY tanımlı → istemci abonelik yolu bunu
    // çağırır; varsayılan "doğrulanamadı". Testte mockResolvedValue ile ayarla.
    {
      token: RevenueCatVerifierService,
      useValue: { verifyPremium: jest.fn().mockResolvedValue(null) },
    },
    // AI_RUNTIME_MOCK=1 zaten bağlar; açık override env'den bağımsız garanti.
    // Testte: `t.app.get(AiRuntimeService) as MockAiRuntimeService`.
    { token: AiRuntimeService, useClass: MockAiRuntimeService },
    { token: RetrievalService, useClass: MockRetrievalService },
    { token: EmbeddingService, useClass: MockEmbeddingService },
    ...(opts.overrides ?? []),
  ];

  let builder = Test.createTestingModule({ imports: [AppModule] });
  for (const o of overrides) {
    const p = builder.overrideProvider(o.token);
    builder = o.useClass ? p.useClass(o.useClass) : p.useValue(o.useValue);
  }
  const moduleRef = await builder.compile();

  const app: INestApplication = moduleRef.createNestApplication({
    logger: ['error'],
  });
  configureApp(app);
  await app.init();

  const connection = app.get<Connection>(getConnectionToken());

  return {
    app,
    http: app.getHttpServer() as App,
    connection,
    model: <T>(name: string): Model<T> => connection.model<T>(name),
    close: async () => {
      await dropTestDatabase(connection);
      await app.close();
    },
  };
}

export type TestApp = Awaited<ReturnType<typeof createTestApp>>;
