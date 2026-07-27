import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { LocalizedText } from '../../../common/types/localized-text';

export type SpecialDayDocument = HydratedDocument<SpecialDay>;

/** Özel güne ait tek bir ibadet tavsiyesi (başlık + açıklama). */
export type SpecialDayPractice = {
  title: LocalizedText;
  description: LocalizedText;
};

// Çok dilli alt-şema ({ tr, en }) — zikir kataloğundaki desenin aynısı. Her iki
// dil de zorunludur; API yanıtları her zaman ikisini birden döner.
const LOCALIZED_TEXT_SCHEMA = {
  type: {
    tr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  required: true,
};

// description gibi opsiyonel alanlar için gevşetilmiş varyant.
const LOCALIZED_TEXT_SCHEMA_OPTIONAL = {
  type: {
    tr: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  required: false,
};

// practices[] alt-şeması. İçerik metinleri sonradan doldurulacağı için tüm
// alanlar gevşek tanımlıdır; boş liste geçerli bir durumdur.
const PRACTICE_SCHEMA = {
  type: [
    {
      _id: false,
      title: LOCALIZED_TEXT_SCHEMA_OPTIONAL,
      description: LOCALIZED_TEXT_SCHEMA_OPTIONAL,
    },
  ],
  default: [],
};

@Schema({ collection: 'special_days', timestamps: true, versionKey: false })
export class SpecialDay {
  @Prop(LOCALIZED_TEXT_SCHEMA)
  name!: LocalizedText;

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

  // Liste/hero kartlarında görünen kısa özet.
  @Prop(LOCALIZED_TEXT_SCHEMA_OPTIONAL)
  description?: LocalizedText;

  // Detay ekranında gösterilen uzun anlatım (günün anlamı, tarihi, fazileti).
  // İçerik editoryal olarak sonradan doldurulur; boşken UI kartı render etmez.
  @Prop(LOCALIZED_TEXT_SCHEMA_OPTIONAL)
  article?: LocalizedText;

  // "O gün yapılması tavsiye edilen diğer ibadetler" listesi. article ile aynı
  // şekilde sonradan doldurulur.
  @Prop(PRACTICE_SCHEMA)
  practices!: SpecialDayPractice[];

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
