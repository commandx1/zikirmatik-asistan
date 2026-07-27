/**
 * Özel gün → zikir etiketleme.
 *
 * Özel Günler modülü artık zikir önermiyor; kullanıcı o gün için zikri AI
 * Rehber'den alıyor. Bunun çalışması için o güne ait zikirlerin retrieval
 * tarafından bulunabilir olması gerekir. Seed'deki `specialDays[].dhikrKeys`
 * listesi bu yüzden korunur ama artık `recommendedDhikrIds` üretmez: sadece
 * "bu zikirleri şu günle etiketle" talimatıdır.
 *
 * Etiketler üç retrieval yolunun da okuduğu alanlara yazılır:
 *   - suitableFor  → ai.service.ts rerank ×3 ve fallback-recommender.ts
 *                    scoreSpecialDayMatch (yalnızca bu alana bakar)
 *   - tags         → rerank ×2 + fallback kelime örtüşmesi
 *   - categories   → rerank ×1 (KNOWN_CATEGORIES ile senkron olmalı)
 * Üçü de embedding kaynak metnine girdiği için (embedding.service.ts)
 * etiketlenen zikirler bir sonraki seed'de yeniden embed edilir.
 */

/**
 * Kategori kuralları. Sol taraf özel günün TR adı + eventKey üzerinde aranır.
 * ÜRETTİĞİ HER DEĞER `KNOWN_CATEGORIES` (apps/api/src/modules/ai/ai.service.ts)
 * içinde de bulunmalıdır; aksi halde LLM bu kategoriyi hiç üretemez.
 */
const CATEGORY_RULES = [
  [/regaib|regâib/i, ['regaib', 'kandil', 'cuma']],
  [/berat/i, ['berat', 'kandil']],
  [/mi'?ra[cç]/i, ['miraç', 'kandil']],
  [/kadir/i, ['kadir gecesi', 'kandil']],
  [/mevlid/i, ['mevlid']],
  [/aşure|asure/i, ['aşure', 'muharrem']],
  [/muharrem|hicri yılbaşı/i, ['muharrem']],
  [/arefe|arife/i, ['arefe']],
  [/zilhicce/i, ['zilhicce', 'hac']],
  [/zilkade/i, ['zilkade']],
  [/ramazan/i, ['ramazan', 'oruç']],
  [/recep/i, ['recep', 'üç aylar']],
  [/şaban|saban/i, ['şaban', 'üç aylar']],
  [/safer/i, ['safer']],
  [/üç ay|uc-aylar/i, ['üç aylar']],
  [/eyy[aâ]m|biyd/i, ['eyyam-ı biyd', 'oruç']],
];

/** Özel gün türü → kategori. Şemadaki dört tür de karşılanır. */
const TYPE_CATEGORIES = {
  kandil: ['kandil', 'özel gün'],
  ramazan: ['ramazan', 'oruç', 'özel gün'],
  bayram: ['bayram', 'özel gün'],
  'özel gün': ['özel gün'],
};

/**
 * Tüm özel günler için tek seferde `dhikrKey → { suitableFor, tags, categories }`
 * indeksi kurar.
 *
 * İndeks HER ZAMAN tam özel gün listesinden üretilmelidir; tek bir event
 * seed'lenirken bile. Aynı zikir (ör. ISTIGFAR) 15 ayrı güne bağlı ve dhikr
 * dokümanı `$set` ile yazıldığı için, kısmi indeks diğer günlerin etiketlerini
 * silerdi.
 */
export function buildSpecialDayTagIndex(specialDays) {
  const index = new Map();

  for (const specialDay of specialDays) {
    const derived = deriveSpecialDayTags(specialDay);

    for (const dhikrKey of specialDay.dhikrKeys ?? []) {
      const entry = index.get(dhikrKey) ?? {
        suitableFor: new Set(),
        tags: new Set(),
        categories: new Set(),
      };

      for (const value of derived.suitableFor) entry.suitableFor.add(value);
      for (const value of derived.tags) entry.tags.add(value);
      for (const value of derived.categories) entry.categories.add(value);

      index.set(dhikrKey, entry);
    }
  }

  // Çok sayıda güne bağlı zikirler (ör. istiğfar 40+ gün) aksi halde onlarca
  // etiket toplar; bu hem dokümanı hem embedding kaynak metnini şişirip
  // zikrin asıl anlamını bastırır. Containment eşleşmesi zaten iki yönlü
  // çalıştığı için kısa terim uzununun yerini tutar: 'ramazan' varken
  // 'ramazan ayı girişi' gereksizdir.
  for (const entry of index.values()) {
    entry.suitableFor = minimizeByContainment(entry.suitableFor);
    entry.tags = minimizeByContainment(entry.tags);
  }

  return index;
}

function minimizeByContainment(values) {
  const items = [...values].sort((a, b) => a.length - b.length);
  const kept = [];

  for (const item of items) {
    if (!kept.some((existing) => item.includes(existing))) {
      kept.push(item);
    }
  }

  return new Set(kept);
}

function deriveSpecialDayTags(specialDay) {
  const nameTr = resolveName(specialDay.name, 'tr');
  const nameEn = resolveName(specialDay.name, 'en');

  // Tam ad şart: fallback-recommender'daki scoreSpecialDayMatch, mobilden gelen
  // `specialDayName` (ekranda görünen ad) ile suitableFor değerlerini karşılıklı
  // `includes` ile karşılaştırır. eventKey ('regaib-kandili-2025') tireli ve
  // yıllı olduğu için hiçbir zaman eşleşmez, bu yüzden kullanılmaz.
  const fullNames = [lower(nameTr), lower(nameEn)].filter(Boolean);

  // Kısa etkinlik terimi ('Ramazan 15. Gün — Mağfiret' → 'ramazan'): gün adının
  // tüm varyantlarında containment tutsun diye.
  const terms = [shortTerm(nameTr), shortTerm(nameEn)].filter(Boolean);

  const suitableFor = [...fullNames, ...terms];
  // Çok kelimeli etiket sorun değil: hem fallback-recommender hem embedding
  // alan değerlerini kendisi tokenize ediyor.
  const tags = [...terms, specialDay.type].filter(Boolean);

  const haystack = `${nameTr} ${specialDay.eventKey ?? ''}`;
  const categories = [
    ...(TYPE_CATEGORIES[specialDay.type] ?? []),
    ...CATEGORY_RULES.filter(([pattern]) => pattern.test(haystack)).flatMap(
      ([, values]) => values,
    ),
  ];

  return { suitableFor, tags, categories };
}

/**
 * Gün adından kısa etkinlik terimi çıkarır: ilk segment alınır (ayraçtan veya
 * parantezden önce), sıra numaraları ve 'gün' kelimesi atılır.
 *   'Ramazan 15. Gün — Mağfiret'      → 'ramazan'
 *   '10 Muharrem (Aşure)'             → 'muharrem'
 *   'Eyyâm-ı Biyd — Recep 1448'       → 'eyyâm-ı biyd'
 *   'Regaib Kandili'                  → 'regaib kandili'
 */
function shortTerm(name) {
  if (!name) {
    return '';
  }

  const base = name.split(/\s+—\s+|\s+–\s+|\s*\(/)[0];
  const tokens = base
    .split(/\s+/)
    .filter(
      (token) =>
        !/^\d+\.?$/.test(token) && !['gün', 'day'].includes(lower(token)),
    );

  return lower(tokens.join(' '));
}

function resolveName(name, locale) {
  if (!name) {
    return '';
  }
  if (typeof name === 'string') {
    return locale === 'tr' ? name : '';
  }
  return name[locale] ?? '';
}

function lower(value) {
  return (value ?? '').trim().toLocaleLowerCase('tr-TR');
}
