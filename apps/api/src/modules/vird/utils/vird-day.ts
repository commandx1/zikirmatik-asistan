import type { VirdProgramPhase } from '../schemas/vird-program.schema';
import {
  buildVirdItemKey,
  resolveDhikrRef,
  VIRD_SLOT_KEYS,
  type VirdSlotKey,
} from '../vird.types';

/** dayIndexFor/phaseForDay/expectedItemsForDay'in ihtiyaç duyduğu minimal
 * program şekli — hem hydrated hem lean VirdProgram belgeleriyle uyumludur. */
export type VirdDayProgramLike = {
  startDate: string;
  phases: VirdProgramPhase[];
  prayerSelection?: number[];
};

export type ExpectedVirdItem = {
  itemKey: string;
  slot: VirdSlotKey;
  prayerIndex: number | null;
  dhikrId?: string;
  customDhikrId?: string;
  target: number;
};

/** İki YYYY-MM-DD anahtarı arasındaki gün farkı (toKey - fromKey), timezone
 * bağımsız (UTC epoch üzerinden, common/utils/date-keys.ts ile aynı yaklaşım). */
export function daysBetween(fromKey: string, toKey: string): number {
  const [fy, fm, fd] = fromKey.split('-').map(Number);
  const [ty, tm, td] = toKey.split('-').map(Number);
  const fromUtc = Date.UTC(fy, fm - 1, fd);
  const toUtc = Date.UTC(ty, tm - 1, td);
  return Math.round((toUtc - fromUtc) / 86_400_000);
}

/** Programın başlangıcına göre 1 tabanlı gün indeksi (startDate = gün 1).
 * date, startDate'ten önceyse 1'den küçük/negatif bir değer döner — bu durumda
 * phaseForDay hiçbir fazı eşleştirmez (fromDay >= 1 olduğu için). */
export function dayIndexFor(program: VirdDayProgramLike, date: string): number {
  return daysBetween(program.startDate, date) + 1;
}

export function phaseForDay(
  program: VirdDayProgramLike,
  dayIndex: number,
): VirdProgramPhase | undefined {
  return program.phases.find(
    (phase) =>
      dayIndex >= phase.fromDay &&
      (phase.toDay == null || dayIndex <= phase.toDay),
  );
}

/**
 * O gün için açılmış (prayerSelection'a göre genişletilmiş) beklenen item
 * listesi. `prayer` dilimindeki her item, prayerSelection'daki her vakit için
 * ayrı bir beklenen item üretir; diğer dilimler olduğu gibi bir item üretir.
 * O gün için tanımlı bir faz yoksa (ör. journey programı henüz başlamadıysa
 * veya dayCount'u aştıysa) boş liste döner.
 */
export function expectedItemsForDay(
  program: VirdDayProgramLike,
  dayIndex: number,
): ExpectedVirdItem[] {
  const phase = phaseForDay(program, dayIndex);
  if (!phase) {
    return [];
  }

  const prayerSelection =
    program.prayerSelection && program.prayerSelection.length > 0
      ? program.prayerSelection
      : [1, 2, 3, 4, 5];

  const expected: ExpectedVirdItem[] = [];

  for (const slot of VIRD_SLOT_KEYS) {
    const items = phase.slots?.[slot];
    if (!items || items.length === 0) {
      continue;
    }

    for (const item of items) {
      const dhikrRef = resolveDhikrRef(item);
      if (!dhikrRef) {
        continue;
      }
      const dhikrId = item.dhikrId ? item.dhikrId.toString() : undefined;

      if (slot === 'prayer') {
        for (const prayerIndex of prayerSelection) {
          expected.push({
            itemKey: buildVirdItemKey(slot, prayerIndex, dhikrRef),
            slot,
            prayerIndex,
            dhikrId,
            customDhikrId: item.customDhikrId,
            target: item.target,
          });
        }
      } else {
        expected.push({
          itemKey: buildVirdItemKey(slot, null, dhikrRef),
          slot,
          prayerIndex: null,
          dhikrId,
          customDhikrId: item.customDhikrId,
          target: item.target,
        });
      }
    }
  }

  return expected;
}

/**
 * Beklenen item'ların tümü count >= target olunca gün tamamlanmış sayılır.
 * Beklenen item yoksa (o gün için tanımlı faz/slot yoksa) tamamlanmış
 * SAYILMAZ — boş bir günü "tamamlandı" göstermek seri/rozet enflasyonuna
 * yol açardı.
 */
export function isDayComplete(
  expectedItems: ExpectedVirdItem[],
  countByItemKey: Map<string, number>,
): boolean {
  if (expectedItems.length === 0) {
    return false;
  }
  return expectedItems.every(
    (item) => (countByItemKey.get(item.itemKey) ?? 0) >= item.target,
  );
}
