// Bir vird programının `dhikrs` (ref -> DhikrSnapshot) denormalizasyonundaki
// eksik girdileri doldurmak için saf planlama + saf eşleyiciler. Ağ çağrısı
// (katalog listesi) ÇAĞIRAN tarafta yapılır (bkz. hooks/use-hydrate-vird-
// snapshots.ts) — bu dosya kasıtlı olarak side-effect'sizdir (test edilebilirlik).
// Bkz. features/vird/README.md: sunucu-only bir program için `dhikrs` boş
// gelir (toLocalVirdProgram) — bu, todays-vird-card.tsx ve vird-setup-panel'in
// vird:home.itemFallbackName yer tutucusuna düşmesine sebep olan durumdur.
import type { BackendDhikr } from "../../dhikrs/services/dhikrs-api-client";
import type { ZikirItem } from "../../focus/types";
import type { DhikrSnapshot, VirdProgramLocal } from "../types";
import { resolveDhikrRef } from "./vird-day";

export type VirdSnapshotHydrationPlan = {
  /** dhikrId referansları — katalogdan (listVerifiedActiveDhikrs) çözülmeli. */
  missingCatalogRefs: string[];
  /** customDhikrId referansları — kişisel zikir store'undan (dhikr-store items) çözülmeli. */
  missingCustomRefs: string[];
};

/**
 * Bir programın fazlarında kullanılan ama `dhikrs` haritasında henüz
 * karşılığı olmayan referansları listeler (TÜM fazlar taranır, yalnız bugünkü
 * değil — bkz. services/vird-day.ts expectedItemsForDay ile karıştırma).
 * Referanslar `item.dhikrId`/`item.customDhikrId` alanına göre kesin olarak
 * (ObjectId biçimi TAHMİN edilmeden) iki listeye ayrılır.
 */
export function planVirdSnapshotHydration(
  program: Pick<VirdProgramLocal, "phases" | "dhikrs">
): VirdSnapshotHydrationPlan {
  const missingCatalogRefs = new Set<string>();
  const missingCustomRefs = new Set<string>();

  for (const phase of program.phases) {
    for (const items of Object.values(phase.slots)) {
      for (const item of items ?? []) {
        const ref = resolveDhikrRef(item);
        if (!ref || program.dhikrs[ref]) {
          continue;
        }

        if (item.dhikrId) {
          missingCatalogRefs.add(ref);
        } else if (item.customDhikrId) {
          missingCustomRefs.add(ref);
        }
      }
    }
  }

  return {
    missingCatalogRefs: Array.from(missingCatalogRefs),
    missingCustomRefs: Array.from(missingCustomRefs)
  };
}

export function buildDhikrSnapshotFromCatalog(dhikr: BackendDhikr): DhikrSnapshot {
  return {
    ref: dhikr._id,
    isCustom: false,
    name: dhikr.name,
    nameArabic: dhikr.nameArabic,
    transliteration: dhikr.transliteration,
    meaning: dhikr.meaning
  };
}

export function buildDhikrSnapshotFromPersonal(
  item: Pick<ZikirItem, "id" | "name" | "arabic" | "transliteration" | "meaning">
): DhikrSnapshot {
  return {
    ref: item.id,
    isCustom: true,
    name: item.name,
    nameArabic: item.arabic,
    transliteration: item.transliteration,
    meaning: item.meaning
  };
}

/**
 * `newSnapshots`i programın `dhikrs`sine birleştirir. Eklenecek yeni bir şey
 * yoksa (boş obje) programı AYNI referansla döner — çağıran taraf bunu
 * "değişiklik yok, upsertProgram'ı atla" sinyali olarak kullanabilir.
 */
export function applyHydratedSnapshots(
  program: VirdProgramLocal,
  newSnapshots: Record<string, DhikrSnapshot>
): VirdProgramLocal {
  if (Object.keys(newSnapshots).length === 0) {
    return program;
  }

  return {
    ...program,
    dhikrs: { ...program.dhikrs, ...newSnapshots }
  };
}
