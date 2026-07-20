import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

// Outcome of a completed dispatch, written after the send finishes. A claim
// row without a result means the send is still in flight (or crashed midway).
@Schema({ _id: false, versionKey: false })
export class NotificationDispatchResult {
  @Prop({ type: Number, required: true })
  targetCount!: number;

  @Prop({ type: Number, required: true })
  sentCount!: number;

  @Prop({ type: Number, required: true })
  ticketErrorCount!: number;

  @Prop({ type: Date, required: true })
  finishedAt!: Date;
}

const NotificationDispatchResultSchema = SchemaFactory.createForClass(
  NotificationDispatchResult,
);

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

  @Prop({ type: NotificationDispatchResultSchema, required: false })
  result?: NotificationDispatchResult;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const NotificationDispatchSchema =
  SchemaFactory.createForClass(NotificationDispatch);
