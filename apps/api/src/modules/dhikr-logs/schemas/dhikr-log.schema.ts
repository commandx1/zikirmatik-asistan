import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';
import { VirdProgram } from '../../vird/schemas/vird-program.schema';
import type { VirdSlotKey } from '../../vird/vird.types';

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

  @Prop({ type: Types.ObjectId, index: true })
  aiRecommendationId?: Types.ObjectId;

  @Prop({ type: String, trim: true })
  aiPrompt?: string;

  @Prop({ type: String, trim: true })
  aiAssistantNote?: string;

  @Prop({ type: Number, required: true, min: 0 })
  count!: number;

  @Prop({ type: Number, required: true, min: 0 })
  targetCount!: number;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  sessionDuration!: number;

  @Prop({
    type: String,
    enum: ['manual', 'ai', 'special-day', 'notification', 'circle'],
    default: 'manual',
  })
  source!: 'manual' | 'ai' | 'special-day' | 'notification' | 'circle';

  @Prop({ type: Boolean, default: false })
  isCompleted!: boolean;

  @Prop({ type: Boolean, default: false })
  isFavorite!: boolean;

  @Prop({ type: String, required: true })
  date!: string;

  // --- Vird Programı alanları (opsiyonel) ---
  // Bir log, bir vird programının bir dilimine bağlıysa doldurulur. Aynı
  // zikrin farklı dilimlerde (sabah/akşam) veya prayer diliminde farklı
  // vakitlerde (1..5) çakışmadan ayrı belge olarak tutulmasını sağlar — bkz.
  // dhikr-logs.service.ts buildLogFilter.
  @Prop({ type: Types.ObjectId, ref: VirdProgram.name, index: true })
  virdProgramId?: Types.ObjectId;

  @Prop({
    type: String,
    enum: ['morning', 'prayer', 'evening', 'night', 'free'],
  })
  virdSlot?: VirdSlotKey;

  @Prop({ type: Number, min: 1 })
  virdDayIndex?: number;

  // Yalnız virdSlot:'prayer' için anlamlıdır (1..5 = sabah/öğle/ikindi/akşam/yatsı).
  @Prop({ type: Number, min: 1, max: 5 })
  virdPrayerIndex?: number;

  // --- Zikir Halkası alanı (opsiyonel) ---
  // Bir log bir halkaya sayılıyorsa doldurulur. Halka logları sade/vird
  // loglarından AYRI belgelerdir (bkz. buildLogFilter). ref string olarak
  // verilir: schema dosyaları arasında döngü oluşmasın.
  @Prop({ type: Types.ObjectId, ref: 'Circle' })
  circleId?: Types.ObjectId;

  readonly createdAt!: Date;
}

export const DhikrLogSchema = SchemaFactory.createForClass(DhikrLog);

DhikrLogSchema.index({ userId: 1, date: -1 });
DhikrLogSchema.index({ userId: 1, dhikrId: 1, date: 1 });
DhikrLogSchema.index({ userId: 1, customDhikrId: 1, date: 1 });
// Vird'e bağlı logların hızlı sorgulanması için (VirdProgressService.applyLogWrite
// ve GET today) — partial: yalnız virdProgramId olan belgeleri kapsar, M0'da
// gereksiz index şişkinliği yaratmaz.
DhikrLogSchema.index(
  { userId: 1, virdProgramId: 1, date: 1 },
  { partialFilterExpression: { virdProgramId: { $exists: true } } },
);

// Halka toplamları ve "bugünkü katkım" sorguları için — partial: yalnız
// circleId taşıyan belgeleri kapsar (vird index'iyle aynı desen).
DhikrLogSchema.index(
  { circleId: 1, userId: 1, date: 1 },
  { partialFilterExpression: { circleId: { $exists: true } } },
);

/**
 * LOG ANAHTARI — TEKİLLİK. Alan kümesi DhikrLogsService.buildLogFilter ile
 * BİREBİR aynıdır; ikisi birlikte güncellenmelidir.
 *
 * Neden zorunlu: MongoDB'de `upsert` yalnız sorgu yüklemini karşılayan bir
 * UNIQUE index varsa atomiktir. Index yokken aynı anahtara giden iki
 * eşzamanlı upsert de "bulamadım" deyip İKİSİ DE insert eder — aynı gün aynı
 * zikir için iki belge oluşur, halka toplamı (CirclesService.applyProgress
 * tüm belgeleri toplar) şişer ve $max'ın "sayı düşmez" garantisi belge
 * sınırında delinir. Bu index'le yarışı kaybeden insert E11000 alır ve
 * servis aynı filtreyle bir kez daha deneyip mevcut belgeyi günceller.
 *
 * Neden partial/sparse DEĞİL: Mongo unique index'te EKSİK alan `null`
 * sayılır. buildLogFilter'ın `$exists:false` kullandığı alanlar (sade logda
 * virdProgramId/circleId) belgede hiç yoktur, vird logunda virdPrayerIndex
 * açıkça null'dır — hepsi index'te null'a düşer. Böylece sade / vird / halka
 * anahtarları tek bir index içinde birbirinden ayrık kalır ve tek index
 * üçünü birden korur.
 */
DhikrLogSchema.index(
  {
    userId: 1,
    date: 1,
    dhikrId: 1,
    customDhikrId: 1,
    virdProgramId: 1,
    virdSlot: 1,
    virdPrayerIndex: 1,
    circleId: 1,
  },
  { unique: true, name: 'uniq_log_key' },
);
