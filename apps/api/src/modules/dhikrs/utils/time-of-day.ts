import { TIME_OF_DAY_VALUES, type TimeOfDay } from '../schemas/dhikr.schema';

/**
 * Zikir seed verisi ve DTO transform'ları için `timeOfDay` normalize edici.
 * apps/api/scripts/lib/time-of-day.mjs ile birebir aynı mantığı taşır —
 * biri seed script'i (Node ESM), diğeri Nest tarafı (TypeScript) için.
 *
 * Dört zaman diliminin (morning/afternoon/evening/night) tamamı sonuçta
 * varsa tek başına ['any'] döndürülür.
 */

const ALL_SLOTS: TimeOfDay[] = ['morning', 'afternoon', 'evening', 'night'];

const TOKEN_MAP: Record<string, TimeOfDay> = {
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

export function normalizeTimeOfDay(raw: unknown): TimeOfDay[] {
  if (raw === undefined || raw === null) {
    return ['any'];
  }

  // Array.isArray'in eski tip tanımı (arg is any[]) kaskad `any` sızıntısına
  // yol açar; açık unknown[] cast'i ile bunu keseriz.
  const rawList: unknown[] = Array.isArray(raw) ? (raw as unknown[]) : [raw];
  const trimmed = rawList
    .map((value) =>
      typeof value === 'string' ? value.trim().toLowerCase() : value,
    )
    .filter((value) => value !== '' && value !== undefined && value !== null);

  if (trimmed.length === 0) {
    return ['any'];
  }

  const mapped = new Set<TimeOfDay>();
  for (const token of trimmed) {
    const normalized = typeof token === 'string' ? TOKEN_MAP[token] : undefined;
    if (!normalized || !TIME_OF_DAY_VALUES.includes(normalized)) {
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
