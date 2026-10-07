import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type RefreshTokenDocument = HydratedDocument<RefreshToken>;

/**
 * A-20: sunucu tarafı refresh token kaydı. Token'ın kendisi değil sha256'sı
 * tutulur. Her girişte yeni aile (familyId); her refresh aynı ailede yeni token
 * üretir ve kullanılanı işaretler. Kullanılmış token'ın çocuğu da kullanılmışsa
 * → çalıntı varsayılır, aile iptal edilir.
 */
@Schema({
  collection: 'auth_refresh_tokens',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class RefreshToken {
  @Prop({ type: String, required: true, unique: true })
  tokenHash!: string;

  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true, index: true })
  familyId!: string;

  // TTL: süresi geçen kayıt silinir (token imzası zaten süre kontrolü yapar).
  @Prop({ type: Date, required: true })
  expiresAt!: Date;

  @Prop({ type: Date, default: null })
  usedAt?: Date | null;

  @Prop({ type: Date, default: null })
  revokedAt?: Date | null;

  // Bu token kullanılınca verilen çocuk token'ın hash'i.
  @Prop({ type: String })
  replacedByHash?: string;

  readonly createdAt!: Date;
}

export const RefreshTokenSchema = SchemaFactory.createForClass(RefreshToken);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
