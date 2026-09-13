import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import type { LocalizedText } from '../../../common/types/localized-text';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';
import type {
  VirdProgramKind,
  VirdProgramSource,
  VirdProgramStatus,
} from '../vird.types';

export type VirdProgramDocument = HydratedDocument<VirdProgram>;

export type VirdProgramItem = {
  dhikrId?: Types.ObjectId;
  customDhikrId?: string;
  target: number;
};

export type VirdProgramPhaseSlots = {
  morning?: VirdProgramItem[];
  prayer?: VirdProgramItem[];
  evening?: VirdProgramItem[];
  night?: VirdProgramItem[];
  free?: VirdProgramItem[];
};

export type VirdProgramPhase = {
  fromDay: number;
  toDay: number | null;
  note?: string;
  slots: VirdProgramPhaseSlots;
};

export type VirdProgramReminders = {
  enabled: boolean;
  slots: {
    morning: boolean;
    prayer: boolean;
    evening: boolean;
    night: boolean;
  };
};

export type VirdProgramAiMeta = {
  flowId: string;
  intent: string;
  durationDays: number;
  summary: string;
};

// { tr, en } — zikir kataloğundaki desenin aynısı (bkz. dhikr.schema.ts).
const LOCALIZED_TEXT_SCHEMA = {
  type: {
    tr: { type: String, required: true, trim: true },
    en: { type: String, required: true, trim: true },
  },
  required: true,
};

// Bir dilim item'ı: ya katalog zikri (dhikrId) ya da kullanıcının serbest
// metin zikri (customDhikrId) — dhikr-logs ile aynı ikili örüntü.
const VIRD_ITEM_SCHEMA = {
  _id: false,
  dhikrId: { type: Types.ObjectId, ref: Dhikr.name },
  customDhikrId: { type: String, trim: true },
  target: { type: Number, required: true, min: 1 },
};

const VIRD_PHASE_SLOTS_SCHEMA = {
  morning: { type: [VIRD_ITEM_SCHEMA], default: undefined },
  prayer: { type: [VIRD_ITEM_SCHEMA], default: undefined },
  evening: { type: [VIRD_ITEM_SCHEMA], default: undefined },
  night: { type: [VIRD_ITEM_SCHEMA], default: undefined },
  free: { type: [VIRD_ITEM_SCHEMA], default: undefined },
};

// Rutin programlar tek faz (fromDay:1, toDay:null) kullanır; yolculuk
// programları gün başına faz tanımlar. toDay:null = bir sonraki faz
// başlayana dek (ya da sonsuza dek, son fazda) sürer.
const VIRD_PHASE_SCHEMA = {
  _id: false,
  fromDay: { type: Number, required: true, min: 1 },
  toDay: { type: Number, default: null },
  note: { type: String, trim: true },
  slots: VIRD_PHASE_SLOTS_SCHEMA,
};

@Schema({ collection: 'vird_programs', timestamps: true, versionKey: false })
export class VirdProgram {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  // İstemcinin ürettiği idempotency anahtarı (offline oluşturma / retry).
  @Prop({ type: String, trim: true })
  clientId?: string;

  @Prop({ type: String, enum: ['routine', 'journey'], required: true })
  kind!: VirdProgramKind;

  @Prop({
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'archived'],
    default: 'draft',
  })
  status!: VirdProgramStatus;

  @Prop({
    type: String,
    enum: ['manual', 'template', 'ai'],
    default: 'manual',
  })
  source!: VirdProgramSource;

  // source 'template'|'ai' olduğunda ilgili kaynağı işaretler. Şablon
  // çözümlemesi (phases'in şablondan doldurulması) sonraki görevin kapsamıdır.
  @Prop({ type: String, trim: true })
  templateKey?: string;

  @Prop(LOCALIZED_TEXT_SCHEMA)
  title!: LocalizedText;

  @Prop({ type: String, required: true })
  startDate!: string;

  // journey programları için sunucu tarafında phases'ten türetilir; routine
  // programlarında tanımsız kalır (süresiz).
  @Prop({ type: String })
  endDate?: string;

  @Prop({ type: Number, min: 1 })
  dayCount?: number;

  @Prop({ type: [VIRD_PHASE_SCHEMA], required: true, default: [] })
  phases!: VirdProgramPhase[];

  @Prop({ type: [Number], default: [1, 2, 3, 4, 5] })
  prayerSelection!: number[];

  @Prop(
    raw({
      enabled: { type: Boolean, default: false },
      slots: {
        morning: { type: Boolean, default: false },
        prayer: { type: Boolean, default: false },
        evening: { type: Boolean, default: false },
        night: { type: Boolean, default: false },
      },
    }),
  )
  reminders!: VirdProgramReminders;

  // source: 'ai' akışının (sonraki görev) doldurduğu meta veri. flowId AI
  // rehberdeki flowId ile aynı idempotency amacını taşır.
  @Prop(
    raw({
      flowId: { type: String },
      intent: { type: String },
      durationDays: { type: Number },
      summary: { type: String },
    }),
  )
  ai?: VirdProgramAiMeta;

  // Yalnızca status:'draft' iken set edilir (kullanıcı taslağı bırakıp
  // gidiyorsa otomatik temizlik). Aktifleştirme/duraklatma/tamamlama/arşivleme
  // sırasında $unset edilir — TTL index bu yüzden expireAfterSeconds:0
  // (alanın kendi değeri = silinme anı).
  @Prop({ type: Date })
  expiresAt?: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const VirdProgramSchema = SchemaFactory.createForClass(VirdProgram);

// İstemci idempotency anahtarı: yalnız clientId gerçekten bir string olduğunda
// tekil. `sparse` YETERSİZDİ — istemci/DTO `clientId: null` gönderdiğinde
// sparse index null'ı indeksler ve ikinci şablon/AI programı E11000 ile
// çakışırdı (canlı testte görüldü). Eski `userId_1_clientId_1` index'i
// Atlas'ta bir kez düşürülmeli (bkz. docs/vird-programi.md).
VirdProgramSchema.index(
  { userId: 1, clientId: 1 },
  {
    name: 'uniq_user_clientId',
    unique: true,
    partialFilterExpression: { clientId: { $type: 'string' } },
  },
);
VirdProgramSchema.index({ userId: 1, status: 1 });
VirdProgramSchema.index({ userId: 1, updatedAt: -1 });
VirdProgramSchema.index({ 'ai.flowId': 1 }, { unique: true, sparse: true });
VirdProgramSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
