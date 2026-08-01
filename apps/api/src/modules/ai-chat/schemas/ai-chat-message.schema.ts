import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';
import { AiConversation } from './ai-conversation.schema';

export type AiChatMessageDocument = HydratedDocument<AiChatMessage>;

export const AI_CHAT_MESSAGE_ROLES = ['user', 'assistant'] as const;
export type AiChatMessageRole = (typeof AI_CHAT_MESSAGE_ROLES)[number];

// 'kaynak' modunda cevabın dayandığı kitap pasajları — sohbette
// "kaynak: <kitap adı>, s.X-Y" şeklinde gösterim için.
export class AiSourceCitation {
  @Prop({ type: String, required: true })
  sourceId!: string;

  @Prop({ type: String, required: true })
  sourceTitle!: string;

  @Prop({ type: Number, required: true })
  pageStart!: number;

  @Prop({ type: Number, required: true })
  pageEnd!: number;
}

@Schema({
  collection: 'ai_messages',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AiChatMessage {
  @Prop({
    type: Types.ObjectId,
    ref: AiConversation.name,
    required: true,
    index: true,
  })
  conversationId!: Types.ObjectId;

  // Sahiplik doğrulamasını conversationId üzerinden ekstra join yapmadan
  // hızlandırmak için taşınır; asıl kaynak-of-truth AiConversation.userId'dir.
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, enum: AI_CHAT_MESSAGE_ROLES, required: true })
  role!: AiChatMessageRole;

  @Prop({ type: String, required: true, trim: true })
  content!: string;

  @Prop({ type: [Types.ObjectId], ref: Dhikr.name })
  recommendedDhikrIds?: Types.ObjectId[];

  // Yalnızca assistant mesajlarında dolu: 'openai' | 'fallback'.
  @Prop({ type: String })
  usedModel?: string;

  // Yalnızca 'kaynak' modunda dolu: cevabın dayandığı kaynak pasajlar.
  @Prop({ type: [Object], default: undefined })
  sourceCitations?: AiSourceCitation[];

  readonly createdAt!: Date;
}

export const AiChatMessageSchema = SchemaFactory.createForClass(AiChatMessage);

AiChatMessageSchema.index({ conversationId: 1, createdAt: 1 });
