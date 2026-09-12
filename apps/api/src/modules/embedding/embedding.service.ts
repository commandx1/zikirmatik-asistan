import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Binary } from 'mongodb';
import OpenAI from 'openai';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-large';

// scripts/lib/embedding.mjs ile aynı sürüm — şablon (buildSourceText)
// değiştiğinde ikisi birlikte artırılmalı.
//
// v3 (2026-09): retrieval eval'inde (33 altın etiketli intent, pure-vector
// ablation) "Okunuş:" (transliterasyon) satırı recall@15/MRR'yi düşürdüğü
// için şablondan çıkarıldı — bkz. docs/ai-mimari.md §6.
export const EMBEDDING_TEXT_VERSION = 'v3';

type EmbeddingSource = {
  name?: { tr?: string };
  suitableFor?: string[];
  tags?: string[];
  categories?: string[];
  meaning?: { tr?: string };
  virtue?: { tr?: string };
};

/**
 * Zikir kataloğu için embedding üretir. Hem AI Rehber retrieval aşaması
 * (sorgu metni) hem de Dhikr CRUD'ı (katalog kayıtları) tarafından paylaşılır.
 *
 * OpenAI erişilemezse embed() null döner; çağıranlar bunu loglar ve
 * akışı bloklamadan devam eder (CRUD veya fallback retrieval).
 */
@Injectable()
export class EmbeddingService {
  private readonly logger = new Logger(EmbeddingService.name);
  private client: OpenAI | null = null;
  private clientResolved = false;

  constructor(private readonly configService: ConfigService) {}

  get model(): string {
    return (
      this.configService.get<string>('OPENAI_EMBEDDING_MODEL') ||
      DEFAULT_EMBEDDING_MODEL
    );
  }

  /**
   * Bir zikir kaydından embedding'in türetileceği kaynak metni kurar
   * (şablon v3). scripts/lib/embedding.mjs#buildSourceText ile byte-byte
   * aynı tutulmalıdır — aksi halde script ile API'nin ürettiği embedding'ler
   * karşılaştırılamaz hale gelir. Etiketli, sadece Türkçe satırlardan
   * oluşur; boş alanlar tamamen düşer. v3'te "Okunuş" (transliterasyon)
   * satırı YOK — bkz. EMBEDDING_TEXT_VERSION yorumu.
   */
  buildSourceText(source: EmbeddingSource): string {
    const topics = [
      (source.tags ?? []).join(', '),
      (source.categories ?? []).join(', '),
    ]
      .map((part) => part.trim())
      .filter((part) => part.length > 0)
      .join('; ');

    const lines = [
      labeledLine('Zikir', source.name?.tr),
      labeledLine('Ne zaman / kim için', (source.suitableFor ?? []).join(', ')),
      labeledLine('Konular', topics),
      labeledLine('Anlam', source.meaning?.tr),
      labeledLine('Fazilet', source.virtue?.tr),
    ].filter((line): line is string => line !== null);

    return lines.join('\n');
  }

  sourceHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  /**
   * Sayısal embedding vektörünü BSON float32 vektörü (subtype 9) olarak
   * kodlar. Mongoose Schema.Types.Mixed bu Binary'i olduğu gibi geçirir;
   * düz Buffer/number[] kullanmak subtype bilgisini kaybeder ve Atlas
   * $vectorSearch'ün vektörü tanımasını engeller.
   */
  toVectorBinary(vector: number[]): Binary {
    return Binary.fromFloat32Array(Float32Array.from(vector));
  }

  async embed(text: string): Promise<number[] | null> {
    const result = await this.embedWithUsage(text);
    return result.vector;
  }

  /**
   * embed() ile birebir aynı davranış (null durumları, try/catch) ancak
   * ayrıca OpenAI yanıtındaki token kullanımını da döner — usage-tracking
   * katmanı bunu ai_usage_log'a yazmak için kullanır. embed()'in imzasını
   * bozmamak için ayrı bir method.
   */
  async embedWithUsage(
    text: string,
  ): Promise<{ vector: number[] | null; usage?: { inputTokens: number } }> {
    const trimmed = text?.trim();
    if (!trimmed) {
      return { vector: null };
    }

    const client = this.getClient();
    if (!client) {
      return { vector: null };
    }

    try {
      const response = await client.embeddings.create({
        model: this.model,
        input: trimmed,
      });

      const vector = response.data?.[0]?.embedding;
      if (!Array.isArray(vector) || vector.length === 0) {
        this.logger.warn('Embedding yanıtı boş döndü.');
        return { vector: null };
      }

      const promptTokens = response.usage?.prompt_tokens;
      const usage =
        typeof promptTokens === 'number'
          ? { inputTokens: promptTokens }
          : undefined;

      return { vector, usage };
    } catch (error) {
      this.logger.warn(`Embedding üretilemedi: ${describeError(error)}`);
      return { vector: null };
    }
  }

  private getClient(): OpenAI | null {
    if (this.clientResolved) {
      return this.client;
    }

    this.clientResolved = true;
    const apiKey = this.configService.get<string>('OPENAI_API_KEY');

    if (!apiKey) {
      this.logger.warn(
        'OPENAI_API_KEY tanımlı değil, embedding üretilemeyecek.',
      );
      this.client = null;
      return null;
    }

    const timeout = readNumberConfig(
      this.configService,
      'OPENAI_TIMEOUT_MS',
      15_000,
    );
    const maxRetries = readNumberConfig(
      this.configService,
      'OPENAI_MAX_RETRIES',
      2,
    );

    this.client = new OpenAI({ apiKey, timeout, maxRetries });
    return this.client;
  }
}

function labeledLine(label: string, value: string | undefined): string | null {
  const trimmed = (value ?? '').trim();
  return trimmed.length > 0 ? `${label}: ${trimmed}` : null;
}

/** İki vektör arasındaki kosinüs benzerliği (-1..1). */
export function cosineSimilarity(a: number[], b: number[]): number {
  const length = Math.min(a.length, b.length);
  if (length === 0) {
    return 0;
  }

  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let index = 0; index < length; index += 1) {
    const valueA = a[index];
    const valueB = b[index];
    dot += valueA * valueB;
    normA += valueA * valueA;
    normB += valueB * valueB;
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

function readNumberConfig(
  configService: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = configService.get<string | number>(key);
  const parsed = typeof raw === 'number' ? raw : Number(raw);

  return Number.isFinite(parsed) && parsed >= 0 ? parsed : fallback;
}

function describeError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  return typeof error === 'string' ? error : 'bilinmeyen hata';
}
