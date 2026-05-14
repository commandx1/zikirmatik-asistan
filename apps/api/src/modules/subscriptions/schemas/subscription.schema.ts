import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type SubscriptionDocument = HydratedDocument<Subscription>;

@Schema({ collection: 'subscriptions', timestamps: true, versionKey: false })
export class Subscription {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ['free', 'premium'], default: 'free' })
  plan!: 'free' | 'premium';

  @Prop({ type: String, enum: ['apple', 'google'], required: true })
  provider!: 'apple' | 'google';

  @Prop({
    type: String,
    enum: ['active', 'expired', 'cancelled'],
    required: true,
  })
  status!: 'active' | 'expired' | 'cancelled';

  @Prop({ type: String, required: true })
  productId!: string;

  @Prop({ type: Date, required: true })
  startDate!: Date;

  @Prop({ type: Date, required: true })
  endDate!: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const SubscriptionSchema = SchemaFactory.createForClass(Subscription);

SubscriptionSchema.index({ status: 1, endDate: 1 });
