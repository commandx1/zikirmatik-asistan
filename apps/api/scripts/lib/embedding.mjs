/* global console, process */
import { createHash } from 'node:crypto';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-small';

export function embeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

/**
 * Zikir kaydından embedding kaynak metnini kurar. API tarafındaki
 * EmbeddingService.buildSourceText ile aynı mantıkta tutulmalıdır.
 */
export function buildSourceText(source) {
  return [
    source.nameTurkish,
    (source.suitableFor ?? []).join(', '),
    (source.tags ?? []).join(', '),
    (source.categories ?? []).join(', '),
    source.virtue,
  ]
    .map((part) => String(part ?? '').trim())
    .filter((part) => part.length > 0)
    .join('\n');
}

export function sourceHash(text) {
  return createHash('sha256').update(text).digest('hex');
}

let cachedClient;
let clientResolved = false;

async function getClient() {
  if (clientResolved) {
    return cachedClient;
  }
  clientResolved = true;

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    console.warn('OPENAI_API_KEY tanımlı değil; embedding üretilemeyecek.');
    cachedClient = null;
    return null;
  }

  const { default: OpenAI } = await import('openai');
  cachedClient = new OpenAI({ apiKey });
  return cachedClient;
}

/** Tek bir metin için embedding döndürür; üretilemezse null. */
export async function embed(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    return null;
  }

  const client = await getClient();
  if (!client) {
    return null;
  }

  const response = await client.embeddings.create({
    model: embeddingModel(),
    input: trimmed,
  });

  const vector = response.data?.[0]?.embedding;
  return Array.isArray(vector) && vector.length > 0 ? vector : null;
}

/**
 * Bir zikir kaydı için embedding alanlarını üretir. Mevcut hash kaynak metinle
 * eşleşiyorsa (currentHash) yeniden embed etmez ve null döner.
 */
export async function buildEmbeddingFields(source, currentHash) {
  const sourceText = buildSourceText(source);
  const hash = sourceHash(sourceText);

  if (currentHash && currentHash === hash) {
    return null;
  }

  const vector = await embed(sourceText);
  if (!vector) {
    return null;
  }

  return {
    embedding: vector,
    embeddingSourceHash: hash,
    embeddingModel: embeddingModel(),
    embeddingUpdatedAt: new Date(),
  };
}
