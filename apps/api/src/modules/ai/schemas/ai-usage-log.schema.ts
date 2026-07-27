import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AiUsageLogDocument = HydratedDocument<AiUsageLog>;

export type AiUsageKind =
  | 'recommend'
  | 'chat'
  | 'chat_stream'
  | 'classify'
  | 'expand'
  | 'embedding';

export const AI_USAGE_KINDS: AiUsageKind[] = [
  'recommend',
  'chat',
  'chat_stream',
  'classify',
  'expand',
  'embedding',
];

@Schema({
  collection: 'ai_usage_log',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AiUsageLog {
  @Prop({ type: Types.ObjectId, ref: User.name, required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({ type: String, required: false, index: true })
  flowId?: string;

  @Prop({ type: String, required: true, enum: AI_USAGE_KINDS })
  kind!: AiUsageKind;

  @Prop({ type: String, required: true })
  model!: string;

  @Prop({ type: Number, default: 0 })
  inputTokens!: number;

  @Prop({ type: Number, default: 0 })
  outputTokens!: number;

  @Prop({ type: Number, default: 0 })
  totalTokens!: number;

  @Prop({ type: Number, required: false })
  steps?: number;

  @Prop({ type: Number, default: 0 })
  estCostUsd!: number;

  readonly createdAt!: Date;
}

export const AiUsageLogSchema = SchemaFactory.createForClass(AiUsageLog);

AiUsageLogSchema.index({ createdAt: -1 });
AiUsageLogSchema.index({ userId: 1, createdAt: -1 });
AiUsageLogSchema.index({ flowId: 1 });
AiUsageLogSchema.index({ model: 1, createdAt: -1 });
