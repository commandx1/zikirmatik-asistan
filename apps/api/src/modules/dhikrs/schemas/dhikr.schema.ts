import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type DhikrDocument = HydratedDocument<Dhikr>;

@Schema({ collection: 'dhikrs', timestamps: true, versionKey: false })
export class Dhikr {
  @Prop({ type: String, required: true, trim: true })
  nameArabic!: string;

  @Prop({ type: String, required: true, trim: true })
  nameTurkish!: string;

  @Prop({ type: String, required: true, trim: true })
  transliteration!: string;

  @Prop({ type: String, required: true, trim: true })
  meaning!: string;

  @Prop({ type: String, required: true, trim: true })
  virtue!: string;

  @Prop({ type: String, required: true, trim: true })
  source!: string;

  @Prop({ type: [String], default: [] })
  tags!: string[];

  @Prop({ type: [String], default: [] })
  categories!: string[];

  @Prop({
    type: String,
    enum: ['morning', 'evening', 'night', 'any'],
    default: 'any',
  })
  timeOfDay!: 'morning' | 'evening' | 'night' | 'any';

  @Prop({ type: Number, min: 1, default: 33 })
  recommendedCount!: number;

  @Prop({ type: [String], default: [] })
  suitableFor!: string[];

  @Prop({ type: Boolean, default: true })
  isVerified!: boolean;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String })
  audioUrl?: string;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const DhikrSchema = SchemaFactory.createForClass(Dhikr);

DhikrSchema.index({ tags: 1 });
DhikrSchema.index({ categories: 1 });
DhikrSchema.index({ isVerified: 1, isActive: 1 });
DhikrSchema.index({ timeOfDay: 1, isVerified: 1 });
