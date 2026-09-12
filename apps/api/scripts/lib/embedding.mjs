/* global console, process */
import { createHash } from 'node:crypto';
import { Binary } from 'mongodb';

export const DEFAULT_EMBEDDING_MODEL = 'text-embedding-3-large';

// Embedding kaynak metni şablonunun sürümü. Şablon (buildSourceText /
// buildPassageEmbeddingText) değiştiğinde bu değer de artırılmalı — backfill
// script'leri embeddingTextVersion alanını kontrol ederek eski şablonla
// üretilmiş kayıtları yeniden embed eder.
//
// v3 (2026-09): retrieval eval'inde (33 altın etiketli intent, pure-vector
// ablation) "Okunuş:" (transliterasyon) satırı recall@15/MRR'yi düşürdüğü
// için şablondan çıkarıldı — bkz. docs/ai-mimari.md §6.
export const EMBEDDING_TEXT_VERSION = 'v3';

// text-embedding-3-large fiyatlandırması (2026-09 itibarıyla): $0.13 / 1M
// input token. Yalnızca script özetlerinde tahmini maliyet göstermek için.
const COST_PER_MILLION_TOKENS_USD = 0.13;

// Bir embeddings.create() çağrısına gönderilecek maksimum girdi sayısı.
// OpenAI batch embedding limiti çok daha yüksek olsa da 64, tek bir isteğin
// hata/timeout halinde kaybedeceği iş miktarını sınırlı tutar.
const DEFAULT_BATCH_SIZE = 64;

export function embeddingModel() {
  return process.env.OPENAI_EMBEDDING_MODEL?.trim() || DEFAULT_EMBEDDING_MODEL;
}

/**
 * Zikir kaydından embedding kaynak metnini kurar (şablon v3). API tarafındaki
 * EmbeddingService.buildSourceText ile byte-byte aynı tutulmalıdır — ikisi de
 * bu dokümandaki mantığı paylaşır, aksi halde script ile API'nin ürettiği
 * embedding'ler karşılaştırılamaz hale gelir.
 *
 * Etiketli, sadece Türkçe satırlardan oluşur; boş alanlar tamamen düşer.
 * "Konular" satırı tags/categories'i birleştirir; ikisinden biri boşsa
 * yalnız doluyu yazar, ikisi de boşsa satır hiç eklenmez. v3'te "Okunuş"
 * (transliterasyon) satırı YOK — bkz. EMBEDDING_TEXT_VERSION yorumu.
 */
export function buildSourceText(source) {
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
  ].filter((line) => line !== null);

  return lines.join('\n');
}

/**
 * Bir kaynak pasajı (source_passages) için embedding girdi metnini kurar.
 * Salt pasaj metni değil, hangi kaynağın/bölümün parçası olduğunu da
 * gömerek retrieval'ın bağlamsal benzerliğini iyileştirir. Depolanan `text`
 * alanı bu birleşimden etkilenmez — yalnız embedding girdisi değişir.
 */
export function buildPassageEmbeddingText({ sourceTitle, sectionHeading, text }) {
  const title = String(sourceTitle ?? '').trim();
  const heading = String(sectionHeading ?? '').trim();
  const body = String(text ?? '').trim();

  const header = heading.length > 0 ? `${title} — ${heading}` : title;
  return [header, body].filter((part) => part.length > 0).join('\n');
}

function labeledLine(label, value) {
  const trimmed = String(value ?? '').trim();
  return trimmed.length > 0 ? `${label}: ${trimmed}` : null;
}

export function sourceHash(text) {
  return createHash('sha256').update(text).digest('hex');
}

/**
 * Sayısal embedding vektörünü BSON float32 vektörü (subtype 9) olarak
 * kodlar. Düz `number[]` her boyut için 8 byte (float64) + JSON/BSON array
 * overhead taşırken, bu temsil boyut başına 4 byte kullanır ve Atlas
 * $vectorSearch tarafından doğrudan tanınır (bkz. docs/ai-mimari.md).
 */
export function toVectorBinary(vector) {
  return Binary.fromFloat32Array(Float32Array.from(vector));
}

let cachedClient;
let clientResolved = false;

// Bir script çalıştırması boyunca biriken embedding kullanım özeti.
// resetEmbeddingUsage() ile her script başında sıfırlanabilir.
const usageSummary = {
  requests: 0,
  inputTokens: 0,
};

export function resetEmbeddingUsage() {
  usageSummary.requests = 0;
  usageSummary.inputTokens = 0;
}

export function getEmbeddingUsageSummary() {
  const estCostUsd =
    (usageSummary.inputTokens / 1_000_000) * COST_PER_MILLION_TOKENS_USD;
  return {
    requests: usageSummary.requests,
    inputTokens: usageSummary.inputTokens,
    estCostUsd,
  };
}

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
  cachedClient = new OpenAI({ apiKey, maxRetries: 3, timeout: 30_000 });
  return cachedClient;
}

/** Tek bir metin için embedding döndürür; üretilemezse null. */
export async function embed(text) {
  const trimmed = String(text ?? '').trim();
  if (!trimmed) {
    return null;
  }

  const [vector] = await embedMany([trimmed]);
  return vector ?? null;
}

/**
 * Birden fazla metni tek/az sayıda OpenAI isteğiyle embed eder. Girdiler
 * DEFAULT_BATCH_SIZE'lık gruplara bölünür; her grup ayrı bir
 * embeddings.create() çağrısıdır (client zaten maxRetries=3 ile yeniden
 * dener). Dönen vektörler girdilerle aynı sırada olur; boş/trim edilince
 * boşalan metinler için null döner (isteğe gitmez).
 */
export async function embedMany(texts, { batchSize = DEFAULT_BATCH_SIZE } = {}) {
  const trimmedInputs = texts.map((text) => String(text ?? '').trim());
  const results = new Array(trimmedInputs.length).fill(null);

  const indexesToEmbed = trimmedInputs
    .map((text, index) => (text.length > 0 ? index : -1))
    .filter((index) => index !== -1);

  if (indexesToEmbed.length === 0) {
    return results;
  }

  const client = await getClient();
  if (!client) {
    return results;
  }

  for (let start = 0; start < indexesToEmbed.length; start += batchSize) {
    const batchIndexes = indexesToEmbed.slice(start, start + batchSize);
    const batchInputs = batchIndexes.map((index) => trimmedInputs[index]);

    const response = await client.embeddings.create({
      model: embeddingModel(),
      input: batchInputs,
    });

    usageSummary.requests += 1;
    if (typeof response.usage?.prompt_tokens === 'number') {
      usageSummary.inputTokens += response.usage.prompt_tokens;
    }

    for (const item of response.data ?? []) {
      const originalIndex = batchIndexes[item.index];
      results[originalIndex] = Array.isArray(item.embedding) ? item.embedding : null;
    }
  }

  return results;
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
    embedding: toVectorBinary(vector),
    embeddingSourceHash: hash,
    embeddingModel: embeddingModel(),
    embeddingTextVersion: EMBEDDING_TEXT_VERSION,
    embeddingUpdatedAt: new Date(),
  };
}
