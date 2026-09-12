import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { LocalizedText } from '../../../common/types/localized-text';

export type DhikrDocument = HydratedDocument<Dhikr>;

// Çok dilli alt-şema: her alan { tr, en } nesnesi olarak tutulur. Her iki dil
// de zorunludur — API yanıtları her zaman ikisini birden döner (Accept-Language
// ile tek dile indirgeme yok).
const LOCALIZED_TEXT_SCHEMA = {
  type: {
    tr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  required: true,
};

@Schema({ collection: 'dhikrs', timestamps: true, versionKey: false })
export class Dhikr {
  // Seed verisindeki stabil tanımlayıcı. Seed'ler bu key üzerinden upsert
  // eder; name/transliteration düzenlense bile kayıt eşleşmesi bozulmaz.
  // Elle/admin üzerinden eklenen kayıtlarda bulunmayabilir (sparse).
  @Prop({ type: String, trim: true })
  key?: string;

  @Prop({ type: String, required: true, trim: true })
  nameArabic!: string;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  name!: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  transliteration!: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  meaning!: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  virtue!: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  source!: LocalizedText;

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

  // Bu zikrin PATCH .../select ile kaç kez fiilen seçildiğinin sayacı.
  // recommendedCount ile KARIŞTIRILMAMALI: recommendedCount mobil tarafta
  // "kaç kez çekilecek" tekrar hedefidir (statik katalog verisi), buysa
  // gerçek kullanıcı seçim telemetrisidir. Eskiden ikisi yanlışlıkla aynı
  // alanda tutuluyordu (bkz. selectRecommendation).
  @Prop({ type: Number, default: 0 })
  selectionCount!: number;

  @Prop({ type: [String], default: [] })
  suitableFor!: string[];

  @Prop({ type: Boolean, default: true })
  isVerified!: boolean;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  @Prop({ type: String })
  audioUrl?: string;

  // Anlamsal arama (AI Rehber retrieval aşaması) için önceden hesaplanmış
  // embedding vektörü. select:false → normal sorgularda taşınmaz, yalnız
  // AI servisi açıkça ister. Bkz. EmbeddingService.
  @Prop({ type: [Number], default: undefined, select: false })
  embedding?: number[];

  // Embedding'in türetildiği kaynak metnin hash'i; metin değişmediyse
  // güncelleme sırasında yeniden embed etmemek için kullanılır.
  @Prop({ type: String })
  embeddingSourceHash?: string;

  @Prop({ type: String })
  embeddingModel?: string;

  @Prop({ type: Date })
  embeddingUpdatedAt?: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const DhikrSchema = SchemaFactory.createForClass(Dhikr);

DhikrSchema.index({ key: 1 }, { unique: true, sparse: true });
DhikrSchema.index({ tags: 1 });
DhikrSchema.index({ categories: 1 });
DhikrSchema.index({ suitableFor: 1 });
DhikrSchema.index({ isVerified: 1, isActive: 1 });
DhikrSchema.index({ timeOfDay: 1, isVerified: 1 });

// Standart MongoDB $text index — Atlas Search (FTS) index kotası dolu
// olduğu için hibrit aramanın zikir bacağı (RetrievalService.
// searchDhikrsByText → runDhikrTextSearch) Atlas $search yerine bunu
// kullanır (bkz. docs/ai-mimari.md §6). Koleksiyon başına yalnızca BİR
// text index olabilir — bu yüzden tüm aranabilir alanlar tek index'te
// weight'lerle toplanır (isim/transliterasyon en yüksek ağırlıkta).
// autoIndex:true (bkz. app.module.ts) ile app açılışında da oluşur;
// prod'da garanti için ayrıca `scripts/create-dhikr-text-index.mjs`
// çalıştırılır.
DhikrSchema.index(
  {
    'name.tr': 'text',
    'transliteration.tr': 'text',
    'meaning.tr': 'text',
    'virtue.tr': 'text',
    tags: 'text',
    suitableFor: 'text',
    categories: 'text',
  },
  {
    name: 'dhikr_text_idx',
    default_language: 'turkish',
    weights: {
      'name.tr': 10,
      'transliteration.tr': 8,
      tags: 5,
      suitableFor: 5,
      categories: 3,
      'meaning.tr': 2,
      'virtue.tr': 1,
    },
  },
);
