import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';

export type AiConversationDocument = HydratedDocument<AiConversation>;

export const AI_CONVERSATION_STATUSES = ['active', 'archived'] as const;
export type AiConversationStatus = (typeof AI_CONVERSATION_STATUSES)[number];

@Schema({
  collection: 'ai_conversations',
  timestamps: true,
  versionKey: false,
})
export class AiConversation {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  // İlk kullanıcı mesajından otomatik türetilir, ~60 karaktere kısaltılır.
  @Prop({ type: String, required: true, trim: true, maxlength: 80 })
  title!: string;

  @Prop({
    type: String,
    enum: AI_CONVERSATION_STATUSES,
    default: 'active',
    required: true,
  })
  status!: AiConversationStatus;

  // Sohbet listesini "son mesaja göre" sıralamak için ayrı tutulur —
  // messages koleksiyonuna join/lookup yapmadan sıralanabilsin diye.
  @Prop({ type: Date, required: true, index: true })
  lastMessageAt!: Date;

  // Sohbetin başlatıldığı dil ('tr' | 'en'); assistant yanıtları bu dilde üretilir.
  @Prop({ type: String, default: 'tr' })
  locale!: string;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const AiConversationSchema =
  SchemaFactory.createForClass(AiConversation);

AiConversationSchema.index({ userId: 1, lastMessageAt: -1 });
