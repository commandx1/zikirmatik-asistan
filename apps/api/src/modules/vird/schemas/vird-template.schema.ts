import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';
import type { LocalizedText } from '../../../common/types/localized-text';
import type { VirdProgramKind } from '../vird.types';

export type VirdTemplateDocument = HydratedDocument<VirdTemplate>;

/**
 * Şablon servisi: VirdTemplatesService (GET /v1/vird/templates,
 * GET /v1/vird/templates/:key — bkz. vird-templates.controller.ts) ve seed'i
 * (scripts/lib/vird-template-seed.mjs) bu şemayı kullanır. İçerik alanları
 * (title/description) kasıtlı olarak opsiyoneldir: bu metinleri Claude yazmaz,
 * yalnız yapı hazırlanır (bkz. proje belleği: "İslami içerik kullanıcıya ait")
 * — klasik (routine) şablonlarda bu alanlar seed'de ilgili koleksiyonun
 * (dhikr_collections) mevcut label/description'ından doldurulur, YENİ metin
 * yazılmaz. Ramazan/Esma/Kandil gibi çok fazlı/özel-gün bağlı (anchorDate +
 * sourceEventKey) premium şablonlar SONRAKİ bir görevin kapsamındadır.
 */
export type VirdTemplateItem = {
  // Katalogdaki Dhikr.key alanına karşılık gelir (ObjectId değil — şablonlar
  // ortamlar arası taşınabilir/statik seed verisidir).
  dhikrKey: string;
  target: number;
};

export type VirdTemplatePhaseSlots = {
  morning?: VirdTemplateItem[];
  prayer?: VirdTemplateItem[];
  evening?: VirdTemplateItem[];
  night?: VirdTemplateItem[];
  free?: VirdTemplateItem[];
};

export type VirdTemplatePhase = {
  fromDay: number;
  toDay: number | null;
  note?: string;
  slots: VirdTemplatePhaseSlots;
};

const LOCALIZED_TEXT_SCHEMA_OPTIONAL = {
  type: {
    tr: { type: String, trim: true },
    en: { type: String, trim: true },
  },
  required: false,
};

const VIRD_TEMPLATE_ITEM_SCHEMA = {
  _id: false,
  dhikrKey: { type: String, required: true, trim: true },
  target: { type: Number, required: true, min: 1 },
};

const VIRD_TEMPLATE_PHASE_SLOTS_SCHEMA = {
  morning: { type: [VIRD_TEMPLATE_ITEM_SCHEMA], default: undefined },
  prayer: { type: [VIRD_TEMPLATE_ITEM_SCHEMA], default: undefined },
  evening: { type: [VIRD_TEMPLATE_ITEM_SCHEMA], default: undefined },
  night: { type: [VIRD_TEMPLATE_ITEM_SCHEMA], default: undefined },
  free: { type: [VIRD_TEMPLATE_ITEM_SCHEMA], default: undefined },
};

const VIRD_TEMPLATE_PHASE_SCHEMA = {
  _id: false,
  fromDay: { type: Number, required: true, min: 1 },
  toDay: { type: Number, default: null },
  note: { type: String, trim: true },
  slots: VIRD_TEMPLATE_PHASE_SLOTS_SCHEMA,
};

@Schema({ collection: 'vird_templates', timestamps: true, versionKey: false })
export class VirdTemplate {
  // Seed'in upsert anahtarı — seed script'i (sonraki görev) bu alan üzerinden
  // çalışır.
  @Prop({ type: String, required: true, trim: true })
  key!: string;

  @Prop({ type: String, enum: ['routine', 'journey'], required: true })
  kind!: VirdProgramKind;

  @Prop(LOCALIZED_TEXT_SCHEMA_OPTIONAL)
  title?: LocalizedText;

  @Prop(LOCALIZED_TEXT_SCHEMA_OPTIONAL)
  description?: LocalizedText;

  @Prop({ type: Boolean, default: false })
  isPremium!: boolean;

  @Prop({ type: Number, min: 1 })
  dayCount?: number;

  // Belirli bir tarihe (özel gün) sabitlenmiş şablonlar için (örn. Kadir
  // Gecesi) — 'YYYY-MM-DD'.
  @Prop({ type: String })
  anchorDate?: string;

  @Prop({ type: [VIRD_TEMPLATE_PHASE_SCHEMA], default: [] })
  phases!: VirdTemplatePhase[];

  // special_days.eventKey ile eşleşir (özel gün odaklı şablonlar için) — bu
  // göreve dahil değil, sonraki şablon servisi görevi kullanır.
  @Prop({ type: String, trim: true })
  sourceEventKey?: string;

  @Prop({ type: Boolean, default: true })
  isActive!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const VirdTemplateSchema = SchemaFactory.createForClass(VirdTemplate);

VirdTemplateSchema.index({ key: 1 }, { unique: true });
VirdTemplateSchema.index({ isActive: 1, isPremium: 1 });
