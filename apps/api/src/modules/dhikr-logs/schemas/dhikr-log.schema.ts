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
    enum: ['manual', 'ai', 'special-day', 'notification'],
    default: 'manual',
  })
  source!: 'manual' | 'ai' | 'special-day' | 'notification';

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
