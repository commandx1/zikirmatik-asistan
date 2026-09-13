import type { Types } from 'mongoose';

/**
 * Bir vird dilimi. `prayer` dilimi vakit başına (bkz. VirdPrayerIndex) tekrar
 * eder; diğerleri günde tek örnektir.
 */
export type VirdSlotKey = 'morning' | 'prayer' | 'evening' | 'night' | 'free';

export const VIRD_SLOT_KEYS: readonly VirdSlotKey[] = [
  'morning',
  'prayer',
  'evening',
  'night',
  'free',
];

/** 1=sabah, 2=öğle, 3=ikindi, 4=akşam, 5=yatsı. */
export type VirdPrayerIndex = 1 | 2 | 3 | 4 | 5;

export const VIRD_PRAYER_INDEXES: readonly VirdPrayerIndex[] = [1, 2, 3, 4, 5];

export type VirdProgramKind = 'routine' | 'journey';

export type VirdProgramStatus =
  | 'draft'
  | 'active'
  | 'paused'
  | 'completed'
  | 'archived';

export type VirdProgramSource = 'manual' | 'template' | 'ai';

// class-validator @IsEnum plain-object-map deseni (bkz. create-dhikr-log.dto.ts
// LOG_SOURCE) — runtime'da değer listesi olarak da kullanılabilir.
export const VIRD_SLOT_KEY_ENUM = {
  morning: 'morning',
  prayer: 'prayer',
  evening: 'evening',
  night: 'night',
  free: 'free',
} as const;

export const VIRD_PROGRAM_KIND_ENUM = {
  routine: 'routine',
  journey: 'journey',
} as const;

export const VIRD_PROGRAM_SOURCE_ENUM = {
  manual: 'manual',
  template: 'template',
  ai: 'ai',
} as const;

export const VIRD_PROGRAM_STATUS_ENUM = {
  draft: 'draft',
  active: 'active',
  paused: 'paused',
  completed: 'completed',
  archived: 'archived',
} as const;

/**
 * Bir vird item'ının tekil kimliği. `prayer` dilimindeki aynı zikir farklı
 * vakitlerde (1..5) çakışmadan ayrı sayılabilsin, diğer dilimlerdeki aynı
 * zikir de farklı dilimlerde (sabah/akşam) çakışmasın diye kullanılır.
 * Biçim: `${slot}:${prayerIndex ?? 0}:${dhikrRef}`
 */
export function buildVirdItemKey(
  slot: VirdSlotKey,
  prayerIndex: number | null | undefined,
  dhikrRef: string,
): string {
  return `${slot}:${prayerIndex ?? 0}:${dhikrRef}`;
}

/**
 * dhikrId (ObjectId|string) veya customDhikrId (string) alanından kararlı bir
 * referans metni üretir — item key'lerinde ve ilerleme eşlemesinde kullanılır.
 * dhikr-logs'taki aynı ikili (dhikrId | customDhikrId) örüntüsünü izler.
 */
export function resolveDhikrRef(item: {
  dhikrId?: Types.ObjectId | string | null;
  customDhikrId?: string | null;
}): string | undefined {
  if (item.dhikrId) {
    return typeof item.dhikrId === 'string'
      ? item.dhikrId
      : item.dhikrId.toString();
  }
  if (item.customDhikrId) {
    return item.customDhikrId;
  }
  return undefined;
}
