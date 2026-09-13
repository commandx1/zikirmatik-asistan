import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type StreakDocument = HydratedDocument<Streak>;

@Schema({
  collection: 'streaks',
  timestamps: { createdAt: false, updatedAt: true },
  versionKey: false,
})
export class Streak {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, unique: true })
  userId!: Types.ObjectId;

  @Prop({ type: Number, required: true, default: 0 })
  currentStreak!: number;

  @Prop({ type: Number, required: true, default: 0 })
  longestStreak!: number;

  @Prop({ type: String })
  lastActiveDate?: string;

  @Prop({ type: Number, required: true, default: 0 })
  totalDaysActive!: number;

  // Vird Programı serisi — vird_day_progress.isDayComplete günlerinden
  // türetilir (bkz. StreaksService.recalculateVirdForUser). Mevcut
  // currentStreak/longestStreak (genel zikir serisi) ile bağımsızdır.
  @Prop({ type: Number, required: true, default: 0 })
  virdCurrentStreak!: number;

  @Prop({ type: Number, required: true, default: 0 })
  virdLongestStreak!: number;

  @Prop({ type: String })
  virdLastCompleteDate?: string;

  readonly updatedAt!: Date;
}

export const StreakSchema = SchemaFactory.createForClass(Streak);
