import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';
import { SpecialDay } from './special-day.schema';

export type SpecialDayProgressDocument = HydratedDocument<SpecialDayProgress>;

@Schema({
  collection: 'special_day_progress',
  timestamps: true,
  versionKey: false,
})
export class SpecialDayProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: SpecialDay.name,
    required: true,
    index: true,
  })
  specialDayId!: Types.ObjectId;

  @Prop({ type: [Types.ObjectId], ref: Dhikr.name, default: [] })
  completedDhikrIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Date })
  completedAt?: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const SpecialDayProgressSchema =
  SchemaFactory.createForClass(SpecialDayProgress);

SpecialDayProgressSchema.index(
  { userId: 1, specialDayId: 1 },
  { unique: true },
);
