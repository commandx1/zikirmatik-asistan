import { SOURCE_DATASETS } from './data/sourceDataset.mjs';

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function localizedLength(value) {
  if (typeof value === 'string') {
    return value.length;
  }
  return value?.tr?.length ?? 0;
}

function mergeDhikr(base, next) {
  return {
    ...base,
    ...next,
    transliteration:
      localizedLength(next.transliteration) > localizedLength(base.transliteration)
        ? next.transliteration
        : base.transliteration,
    nameArabic:
      (next.nameArabic?.length ?? 0) > (base.nameArabic?.length ?? 0)
        ? next.nameArabic
        : base.nameArabic,
    meaning:
      localizedLength(next.meaning) > localizedLength(base.meaning)
        ? next.meaning
        : base.meaning,
    virtue:
      localizedLength(next.virtue) > localizedLength(base.virtue)
        ? next.virtue
        : base.virtue,
    source:
      localizedLength(next.source) > localizedLength(base.source)
        ? next.source
        : base.source,
    recommendedCount: Math.max(
      base.recommendedCount ?? 0,
      next.recommendedCount ?? 0,
    ),
    tags: uniq([...(base.tags ?? []), ...(next.tags ?? [])]),
    categories: uniq([...(base.categories ?? []), ...(next.categories ?? [])]),
    suitableFor: uniq([
      ...(base.suitableFor ?? []),
      ...(next.suitableFor ?? []),
    ]),
  };
}

// Dhikr key'leri artık tek doğruluk kaynağı: farklı datasetlerde aynı `key`
// tekrar ederse kayıtlar birleştirilir (mergeDhikr), isim/transliterasyon
// bazlı imza eşleştirmesine gerek yok.
const canonicalByKey = new Map();
const keyRemap = new Map();

for (const dataset of SOURCE_DATASETS) {
  for (const item of dataset.dhikrItems) {
    const existing = canonicalByKey.get(item.key);
    if (existing) {
      canonicalByKey.set(item.key, mergeDhikr(existing, item));
    } else {
      canonicalByKey.set(item.key, { ...item });
    }
    keyRemap.set(item.key, item.key);
  }
}

const dhikrItems = Array.from(canonicalByKey.values());
const specialDayByComposite = new Map();

for (const dataset of SOURCE_DATASETS) {
  for (const item of dataset.specialDays || []) {
    const remappedDhikrKeys = uniq(
      (item.dhikrKeys ?? []).map((key) => keyRemap.get(key) ?? key),
    );
    const specialDay = { ...item, dhikrKeys: remappedDhikrKeys };
    // NOT: specialDays artık ÇÖZÜLMEMİŞ ŞABLONLAR (date/eventKey yok; hijri
    // veya hijriRule + eventFamily var) — bkz. scripts/lib/special-day-seed.mjs
    // expandSpecialDays. Bileşik anahtar bu yüzden eventFamily + dayIndex +
    // ad kullanır (date değil). hijri/hijriRule/onlyHijriYears/excludeHijriYears
    // da imzaya dahildir — aksi halde AYNI aile+ad'a sahip ama farklı yıl
    // aralığını hedefleyen iki şablon (örn. regaib-kandili'nin 2025 "sade" ve
    // 2026 "zengin" sürümleri) burada birbirini sessizce ezer.
    const compositeKey = [
      item.eventFamily,
      item.dayIndex ?? '',
      // name artık { tr, en } nesnesi olabilir; Türkçe metni imzada kullan.
      (typeof item.name === 'object' ? item.name?.tr : item.name) ?? '',
      JSON.stringify(item.hijri ?? null),
      JSON.stringify(item.hijriRule ?? null),
      JSON.stringify(item.onlyHijriYears ?? null),
      JSON.stringify(item.excludeHijriYears ?? null),
    ].join('|');
    const existing = specialDayByComposite.get(compositeKey);

    if (!existing) {
      specialDayByComposite.set(compositeKey, specialDay);
      continue;
    }

    // Aynı gün birden çok veri dosyasında tanımlıysa daha zengin dhikrKeys
    // listesi kazanır; ancak okuma içeriği (`article`/`practices`) hangi
    // kayıtta yazıldıysa korunur — aksi halde kaybolurdu.
    const winner =
      (specialDay.dhikrKeys?.length ?? 0) > (existing.dhikrKeys?.length ?? 0)
        ? specialDay
        : existing;
    const loser = winner === specialDay ? existing : specialDay;

    const article = winner.article ?? loser.article;
    const practices = winner.practices?.length
      ? winner.practices
      : loser.practices;

    specialDayByComposite.set(compositeKey, {
      ...winner,
      ...(article ? { article } : {}),
      ...(practices?.length ? { practices } : {}),
    });
  }
}

// Şablonlarda `date` yok; belirleyici sıralama için eventFamily + dayIndex
// kullanılır (miladi tarih sıralaması artık seed açılımı sırasında olur).
const specialDays = Array.from(specialDayByComposite.values()).sort((a, b) => {
  if (a.eventFamily === b.eventFamily) {
    return (a.dayIndex ?? 0) - (b.dayIndex ?? 0);
  }
  return a.eventFamily.localeCompare(b.eventFamily);
});

export const SPECIAL_DAY_DATASET = {
  key: 'special-days-master-2026',
  label: 'Special Days Master 2026',
  dhikrItems,
  specialDays,
};

export function getAvailableEventFamilies() {
  return uniq(specialDays.map((item) => item.eventFamily));
}

/**
 * `identifier`, bir eventFamily (örn. 'mirac-kandili') İLE eşleşir. Geriye
 * dönük uyum için, doğrudan bir çözülmüş eventKey (örn. 'mirac-kandili-2026')
 * verilirse de family kısmı ayrıştırılıp aynı şekilde eşleştirilir.
 */
export function buildEventDataset(identifier) {
  const families = new Set(specialDays.map((item) => item.eventFamily));
  const family = families.has(identifier)
    ? identifier
    : [...families].find((f) => identifier.startsWith(`${f}-`));

  const filtered = specialDays.filter((item) => item.eventFamily === family);
  if (filtered.length === 0) {
    return null;
  }

  const usedDhikrKeySet = new Set(
    filtered.flatMap((item) => item.dhikrKeys ?? []),
  );
  const filteredDhikrs = dhikrItems.filter((item) =>
    usedDhikrKeySet.has(item.key),
  );

  return {
    key: family,
    label: 'Special Days ' + family,
    dhikrItems: filteredDhikrs,
    specialDays: filtered,
  };
}
