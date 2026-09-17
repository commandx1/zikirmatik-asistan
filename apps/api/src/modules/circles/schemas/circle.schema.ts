import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';

export type CircleDocument = HydratedDocument<Circle>;

export type CircleStatus = 'active' | 'completed' | 'closed';

/**
 * Zikir Halkası: tek bir zikir etrafında ortak bir hedefe sayan üye grubu.
 * Paylaşılan durum (memberIds, totalCount, status) üzerindeki HER yazım tek
 * bir atomik Mongo işlemi + koruyucu filtre ile yapılır (bkz.
 * circles.service.ts) — bu belge üzerinde oku-değiştir-yaz yoktur.
 */
@Schema({ collection: 'circles', timestamps: true, versionKey: false })
export class Circle {
  @Prop({ type: String, required: true, trim: true, maxlength: 60 })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: Dhikr.name, required: true })
  dhikrId!: Types.ObjectId;

  @Prop({ type: Number, required: true, min: 1 })
  goalCount!: number;

  // YYYY-MM-DD; yoksa halka süresizdir.
  @Prop({ type: String })
  endDate?: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true })
  creatorId!: Types.ObjectId;

  @Prop({ type: String, required: true, uppercase: true, unique: true })
  code!: string;

  @Prop({ type: [Types.ObjectId], ref: User.name, default: [] })
  memberIds!: Types.ObjectId[];

  // Log toplamının önbelleği — MONOTON: yalnız artan yönde güncellenir
  // (bkz. applyProgress). Gerçeğin kaynağı her zaman dhikr_logs'tur.
  @Prop({ type: Number, default: 0 })
  totalCount!: number;

  @Prop({
    type: String,
    enum: ['active', 'completed', 'closed'],
    default: 'active',
  })
  status!: CircleStatus;

  // Tamamlanma push'unun en fazla bir kez gitmesini sağlayan koruyucu alan
  // (findOneAndUpdate filtresinde completedAt: null olarak kullanılır).
  @Prop({ type: Date, default: null })
  completedAt?: Date | null;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const CircleSchema = SchemaFactory.createForClass(Circle);

// "Halkalarım" listesi ve üyelik kontrolü.
CircleSchema.index({ memberIds: 1, status: 1 });
// Kurucu başına aktif halka sayımı (CIRCLE_MAX_ACTIVE_PER_CREATOR).
CircleSchema.index({ creatorId: 1, status: 1 });
