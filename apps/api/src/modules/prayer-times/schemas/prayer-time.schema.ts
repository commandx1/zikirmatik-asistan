import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PrayerTimeDocument = HydratedDocument<PrayerTime>;

type PrayerTimeEntry = {
  vakit: string;
  saat: string;
};

@Schema({ collection: 'prayer_times', timestamps: true, versionKey: false })
export class PrayerTime {
  @Prop({
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    index: true,
  })
  city!: string;

  @Prop({
    type: [
      {
        vakit: { type: String, required: true, trim: true },
        saat: { type: String, required: true, trim: true },
      },
    ],
    default: [],
  })
  times!: PrayerTimeEntry[];

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const PrayerTimeSchema = SchemaFactory.createForClass(PrayerTime);
PrayerTimeSchema.index({ city: 1 }, { unique: true });
