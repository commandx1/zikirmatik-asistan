import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';

export type SpecialDayDocument = HydratedDocument<SpecialDay>;

@Schema({ collection: 'special_days', timestamps: true, versionKey: false })
export class SpecialDay {
  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({
    type: String,
    enum: ['kandil', 'ramazan', 'bayram', 'özel gün'],
    required: true,
  })
  type!: 'kandil' | 'ramazan' | 'bayram' | 'özel gün';

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: String, required: true, trim: true })
  hijriDate!: string;

  @Prop({ type: String, trim: true, lowercase: true })
  eventKey?: string;

  @Prop({ type: Number, min: 1 })
  dayIndex?: number;

  @Prop({ type: Number, min: 1 })
  dayCount?: number;

  @Prop({ type: Number, default: 0 })
  priority!: number;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: [Types.ObjectId], ref: Dhikr.name, default: [] })
  recommendedDhikrIds!: Types.ObjectId[];

  @Prop({ type: Boolean, default: false })
  hasSpecialFlow!: boolean;

  @Prop({ type: [Number], default: [1440, 60] })
  notifyBeforeMinutes!: number[];

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const SpecialDaySchema = SchemaFactory.createForClass(SpecialDay);

SpecialDaySchema.index({ date: 1 });
SpecialDaySchema.index({ type: 1, isActive: 1 });
SpecialDaySchema.index({ eventKey: 1, dayIndex: 1 });
