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

  readonly updatedAt!: Date;
}

export const StreakSchema = SchemaFactory.createForClass(Streak);
