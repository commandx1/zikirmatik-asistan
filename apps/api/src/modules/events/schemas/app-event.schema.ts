import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, SchemaTypes, Types } from 'mongoose';

export type AppEventDocument = HydratedDocument<AppEvent>;

export type AppEventPropValue = string | number | boolean;

// Ürün-olayı (analytics) belgesi. Kasıtlı olarak küçük tutulur: M0 (ücretsiz,
// 512MB) cluster kotası bu koleksiyonun sınırsız büyümesine izin vermez —
// bkz. aşağıdaki TTL index.
@Schema({
  collection: 'app_events',
  timestamps: { createdAt: true, updatedAt: false },
  versionKey: false,
})
export class AppEvent {
  // Kalıcı, cihaz bazlı UUID. push-device-registration ile aynı kaynaktan
  // gelir; misafir kullanıcılar da bu alan üzerinden gruplanır.
  @Prop({ type: String, required: true, index: true })
  deviceId!: string;

  // Yalnızca istek geçerli bir bearer token taşıyorsa yazılır (bkz.
  // OptionalJwtAuthGuard). Misafir olaylarında bulunmaz.
  @Prop({ type: Types.ObjectId, ref: 'User', index: true })
  userId?: Types.ObjectId;

  // Serbest metin değil, sabit bir sözlük gibi davranmalı: ^[a-z_]{2,48}$
  // (bkz. TrackEventItemDto.name).
  @Prop({ type: String, required: true, index: true })
  name!: string;

  // Serbest anahtar/değer eki. Belge boyutunu ve kardinaliteyi sınırlamak
  // için EventsService, yazmadan önce en fazla ~20 anahtar ve 200 karaktere
  // kadar string değer kabul eder; bunu ihlal eden olaylar tek tek atlanır.
  @Prop({ type: SchemaTypes.Mixed })
  props?: Record<string, AppEventPropValue>;

  // İstemcinin olayı ürettiği an (cihaz saati). `createdAt` ise sunucunun
  // yazdığı an ve TTL bunun üzerinden çalışır.
  @Prop({ type: Date, required: true })
  clientTs!: Date;

  readonly createdAt!: Date;
}

export const AppEventSchema = SchemaFactory.createForClass(AppEvent);

// M0 (ücretsiz, 512MB) cluster kotası nedeniyle zorunlu: olaylar 180 gün
// sonra otomatik silinir, koleksiyon süresiz büyüyemez.
AppEventSchema.index({ createdAt: 1 }, { expireAfterSeconds: 15_552_000 });
AppEventSchema.index({ deviceId: 1, createdAt: -1 });
AppEventSchema.index({ userId: 1, createdAt: -1 });
AppEventSchema.index({ name: 1, createdAt: -1 });
