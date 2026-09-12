/**
 * Zikir seed verisindeki `timeOfDay` alanını normalize eder. Ham veri
 * Türkçe/İngilizce karışık string ya da dizi olabilir (ör. 'sabah',
 * ['ogle', 'ikindi'], 'evening'); şema ise sabit İngilizce enum dizisi
 * bekler: morning | afternoon | evening | night | any.
 *
 * Dört zaman diliminin (morning/afternoon/evening/night) tamamı sonuçta
 * varsa tek başına ['any'] döndürülür — "her vakit" anlamına gelir ve
 * $in sorgularında 'any' ile eşleşen ayrı bir dal gerektirmez.
 */

const ALL_SLOTS = ['morning', 'afternoon', 'evening', 'night'];

const TOKEN_MAP = {
  sabah: 'morning',
  morning: 'morning',
  ogle: 'afternoon',
  öğle: 'afternoon',
  ikindi: 'afternoon',
  afternoon: 'afternoon',
  aksam: 'evening',
  akşam: 'evening',
  evening: 'evening',
  gece: 'night',
  yatsi: 'night',
  yatsı: 'night',
  night: 'night',
  any: 'any',
};

/**
 * @param {unknown} raw
 * @returns {string[]}
 */
export function normalizeTimeOfDay(raw) {
  if (raw === undefined || raw === null) {
    return ['any'];
  }

  const rawList = Array.isArray(raw) ? raw : [raw];
  const trimmed = rawList
    .map((value) => (typeof value === 'string' ? value.trim().toLowerCase() : value))
    .filter((value) => value !== '' && value !== undefined && value !== null);

  if (trimmed.length === 0) {
    return ['any'];
  }

  const mapped = new Set();
  for (const token of trimmed) {
    const normalized = TOKEN_MAP[token];
    if (!normalized) {
      throw new Error(`Geçersiz timeOfDay değeri: ${JSON.stringify(token)}`);
    }
    if (normalized === 'any') {
      return ['any'];
    }
    mapped.add(normalized);
  }

  if (ALL_SLOTS.every((slot) => mapped.has(slot))) {
    return ['any'];
  }

  return [...mapped];
}
