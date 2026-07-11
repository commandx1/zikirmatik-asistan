import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type DeviceDocument = HydratedDocument<Device>;

export type DevicePrefs = {
  specialDays: boolean;
  friday: boolean;
  streak: boolean;
  badges: boolean;
};

@Schema({ collection: 'devices', timestamps: true, versionKey: false })
export class Device {
  // Stable app-generated UUID (persisted client-side); survives login/logout
  // so guest devices keep receiving pushes across auth state changes.
  @Prop({ type: String, required: true, unique: true, trim: true })
  deviceId!: string;

  @Prop({ type: String, trim: true })
  expoPushToken?: string;

  // Nullable: unset on logout instead of deleting the device, since guests
  // must keep receiving pushes even without an associated account.
  @Prop({ type: Types.ObjectId, ref: 'User', default: null, index: true })
  userId!: Types.ObjectId | null;

  @Prop({ type: String, enum: ['ios', 'android'], required: true })
  platform!: 'ios' | 'android';

  @Prop(
    raw({
      specialDays: { type: Boolean, default: true },
      friday: { type: Boolean, default: true },
      streak: { type: Boolean, default: true },
      badges: { type: Boolean, default: true },
    }),
  )
  prefs!: DevicePrefs;

  // Flipped to false once Expo reports DeviceNotRegistered for this token,
  // so the sender stops targeting it without losing the device history.
  @Prop({ type: Boolean, default: true, index: true })
  isActive!: boolean;

  @Prop({ type: Date, default: () => new Date() })
  lastSeenAt!: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const DeviceSchema = SchemaFactory.createForClass(Device);
