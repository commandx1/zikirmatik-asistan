import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type PushDispatchDocument = HydratedDocument<PushDispatch>;

const THIRTY_DAYS_IN_SECONDS = 60 * 60 * 24 * 30;

// Cihaz+gün başına en fazla bir sunucu tetikli push'u garanti eden dedupe /
// rezervasyon kaydı. Gönderimden ÖNCE insert edilir (bkz.
// push-campaigns.service.ts `reserve`); E11000 çakışması "bugün zaten push
// aldı" anlamına gelir ve gönderim hiç denenmez.
@Schema({ collection: 'push_dispatches', timestamps: false, versionKey: false })
export class PushDispatch {
  @Prop({ type: String, required: true, trim: true })
  campaignKey!: string;

  @Prop({ type: String, required: true, trim: true })
  deviceId!: string;

  // İstanbul takvim günü, 'YYYY-MM-DD' (bkz. common/utils/date-keys.ts).
  @Prop({ type: String, required: true })
  dayKey!: string;

  @Prop({ type: Date, required: true, default: () => new Date() })
  sentAt!: Date;

  // Rezervasyon sonrası gerçek gönderim throw ederse meta.error yazılır;
  // rezervasyon kasıtlı olarak silinmez (retry fırtınası istenmiyor).
  @Prop({ type: Object })
  meta?: Record<string, unknown>;
}

export const PushDispatchSchema = SchemaFactory.createForClass(PushDispatch);

// Cihaz başına günde en fazla 1 sunucu push'u — kampanyadan BAĞIMSIZ birincil
// kısıt. Tek başına yeterlidir (aşağıdaki bileşik index onu daraltır, gevşetmez).
PushDispatchSchema.index({ deviceId: 1, dayKey: 1 }, { unique: true });

// Kampanya bazlı sorgular/denetim için (ör. "bu cihaz bugün winback aldı mı").
// Yukarıdaki {deviceId,dayKey} unique index zaten günde tek kayda izin
// verdiğinden bu index'in tekilliği pratikte hep sağlanır; yine de açıkça
// tanımlanır (spesifikasyon gereği) ve kampanya bazlı okumaları hızlandırır.
PushDispatchSchema.index(
  { campaignKey: 1, deviceId: 1, dayKey: 1 },
  { unique: true },
);

// 30 gün sonra otomatik temizlik (TTL index — MongoDB arka planda siler).
PushDispatchSchema.index(
  { sentAt: 1 },
  { expireAfterSeconds: THIRTY_DAYS_IN_SECONDS },
);
