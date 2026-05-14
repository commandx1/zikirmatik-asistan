import { Prop, Schema, SchemaFactory, raw } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';
import { Dhikr } from '../../dhikrs/schemas/dhikr.schema';
import { User } from '../../users/schemas/user.schema';

export type AiRecommendationDocument = HydratedDocument<AiRecommendation>;

@Schema({
  collection: 'ai_recommendations',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AiRecommendation {
  @Prop({ type: Types.ObjectId, ref: User.name, required: true, index: true })
  userId!: Types.ObjectId;

  @Prop({ type: String, required: true })
  mood!: string;

  @Prop({ type: String })
  freeText?: string;

  @Prop(
    raw({
      hour: { type: Number, required: true },
      dayOfWeek: { type: Number, required: true },
      isSpecialDay: { type: Boolean, required: true },
      specialDayName: { type: String },
    }),
  )
  timeContext!: {
    hour: number;
    dayOfWeek: number;
    isSpecialDay: boolean;
    specialDayName?: string;
  };

  @Prop({ type: [Types.ObjectId], ref: Dhikr.name, required: true })
  recommendedDhikrIds!: Types.ObjectId[];

  @Prop({ type: Types.ObjectId, ref: Dhikr.name })
  selectedDhikrId?: Types.ObjectId;

  readonly createdAt!: Date;
}

export const AiRecommendationSchema =
  SchemaFactory.createForClass(AiRecommendation);

AiRecommendationSchema.index({ userId: 1, createdAt: -1 });
AiRecommendationSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7_776_000 },
);
