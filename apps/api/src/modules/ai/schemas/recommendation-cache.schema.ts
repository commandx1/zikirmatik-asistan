import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';

export type RecommendationCacheDocument = HydratedDocument<RecommendationCache>;

/**
 * AI Rehber öneri cache'i. Aynı niyet + zaman bağlamı + katalog sürümü için
 * embedding ve LLM rerank çağrılarını atlayarak maliyeti düşürür. createdAt
 * üzerindeki TTL index ile kayıtlar otomatik süresi dolar (varsayılan 24 saat).
 */
@Schema({
  collection: 'recommendation_cache',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class RecommendationCache {
  @Prop({ type: String, required: true, unique: true })
  cacheKey!: string;

  @Prop({ type: [Types.ObjectId], ref: Dhikr.name, required: true })
  recommendedDhikrIds!: Types.ObjectId[];

  @Prop({ type: String })
  reasoning?: string;

  @Prop({ type: String })
  usedModel?: string;

  readonly createdAt!: Date;
}

export const RecommendationCacheSchema =
  SchemaFactory.createForClass(RecommendationCache);

const CACHE_TTL_HOURS = Number(process.env.AI_CACHE_TTL_HOURS) || 24;

RecommendationCacheSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: Math.max(1, Math.round(CACHE_TTL_HOURS * 3600)) },
);
