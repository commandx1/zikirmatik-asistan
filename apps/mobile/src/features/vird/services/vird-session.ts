// Rehberli vird oturumu için saf yardımcılar (React/store yok). Bir "oturum"
// tek bir dilime (slot) — prayer için tek bir vakte — indirgenmiş item
// listesidir; ekran bu listeyi count/hedef göstermek ve "sıradaki eksik
// item"e atlamak için kullanır. buildVirdItemKey/expectedItemsForDay/
// slotProgress (vird-day.ts) üzerine kurulur, kendi state'i yoktur.
import {
  dayIndexFor,
  expectedItemsForDay,
  slotProgress,
  type ExpectedVirdItem,
  type VirdDayProgramLike
} from "./vird-day";
import type { CreateDhikrLogPayload, VirdLogFields } from "../../dhikrs/services/dhikr-logs-api-client";
import type { LocalizedText, VirdDayProgressMap, VirdProgramLocal, VirdSlotKey } from "../types";

const OBJECT_ID_RE = /^[a-f\d]{24}$/i;

// store/dhikr-store.ts'teki resolveLocalizedText ile AYNI mantık — buradan
// import ETMEZ, çünkü dhikr-store.ts (AsyncStorage/i18n/profile-store
// zinciri üzerinden) React Native'e bağımlıdır; bu servis kasıtlı olarak
// saf/store-bağımsız kalır (bkz. görev notu). widget-snapshot.ts de (aynı
// nedenle saf kalması gereken) bu kopyayı import eder.
export function resolveLocalizedText(text: LocalizedText | string, locale: "tr" | "en"): string {
  if (typeof text === "string") {
    return text;
  }
  return text[locale] ?? text.tr ?? text.en ?? "";
}

export type VirdSessionKey = { slot: VirdSlotKey; prayerIndex: number | null };
export type VirdSessionItem = ExpectedVirdItem & { count: number; completed: boolean };

function sessionKeyString(key: VirdSessionKey): string {
  return `${key.slot}:${key.slot === "prayer" ? key.prayerIndex : "null"}`;
}

/** Bir oturumun (dilim + varsa vakit) item listesi — o gün için tanımlı bir
 * faz yoksa (bkz. expectedItemsForDay) boş liste döner. */
export function buildSessionItems(
  program: VirdDayProgramLike,
  todayKey: string,
  key: VirdSessionKey,
  progress: VirdDayProgressMap | undefined
): VirdSessionItem[] {
  const expected = expectedItemsForDay(program, dayIndexFor(program, todayKey));
  const items = slotProgress(expected, progress)[key.slot]?.items ?? [];
  return items.filter((item) => key.slot !== "prayer" || item.prayerIndex === key.prayerIndex);
}

/** currentIndex'ten SONRAKİ ilk tamamlanmamış item'ın index'i (currentIndex'in
 * kendisi hariç, listenin sonunda başa sarar) — hiçbiri yoksa null. */
export function pickNextIndex(items: VirdSessionItem[], currentIndex: number): number | null {
  for (let i = 1; i < items.length; i++) {
    const idx = (currentIndex + i) % items.length;
    if (!items[idx].completed) {
      return idx;
    }
  }
  return null;
}

/** Hedefi aşan item'lar 0 katkı yapar (asla negatif toplam). */
export function remainingReps(items: VirdSessionItem[]): number {
  return items.reduce((sum, item) => sum + Math.max(0, item.target - item.count), 0);
}

/**
 * `current`'tan sonraki ilk tamamlanmamış oturum anahtarını döner (VIRD_SLOT_KEYS
 * sırasıyla, prayer vakitleri artan sırada — bkz. expectedItemsForDay'in kendi
 * üretim sırası) ve gerekirse baştan sarar. Tüm oturumlar tamamlandıysa ya da
 * o gün için beklenen item yoksa null; `current`'ın kendisi asla dönmez.
 */
export function nextIncompleteSession(
  program: VirdDayProgramLike,
  todayKey: string,
  progress: VirdDayProgressMap | undefined,
  current: VirdSessionKey
): VirdSessionKey | null {
  const expected = expectedItemsForDay(program, dayIndexFor(program, todayKey));

  const keys: VirdSessionKey[] = [];
  const seen = new Set<string>();
  for (const item of expected) {
    const key: VirdSessionKey = { slot: item.slot, prayerIndex: item.slot === "prayer" ? item.prayerIndex : null };
    const keyStr = sessionKeyString(key);
    if (!seen.has(keyStr)) {
      seen.add(keyStr);
      keys.push(key);
    }
  }

  const currentStr = sessionKeyString(current);
  const currentIdx = keys.findIndex((key) => sessionKeyString(key) === currentStr);
  const startIdx = currentIdx >= 0 ? currentIdx + 1 : 0;

  for (let i = 0; i < keys.length; i++) {
    const candidate = keys[(startIdx + i) % keys.length];
    if (sessionKeyString(candidate) === currentStr) {
      continue;
    }
    const items = buildSessionItems(program, todayKey, candidate, progress);
    if (items.some((item) => !item.completed)) {
      return candidate;
    }
  }

  return null;
}

/**
 * dhikr-logs payload'ının vird alanları. API @IsMongoId virdProgramId ve
 * @Min(1) virdDayIndex bekler — yerel (henüz senkronize olmamış, UUID id'li)
 * programlar için bu alanlar ASLA gönderilmez (bkz. use-vird-counter-bridge.ts
 * buildVirdLogFields ile aynı kural, imzası farklı: burada program/dayIndex
 * doğrudan parametre).
 */
export function buildVirdLogFields(
  program: Pick<VirdProgramLocal, "id" | "origin">,
  item: Pick<ExpectedVirdItem, "slot" | "prayerIndex">,
  dayIndex: number
): VirdLogFields {
  if (program.origin !== "server" || dayIndex < 1) {
    return {};
  }

  return {
    virdProgramId: program.id,
    virdSlot: item.slot,
    virdDayIndex: dayIndex,
    ...(item.prayerIndex != null ? { virdPrayerIndex: item.prayerIndex } : {})
  };
}

/** home-context.tsx saveSelectedDhikrLog'daki dhikrId/customDhikrId ayrımını
 * (bkz. isObjectId) aynen taşır — vird oturumundan tek bir dhikr-logs
 * POST payload'ı üretir. */
export function buildSessionLogPayload(args: {
  userId: string;
  program: VirdProgramLocal;
  item: VirdSessionItem;
  dayIndex: number;
  date: string;
  locale: "tr" | "en";
  fallbackName: string;
}): CreateDhikrLogPayload {
  const { userId, program, item, dayIndex, date, locale, fallbackName } = args;
  const snapshot = program.dhikrs[item.ref];
  const count = Math.max(0, Math.min(item.target, item.count));

  const identity = OBJECT_ID_RE.test(item.ref)
    ? { dhikrId: item.ref }
    : {
        customDhikrId: item.ref,
        customDhikrName: resolveLocalizedText(snapshot?.name ?? fallbackName, locale),
        customDhikrArabic: snapshot?.nameArabic
      };

  return {
    userId,
    ...identity,
    count,
    targetCount: item.target,
    date,
    source: "manual",
    isCompleted: count >= item.target,
    ...buildVirdLogFields(program, item, dayIndex)
  };
}
