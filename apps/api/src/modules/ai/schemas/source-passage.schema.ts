import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument } from 'mongoose';

export type SourcePassageDocument = HydratedDocument<SourcePassage>;

// Kitap/kaynak pasajı RAG koleksiyonu. Seed script'i (seed-source-passages.mjs)
// docs/kaynaklar/<source_id>.passages.jsonl içindeki review==="approved"
// kayıtları buraya upsert eder. Şu an sohbet agent'ına bağlanmamıştır.
@Schema({ collection: 'source_passages', timestamps: true, versionKey: false })
export class SourcePassage {
  // Seed'deki stabil tanımlayıcı (sourceId:chunkIndex hash'i). Upsert bu
  // alan üzerinden yapılır.
  @Prop({ type: String, required: true, trim: true })
  passageId!: string;

  @Prop({ type: String, required: true, trim: true })
  sourceId!: string;

  @Prop({ type: String, required: true, trim: true })
  sourceTitle!: string;

  @Prop({ type: String, required: true, trim: true })
  type!: string;

  @Prop({ type: String, trim: true })
  sectionHeading?: string;

  @Prop({ type: Number, required: true })
  pageStart!: number;

  @Prop({ type: Number, required: true })
  pageEnd!: number;

  @Prop({ type: Number, required: true })
  chunkIndex!: number;

  @Prop({ type: String, required: true })
  text!: string;

  @Prop({ type: Number, default: 1 })
  version!: number;

  // Anlamsal arama (source passage RAG) için önceden hesaplanmış embedding
  // vektörü. select:false → normal sorgularda taşınmaz, yalnız AI servisi
  // açıkça ister. Bkz. EmbeddingService / scripts/lib/embedding.mjs.
  @Prop({ type: [Number], default: undefined, select: false })
  embedding?: number[];

  // Embedding'in türetildiği kaynak metnin hash'i; metin değişmediyse
  // güncelleme sırasında yeniden embed etmemek için kullanılır.
  @Prop({ type: String })
  embeddingSourceHash?: string;

  @Prop({ type: String })
  embeddingModel?: string;

  @Prop({ type: Date })
  embeddingUpdatedAt?: Date;

  readonly createdAt!: Date;
  readonly updatedAt!: Date;
}

export const SourcePassageSchema = SchemaFactory.createForClass(SourcePassage);

SourcePassageSchema.index({ passageId: 1 }, { unique: true });
SourcePassageSchema.index({ sourceId: 1 });
