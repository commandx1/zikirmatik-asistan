import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DhikrCollectionDocument = HydratedDocument<DhikrCollection>;

@Schema({
  collection: 'dhikr_collections',
  timestamps: true,
  versionKey: false,
})
export class DhikrCollection {
  @Prop({ type: String, required: true, trim: true })
  key!: string;

  @Prop({ type: String, required: true, trim: true })
  label!: string;

  @Prop({ type: String, trim: true })
  description?: string;

  @Prop({ type: String, required: true, trim: true })
  category!: string;

  @Prop({ type: [{ type: Types.ObjectId, ref: 'Dhikr' }], default: [] })
  dhikrIds!: Types.ObjectId[];

  @Prop({ type: Number, default: 0 })
  dhikrCount!: number;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const DhikrCollectionSchema =
  SchemaFactory.createForClass(DhikrCollection);

DhikrCollectionSchema.index({ key: 1 }, { unique: true });
DhikrCollectionSchema.index({ category: 1, isActive: 1 });
