import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { LocalizedText } from '../../../common/types/localized-text';

export type DhikrCollectionDocument = HydratedDocument<DhikrCollection>;

// Çok dilli alt-şema ({ tr, en }) — zikir kataloğundaki desenin aynısı.
const LOCALIZED_TEXT_SCHEMA = {
  type: {
    tr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  required: true,
};

const LOCALIZED_TEXT_SCHEMA_OPTIONAL = {
  type: {
    tr: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  required: false,
};

@Schema({
  collection: 'dhikr_collections',
  timestamps: true,
  versionKey: false,
})
export class DhikrCollection {
  @Prop({ type: String, required: true, trim: true })
  key!: string;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  label!: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA_OPTIONAL)
  description?: LocalizedText;

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
