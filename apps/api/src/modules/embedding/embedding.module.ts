import { Module } from '@nestjs/common';
import { MockEmbeddingService } from '../ai/testing/ai-mocks';
import { EmbeddingService } from './embedding.service';

@Module({
  providers: [
    {
      provide: EmbeddingService,
      useClass:
        process.env.AI_RUNTIME_MOCK === '1'
          ? MockEmbeddingService
          : EmbeddingService,
    },
  ],
  exports: [EmbeddingService],
})
export class EmbeddingModule {}
