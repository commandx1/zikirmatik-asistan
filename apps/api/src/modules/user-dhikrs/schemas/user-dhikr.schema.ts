import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type UserDhikrDocument = HydratedDocument<UserDhikr>;

@Schema({ collection: 'user_dhikrs', timestamps: true, versionKey: false })
export class UserDhikr {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, trim: true })
  clientId!: string;

  @Prop({ type: String, required: true, trim: true })
  name!: string;

  @Prop({ type: String, trim: true })
  transliteration?: string;

  @Prop({ type: String, trim: true })
  arabic?: string;

  @Prop({ type: String, trim: true })
  meaning?: string;

  @Prop({ type: Number, required: true, min: 0, default: 0 })
  target!: number;

  @Prop({ type: Boolean, default: false })
  isFavorite!: boolean;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const UserDhikrSchema = SchemaFactory.createForClass(UserDhikr);

UserDhikrSchema.index({ userId: 1, clientId: 1 }, { unique: true });
UserDhikrSchema.index({ userId: 1, updatedAt: -1 });
