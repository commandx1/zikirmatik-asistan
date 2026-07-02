import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type UserDocument = HydratedDocument<User>;

@Schema({ collection: 'users', timestamps: true, versionKey: false })
export class User {
  @Prop({
    type: String,
    unique: true,
    sparse: true,
    lowercase: true,
    trim: true,
  })
  email?: string;

  @Prop({ type: String, trim: true, default: 'Misafir Kullanıcı' })
  displayName!: string;

  @Prop({ type: String, trim: true })
  profileImageUrl?: string;

  @Prop({ type: String, select: false })
  password?: string;

  @Prop({ type: String, enum: ['google', 'apple', 'email'], default: 'email' })
  authProvider!: 'google' | 'apple' | 'email';

  @Prop({ type: String, default: '' })
  city!: string;

  @Prop({ type: [String], default: [] })
  preferredCategories!: string[];

  @Prop({ type: String, default: 'gece-koyu' })
  theme!: string;

  @Prop({
    type: String,
    enum: [
      'default',
      'merriweather',
      'intel-one-mono',
      'finlandica-headline',
      'indie-flower',
    ],
    default: 'default',
  })
  fontFamily!:
    | 'default'
    | 'merriweather'
    | 'intel-one-mono'
    | 'finlandica-headline'
    | 'indie-flower';

  @Prop({ type: String, enum: ['small', 'medium', 'large'], default: 'medium' })
  fontSize!: 'small' | 'medium' | 'large';

  @Prop({ type: Boolean, default: true })
  hapticsEnabled!: boolean;

  @Prop(
    raw({
      dailyReminder: { type: Boolean, default: false },
      reminderTime: { type: String, default: '08:00' },
      kandilNotifications: { type: Boolean, default: true },
      azanNotifications: { type: Boolean, default: false },
      fridayReminder: { type: Boolean, default: true },
    }),
  )
  notifSettings!: {
    dailyReminder: boolean;
    reminderTime: string;
    kandilNotifications: boolean;
    azanNotifications: boolean;
    fridayReminder: boolean;
  };

  @Prop({ type: Boolean, default: false })
  isPremium!: boolean;

  @Prop(
    raw({
      purpose: { type: String },
      city: { type: String },
      completedAt: { type: Date },
    }),
  )
  onboarding?: {
    purpose?: string;
    city?: string;
    completedAt?: Date;
  };

  @Prop({ type: Date, default: () => new Date() })
  lastSeenAt!: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
