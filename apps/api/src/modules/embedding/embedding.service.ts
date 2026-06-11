import { createHash } from 'node:crypto';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

type EmbeddingSource = {
  nameTurkish?: string;
  suitableFor?: string[];
  tags?: string[];
  categories?: string[];
  virtue?: string;
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
   * Bir zikir kaydından embedding'in türetileceği kaynak metni kurar.
   * Fazilet (virtue) ve amaç (suitableFor) anlamsal eşleşmenin çekirdeğidir.
   */
  buildSourceText(source: EmbeddingSource): string {
    return [
      source.nameTurkish,
      (source.suitableFor ?? []).join(', '),
      (source.tags ?? []).join(', '),
      (source.categories ?? []).join(', '),
      source.virtue,
    ]
      .map((part) => (part ?? '').trim())
      .filter((part) => part.length > 0)
      .join('\n');
  }

  sourceHash(text: string): string {
    return createHash('sha256').update(text).digest('hex');
  }

  async embed(text: string): Promise<number[] | null> {
    const trimmed = text?.trim();
    if (!trimmed) {
      return null;
    }

    const client = this.getClient();
    if (!client) {
      return null;
    }

    try {
      const response = await client.embeddings.create({
        model: this.model,
        input: trimmed,
      });

      const vector = response.data?.[0]?.embedding;
      if (!Array.isArray(vector) || vector.length === 0) {
        this.logger.warn('Embedding yanıtı boş döndü.');
        return null;
      }

      return vector;
    } catch (error) {
      this.logger.warn(`Embedding üretilemedi: ${describeError(error)}`);
      return null;
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
