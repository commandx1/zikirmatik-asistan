import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { VirdProgram } from './vird-program.schema';

export type VirdDayProgressDocument = HydratedDocument<VirdDayProgress>;

/**
 * Bir kullanıcının bir programdaki bir günkü türetilmiş ilerleme özeti.
 * dhikr_logs'tan VirdProgressService.applyLogWrite tarafından hesaplanır —
 * bu koleksiyona doğrudan yazım yapılmaz (salt türetilmiş/cache belge).
 */
@Schema({
  collection: 'vird_day_progress',
  timestamps: { createdAt: true, updatedAt: true },
  versionKey: false,
})
export class VirdDayProgress {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({
    type: Types.ObjectId,
    ref: VirdProgram.name,
    required: true,
    index: true,
  })
  programId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  date!: string;

  @Prop({ type: Number, required: true })
  dayIndex!: number;

  // O gün tamamlanmış (count >= target) item'ların itemKey listesi.
  @Prop({ type: [String], default: [] })
  completedItemKeys!: string[];

  // O gün tüm item'ları tamamlanmış dilimlerin (VirdSlotKey) listesi.
  @Prop({ type: [String], default: [] })
  completedSlots!: string[];

  @Prop({ type: Boolean, default: false, index: true })
  isDayComplete!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const VirdDayProgressSchema =
  SchemaFactory.createForClass(VirdDayProgress);

VirdDayProgressSchema.index(
  { userId: 1, programId: 1, date: 1 },
  { unique: true },
);
VirdDayProgressSchema.index({ userId: 1, isDayComplete: 1, date: 1 });
// M0'da belge birikimini sınırlamak için 400 gün sonra otomatik temizlik —
// vird serisi (streak) en fazla ~100 günlük rozetleri hedefler, bu pencere
// yeterince geniş bir tampon bırakır.
VirdDayProgressSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 400 * 24 * 60 * 60 },
);
