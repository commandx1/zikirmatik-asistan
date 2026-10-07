import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import type { AiCreditReason } from '../credits.constants';

export type AiCreditWalletDocument = HydratedDocument<AiCreditWallet>;

@Schema({
  collection: 'ai_credit_wallets',
  timestamps: true,
  versionKey: false,
})
export class AiCreditWallet {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  balance!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  grantCredits!: number;

  @Prop({ type: Number, required: true, default: 0, min: 0 })
  topupCredits!: number;

  @Prop({ type: String })
  grantReason?: AiCreditReason;

  @Prop({ type: String })
  grantCycleKey?: string;

  // A-08: grantCredits bu UTC ayın (YYYY-MM) premium aylık kredisini taşıyorsa
  // o ay; premium bitince kalan hak ay sonuna kadar ücretsiz günlerde silinmez.
  @Prop({ type: String, default: null })
  carryMonthKey?: string | null;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const AiCreditWalletSchema =
  SchemaFactory.createForClass(AiCreditWallet);

AiCreditWalletSchema.index({ userId: 1 }, { unique: true });
