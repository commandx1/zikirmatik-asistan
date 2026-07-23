import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { estimateCostUsd } from './ai-pricing.constants';
import {
  AiUsageKind,
  AiUsageLog,
  AiUsageLogDocument,
} from './schemas/ai-usage-log.schema';

/**
 * `ai` SDK sürümüne göre değişebilen kullanım şekilleri: v6'da
 * {inputTokens, outputTokens, totalTokens}, daha eski sürümlerde
 * {promptTokens, completionTokens, totalTokens}. İkisini de tolere eder.
 */
type LooseUsage =
  | {
      inputTokens?: number;
      outputTokens?: number;
      totalTokens?: number;
      promptTokens?: number;
      completionTokens?: number;
    }
  | null
  | undefined;

export type RecordUsageEntry = {
  kind: AiUsageKind;
  model: string;
  usage: LooseUsage;
  userId?: Types.ObjectId | string;
  flowId?: string;
  steps?: number;
};

function extractTokens(usage: LooseUsage): {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
} | null {
  if (!usage) {
    return null;
  }

  const inputTokens = usage.inputTokens ?? usage.promptTokens ?? 0;
  const outputTokens = usage.outputTokens ?? usage.completionTokens ?? 0;
  const totalTokens = usage.totalTokens ?? inputTokens + outputTokens;

  if (
    !Number.isFinite(inputTokens) &&
    !Number.isFinite(outputTokens) &&
    !Number.isFinite(totalTokens)
  ) {
    return null;
  }

  return {
    inputTokens: Number.isFinite(inputTokens) ? inputTokens : 0,
    outputTokens: Number.isFinite(outputTokens) ? outputTokens : 0,
    totalTokens: Number.isFinite(totalTokens) ? totalTokens : 0,
  };
}

/**
 * AI çağrılarının token kullanımını/tahmini maliyetini kaydeden salt
 * gözlemsel katman. `record()` HİÇBİR ZAMAN akışı bloklamamalı veya
 * hata fırlatmamalıdır — çağıranlar fire-and-forget (`void`) kullanmalı.
 */
@Injectable()
export class AiUsageService {
  private readonly logger = new Logger(AiUsageService.name);

  constructor(
    @InjectModel(AiUsageLog.name)
    private readonly aiUsageLogModel: Model<AiUsageLogDocument>,
  ) {}

  async record(entry: RecordUsageEntry): Promise<void> {
    try {
      const tokens = extractTokens(entry.usage);
      if (!tokens) {
        return;
      }

      const estCostUsd = estimateCostUsd(
        entry.model,
        tokens.inputTokens,
        tokens.outputTokens,
      );

      const userId =
        typeof entry.userId === 'string'
          ? Types.ObjectId.isValid(entry.userId)
            ? new Types.ObjectId(entry.userId)
            : undefined
          : entry.userId;

      const doc = new this.aiUsageLogModel({
        userId,
        flowId: entry.flowId,
        kind: entry.kind,
        model: entry.model,
        inputTokens: tokens.inputTokens,
        outputTokens: tokens.outputTokens,
        totalTokens: tokens.totalTokens,
        steps: entry.steps,
        estCostUsd,
      });
      await doc.save();
    } catch (error) {
      this.logger.warn(
        `AI usage kaydı yazılamadı (kind=${entry.kind}, model=${entry.model}): ${
          error instanceof Error ? error.message : 'bilinmeyen hata'
        }`,
      );
    }
  }
}
