import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type NotificationDispatchDocument =
  HydratedDocument<NotificationDispatch>;

// One row per sent campaign. The unique key makes campaign sends idempotent:
// a cron re-run or server restart hits the duplicate-key error and skips,
// so the same campaign is never dispatched twice.
@Schema({
  collection: 'notification_dispatches',
  timestamps: true,
  versionKey: false,
})
export class NotificationDispatch {
  // e.g. "special-day:2026-01-15" (the eve date) or "friday:2026-01-16".
  @Prop({ type: String, required: true, unique: true })
  key!: string;

  @Prop({ type: String, enum: ['special-day', 'friday'], required: true })
  type!: 'special-day' | 'friday';

  @Prop({ type: Date, required: true })
  sentAt!: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const NotificationDispatchSchema =
  SchemaFactory.createForClass(NotificationDispatch);
