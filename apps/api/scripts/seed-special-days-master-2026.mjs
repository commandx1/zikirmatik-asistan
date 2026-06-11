import { SOURCE_DATASETS } from './data/sourceDataset.mjs';

function normalize(value) {
  return String(value ?? '')
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .replace(/ğ/g, 'g')
    .replace(/ü/g, 'u')
    .replace(/ş/g, 's')
    .replace(/ö/g, 'o')
    .replace(/ç/g, 'c')
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function uniq(items) {
  return [...new Set(items.filter(Boolean))];
}

function mergeDhikr(base, next) {
  return {
    ...base,
    ...next,
    transliteration:
      (next.transliteration?.length ?? 0) > (base.transliteration?.length ?? 0)
        ? next.transliteration
        : base.transliteration,
    nameArabic:
      (next.nameArabic?.length ?? 0) > (base.nameArabic?.length ?? 0)
        ? next.nameArabic
        : base.nameArabic,
    meaning:
      (next.meaning?.length ?? 0) > (base.meaning?.length ?? 0)
        ? next.meaning
        : base.meaning,
    virtue:
      (next.virtue?.length ?? 0) > (base.virtue?.length ?? 0)
        ? next.virtue
        : base.virtue,
    source:
      (next.source?.length ?? 0) > (base.source?.length ?? 0)
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

const canonicalByKey = new Map();
const canonicalBySignature = new Map();
const keyRemap = new Map();

for (const dataset of SOURCE_DATASETS) {
  for (const item of dataset.dhikrItems) {
    const canonicalSignature =
      normalize(item.nameTurkish) + '|' + normalize(item.transliteration);

    const existingKey = canonicalBySignature.get(canonicalSignature);
    if (existingKey) {
      const merged = mergeDhikr(canonicalByKey.get(existingKey), item);
      canonicalByKey.set(existingKey, { ...merged, key: existingKey });
      keyRemap.set(item.key, existingKey);
      continue;
    }

    canonicalByKey.set(item.key, { ...item });
    canonicalBySignature.set(canonicalSignature, item.key);
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
    const compositeKey = [
      item.eventKey,
      item.date,
      item.dayIndex ?? '',
      item.name ?? '',
    ].join('|');
    const existing = specialDayByComposite.get(compositeKey);

    if (!existing) {
      specialDayByComposite.set(compositeKey, specialDay);
      continue;
    }

    if (
      (specialDay.dhikrKeys?.length ?? 0) > (existing.dhikrKeys?.length ?? 0)
    ) {
      specialDayByComposite.set(compositeKey, specialDay);
    }
  }
}

const specialDays = Array.from(specialDayByComposite.values()).sort((a, b) => {
  if (a.date === b.date) {
    return (a.dayIndex ?? 0) - (b.dayIndex ?? 0);
  }
  return a.date.localeCompare(b.date);
});

export const SPECIAL_DAY_DATASET = {
  key: 'special-days-master-2026',
  label: 'Special Days Master 2026',
  dhikrItems,
  specialDays,
};

export function getAvailableEventKeys() {
  return uniq(specialDays.map((item) => item.eventKey));
}

export function buildEventDataset(eventKey) {
  const filtered = specialDays.filter((item) => item.eventKey === eventKey);
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
    key: eventKey,
    label: 'Special Days ' + eventKey,
    dhikrItems: filteredDhikrs,
    specialDays: filtered,
  };
}
