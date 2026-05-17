import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';

export type DhikrLogDocument = HydratedDocument<DhikrLog>;

@Schema({
  collection: 'dhikr_logs',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class DhikrLog {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: Types.ObjectId, ref: Dhikr.name, index: true })
  dhikrId?: Types.ObjectId;

  @Prop({ type: String, trim: true, index: true })
  customDhikrId?: string;

  @Prop({ type: String, trim: true })
  customDhikrName?: string;

  @Prop({ type: String, trim: true })
  customDhikrArabic?: string;

  @Prop({ type: Number, required: true, min: 0 })
  count!: number;

  @Prop({ type: Number, required: true, min: 0 })
  targetCount!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  sessionDuration!: number;

  @Prop({
    type: String,
    enum: ['manual', 'ai', 'kandil', 'notification'],
    default: 'manual',
  })
  source!: 'manual' | 'ai' | 'kandil' | 'notification';

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Boolean, default: false })
  isFavorite!: boolean;

  @Prop({ type: String, required: true })
  date!: string;

  readonly createdAt!: Date;
}

export const DhikrLogSchema = SchemaFactory.createForClass(DhikrLog);

DhikrLogSchema.index({ userId: 1, date: -1 });
DhikrLogSchema.index({ userId: 1, dhikrId: 1, date: 1 });
DhikrLogSchema.index({ userId: 1, customDhikrId: 1, date: 1 });
