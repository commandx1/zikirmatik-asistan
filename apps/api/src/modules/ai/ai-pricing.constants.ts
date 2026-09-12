/**
 * AI (OpenAI) çağrılarının USD/1M token liste fiyatları. Bunlar sağlayıcı
 * liste fiyatlarıdır — indirim/anlaşma fiyatları düşebilir, bu değerler
 * yalnızca yaklaşık maliyet raporlaması içindir, faturalama için kesin
 * kaynak DEĞİLDİR.
 */
export const MODEL_PRICES: Record<string, { input: number; output: number }> = {
  'gpt-5': { input: 1.25, output: 10.0 },
  'gpt-5-mini': { input: 0.25, output: 2.0 },
  'gpt-4o-mini': { input: 0.15, output: 0.6 },
  'text-embedding-3-large': { input: 0.13, output: 0 },
};

/**
 * Opsiyonel env override. Örn:
 *   AI_MODEL_PRICES_JSON='{"gpt-5-mini":{"input":0.2,"output":1.8}}'
 * Geçersiz/parse edilemeyen JSON sessizce yoksayılır (MODEL_PRICES korunur).
 */
function loadPriceOverrides(): Record<
  string,
  { input: number; output: number }
> {
  const raw = process.env.AI_MODEL_PRICES_JSON;
  if (!raw) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      return parsed as Record<string, { input: number; output: number }>;
    }
    return {};
  } catch {
    return {};
  }
}

const RESOLVED_PRICES: Record<string, { input: number; output: number }> = {
  ...MODEL_PRICES,
  ...loadPriceOverrides(),
};

/**
 * Model adını fiyat tablosundaki köke normalize eder (tarih/suffix atar).
 * Örn: 'gpt-5-mini-2025-08-07' → 'gpt-5-mini'. Birden fazla anahtar eşleşirse
 * (ör. 'gpt-5' ve 'gpt-5-mini' ikisi de 'gpt-5-mini-2025-08-07' ile eşleşir)
 * EN UZUN eşleşen anahtar seçilir, aksi halde daha genel bir kök ('gpt-5')
 * daha spesifik olanın ('gpt-5-mini') önüne geçebilir.
 */
export function normalizeModelName(model: string): string {
  const trimmed = model?.trim() ?? '';
  const match = Object.keys(RESOLVED_PRICES)
    .filter((key) => trimmed.startsWith(key))
    .sort((a, b) => b.length - a.length)[0];
  return match ?? trimmed;
}

/**
 * Token kullanımından yaklaşık USD maliyeti hesaplar. Bilinmeyen model için
 * 0 döner — çağıran taraf isterse ayrıca warn loglayabilir.
 */
export function estimateCostUsd(
  model: string,
  inputTokens: number,
  outputTokens: number,
): number {
  const normalized = normalizeModelName(model);
  const price = RESOLVED_PRICES[normalized];
  if (!price) {
    return 0;
  }
  const inputCost = (inputTokens / 1_000_000) * price.input;
  const outputCost = (outputTokens / 1_000_000) * price.output;
  return inputCost + outputCost;
}
