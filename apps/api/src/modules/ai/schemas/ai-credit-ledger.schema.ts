import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { AI_CREDIT_REASONS, type AiCreditReason } from '../credits.constants';

export type AiCreditLedgerDocument = HydratedDocument<AiCreditLedger>;

@Schema({
  collection: 'ai_credit_ledger',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AiCreditLedger {
  @Prop({ type: Types.ObjectId, ref: User.name, required: false, index: true })
  userId?: Types.ObjectId;

  @Prop({
    type: String,
    required: true,
    enum: Object.values(AI_CREDIT_REASONS),
    index: true,
  })
  reason!: AiCreditReason;

  @Prop({ type: Number, required: true })
  delta!: number;

  @Prop({ type: Number })
  balanceAfter?: number;

  @Prop({ type: String })
  dayKey?: string;

  @Prop({ type: String })
  monthKey?: string;

  @Prop({ type: String })
  flowId?: string;

  /**
   * RECOMMENDATION_DEBIT kayıtları için istek içeriğinin sha256 hash'i.
   * Aynı flowId ile gelen isteğin gerçek bir idempotent retry mı yoksa
   * farklı içerikle kredi bypass denemesi mi olduğunu ayırt etmek için.
   */
  @Prop({ type: String })
  promptHash?: string;

  @Prop({ type: String })
  providerEventId?: string;

  @Prop({ type: SchemaTypes.Mixed })
  metadata?: Record<string, unknown>;

  readonly createdAt!: Date;
}

export const AiCreditLedgerSchema =
  SchemaFactory.createForClass(AiCreditLedger);

AiCreditLedgerSchema.index(
  { userId: 1, reason: 1, dayKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reason: AI_CREDIT_REASONS.FREE_DAILY_GRANT,
      dayKey: { $exists: true, $type: 'string' },
    },
  },
);

AiCreditLedgerSchema.index(
  { userId: 1, reason: 1, monthKey: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reason: AI_CREDIT_REASONS.PREMIUM_MONTHLY_GRANT,
      monthKey: { $exists: true, $type: 'string' },
    },
  },
);

AiCreditLedgerSchema.index(
  { userId: 1, reason: 1, flowId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reason: AI_CREDIT_REASONS.RECOMMENDATION_DEBIT,
      flowId: { $exists: true, $type: 'string' },
    },
  },
);

AiCreditLedgerSchema.index(
  { userId: 1, reason: 1, flowId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reason: AI_CREDIT_REASONS.CHAT_MESSAGE_DEBIT,
      flowId: { $exists: true, $type: 'string' },
    },
  },
);

AiCreditLedgerSchema.index(
  { reason: 1, providerEventId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      reason: AI_CREDIT_REASONS.TOPUP_PURCHASE,
      providerEventId: { $exists: true, $type: 'string' },
    },
  },
);
