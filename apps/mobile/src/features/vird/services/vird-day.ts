// Saf (side-effect'siz) vird gün algoritması. apps/api/src/modules/vird/
// utils/vird-day.ts + vird.types.ts (buildVirdItemKey/resolveDhikrRef/
// VIRD_SLOT_KEYS) ile KASITLI OLARAK aynı mantığı taşır — sunucu ile mobil
// aynı dhikrRef/itemKey için her zaman aynı sonucu üretmelidir (aksi halde
// bir programın sunucu ve cihaz arasındaki "tamamlandı" durumu ayrışır).
// API kendi kopyasını tutar (mongoose ObjectId / ayrı derleme hedefi
// gerekçesiyle, bkz. packages/shared/src/types/vird.ts dosya başı notu);
// mobil de aynı nedenle burada kendi (ObjectId'siz, salt string) kopyasını
// tutar — bilerek @zikirmatik/shared'e taşınmadı.
import type {
  VirdDayItemProgress,
  VirdDayProgressMap,
  VirdItem,
  VirdPhase,
  VirdSlotKey
} from "../types";

export const VIRD_SLOT_KEYS: readonly VirdSlotKey[] = ["morning", "prayer", "evening", "night", "free"];

/** dayIndexFor/phaseForDay/expectedItemsForDay'in ihtiyaç duyduğu minimal
 * program şekli — hem VirdProgramLocal hem ham sunucu VirdProgram'ıyla uyumlu. */
export type VirdDayProgramLike = {
  startDate: string;
  phases: VirdPhase[];
  prayerSelection?: number[];
};

export type ExpectedVirdItem = {
  itemKey: string;
  slot: VirdSlotKey;
  prayerIndex: number | null;
  /** dhikrId ?? customDhikrId (bkz. resolveDhikrRef). */
  ref: string;
  target: number;
};

export type VirdSlotProgressView = {
  /** Tamamlanmış (count >= target) item sayısı. */
  done: number;
  /** Beklenen toplam item sayısı. */
  total: number;
  items: Array<ExpectedVirdItem & { count: number; completed: boolean }>;
};

/**
 * dhikrId (varsa) veya customDhikrId alanından kararlı bir referans metni
 * üretir — item key'lerinde ve ilerleme eşlemesinde kullanılır. API'deki
 * resolveDhikrRef ile aynı öncelik sırası (dhikrId önce), tek fark: burada
 * dhikrId zaten string (ObjectId dönüşümüne gerek yok).
 */
export function resolveDhikrRef(item: Pick<VirdItem, "dhikrId" | "customDhikrId">): string | undefined {
  if (item.dhikrId) {
    return item.dhikrId;
  }
  if (item.customDhikrId) {
    return item.customDhikrId;
  }
  return undefined;
}

/**
 * Bir vird item'ının tekil kimliği. Biçim API ile BİREBİR aynı olmalı:
 * `${slot}:${prayerIndex ?? 0}:${dhikrRef}` (bkz. vird.types.ts buildVirdItemKey).
 */
export function buildVirdItemKey(slot: VirdSlotKey, prayerIndex: number | null | undefined, ref: string): string {
  return `${slot}:${prayerIndex ?? 0}:${ref}`;
}

/** İki YYYY-MM-DD anahtarı arasındaki gün farkı (toKey - fromKey), timezone
 * bağımsız (UTC epoch üzerinden) — API'deki daysBetween ile aynı algoritma. */
export function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split("-").map(Number);
  const [ty, tm, td] = toKey.split("-").map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** Programın başlangıcına göre 1 tabanlı gün indeksi (startDate = gün 1).
 * date, startDate'ten önceyse 1'den küçük/negatif bir değer döner. */
export function dayIndexFor(program: VirdDayProgramLike, dateKey: string): number {
  return daysBetween(program.startDate, dateKey) + 1;
}

export function phaseForDay(program: VirdDayProgramLike, dayIndex: number): VirdPhase | undefined {
  return program.phases.find((phase) => dayIndex >= phase.fromDay && (phase.toDay == null || dayIndex <= phase.toDay));
}

/**
 * O gün için açılmış (prayerSelection'a göre genişletilmiş) beklenen item
 * listesi. `prayer` dilimindeki her item, prayerSelection'daki her vakit için
 * ayrı bir beklenen item üretir; diğer dilimler olduğu gibi bir item üretir.
 * O gün için tanımlı bir faz yoksa boş liste döner.
 */
export function expectedItemsForDay(program: VirdDayProgramLike, dayIndex: number): ExpectedVirdItem[] {
  const phase = phaseForDay(program, dayIndex);
  if (!phase) {
    return [];
  }

  const prayerSelection = program.prayerSelection && program.prayerSelection.length > 0 ? program.prayerSelection : [1, 2, 3, 4, 5];

  const expected: ExpectedVirdItem[] = [];

  for (const slot of VIRD_SLOT_KEYS) {
    const items = phase.slots?.[slot];
    if (!items || items.length === 0) {
      continue;
    }

    for (const item of items) {
      const ref = resolveDhikrRef(item);
      if (!ref) {
        continue;
      }

      if (slot === "prayer") {
        for (const prayerIndex of prayerSelection) {
          expected.push({
            itemKey: buildVirdItemKey(slot, prayerIndex, ref),
            slot,
            prayerIndex,
            ref,
            target: item.target
          });
        }
      } else {
        expected.push({
          itemKey: buildVirdItemKey(slot, null, ref),
          slot,
          prayerIndex: null,
          ref,
          target: item.target
        });
      }
    }
  }

  return expected;
}

/**
 * Beklenen item'ların tümü count >= target olunca gün tamamlanmış sayılır.
 * Beklenen item yoksa (o gün için tanımlı faz/slot yoksa) tamamlanmış
 * SAYILMAZ — API'deki isDayComplete ile aynı kural.
 */
export function isDayComplete(expectedItems: ExpectedVirdItem[], progress: VirdDayProgressMap | undefined): boolean {
  if (expectedItems.length === 0) {
    return false;
  }
  const map = progress ?? {};
  return expectedItems.every((item) => (map[item.itemKey]?.count ?? 0) >= item.target);
}

/**
 * Dilim başına ilerleme görünümü — `free` dahil, beklenen item'ı olmayan
 * dilimler sonuçta yer almaz (bkz. server VirdProgressService.getToday'deki
 * eşdeğer davranış, tek fark: burada `done`/`total` sayısal çift, sunucudaki
 * gibi tek bir boole değil — UI'ın "3/5" göstermesini kolaylaştırır).
 */
export function slotProgress(
  expectedItems: ExpectedVirdItem[],
  progress: VirdDayProgressMap | undefined
): Partial<Record<VirdSlotKey, VirdSlotProgressView>> {
  const map = progress ?? {};
  const result: Partial<Record<VirdSlotKey, VirdSlotProgressView>> = {};

  for (const slot of VIRD_SLOT_KEYS) {
    const slotExpected = expectedItems.filter((item) => item.slot === slot);
    if (slotExpected.length === 0) {
      continue;
    }

    const items = slotExpected.map((item) => {
      const entry: VirdDayItemProgress | undefined = map[item.itemKey];
      const count = entry?.count ?? 0;
      return { ...item, count, completed: count >= item.target };
    });

    result[slot] = {
      done: items.filter((item) => item.completed).length,
      total: items.length,
      items
    };
  }

  return result;
}
