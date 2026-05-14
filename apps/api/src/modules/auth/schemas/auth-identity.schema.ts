import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AuthIdentityDocument = HydratedDocument<AuthIdentity>;

@Schema({
  collection: 'auth_identities',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AuthIdentity {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: ['apple', 'google'], required: true })
  provider!: 'apple' | 'google';

  @Prop({ type: String, required: true })
  providerUserId!: string;

  @Prop({ type: String, lowercase: true, trim: true })
  email?: string;

  @Prop({ type: Date, default: () => new Date() })
  verifiedAt!: Date;

  readonly createdAt!: Date;
}

export const AuthIdentitySchema = SchemaFactory.createForClass(AuthIdentity);

AuthIdentitySchema.index({ provider: 1, providerUserId: 1 }, { unique: true });
AuthIdentitySchema.index({ userId: 1, provider: 1 }, { unique: true });
