// Bir vird programının `dhikrs` denormalizasyonundaki eksik ref'lerini tembel
// (lazy) olarak doldurur: dhikrId ref'leri için listVerifiedActiveDhikrs
// (katalog), customDhikrId ref'leri için dhikr-store'daki kişisel zikirler
// kullanılır — bkz. services/vird-snapshots.ts (saf planlama/eşleme).
// use-vird-backend-sync.ts'e KASITLI olarak dokunulmadı (bkz. görev notu) —
// bu hook yalnızca GÖRÜNÜR bileşenlerden (vird-setup-panel, todays-vird-card)
// programId mount/değişim anında çağrılır, sunucu senkron akışının bir
// parçası DEĞİLDİR.
import { useEffect, useMemo } from "react";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useVirdStore } from "../../../store/vird-store";
import { listVerifiedActiveDhikrs } from "../../dhikrs/services/dhikrs-api-client";
import {
  applyHydratedSnapshots,
  buildDhikrSnapshotFromCatalog,
  buildDhikrSnapshotFromPersonal,
  planVirdSnapshotHydration
} from "../services/vird-snapshots";
import type { DhikrSnapshot } from "../types";

export function useHydrateVirdSnapshots(programId: string | null | undefined): void {
  const program = useVirdStore((state) =>
    programId ? state.programs.find((candidate) => candidate.id === programId) : undefined
  );
  const upsertProgram = useVirdStore((state) => state.upsertProgram);
  const personalItems = useDhikrStore((state) => state.items);

  const plan = useMemo(() => (program ? planVirdSnapshotHydration(program) : null), [program]);

  useEffect(() => {
    if (!program || !plan) {
      return;
    }
    if (plan.missingCatalogRefs.length === 0 && plan.missingCustomRefs.length === 0) {
      return;
    }

    let isCancelled = false;

    void (async () => {
      const newSnapshots: Record<string, DhikrSnapshot> = {};

      for (const ref of plan.missingCustomRefs) {
        const item = personalItems.find((candidate) => candidate.id === ref);
        if (item) {
          newSnapshots[ref] = buildDhikrSnapshotFromPersonal(item);
        }
      }

      if (plan.missingCatalogRefs.length > 0) {
        try {
          const catalog = await listVerifiedActiveDhikrs();
          const byId = new Map(catalog.map((dhikr) => [dhikr._id, dhikr]));
          for (const ref of plan.missingCatalogRefs) {
            const dhikr = byId.get(ref);
            if (dhikr) {
              newSnapshots[ref] = buildDhikrSnapshotFromCatalog(dhikr);
            }
          }
        } catch {
          // Best-effort: katalog şu an ulaşılamazsa eksik ref'ler bir sonraki
          // çağrıda (yeniden mount, yeni programId) tekrar denenir.
        }
      }

      if (isCancelled) {
        return;
      }

      const updated = applyHydratedSnapshots(program, newSnapshots);
      if (updated !== program) {
        upsertProgram(updated);
      }
    })();

    return () => {
      isCancelled = true;
    };
    // personalItems bilinçli olarak dışarıda bırakıldı: dhikr-store.ts'teki
    // `items` dizisi her sayaç artışında yeni bir referans alır (bkz.
    // incrementSelected) — bunu bağımlılığa eklemek her sayaç tıklamasında
    // gereksiz bir hidrasyon denemesi tetikler. Kişisel zikir listesi
    // değişimleri bir sonraki mount/programId değişiminde zaten yeniden ele alınır.
  }, [program, plan, upsertProgram]);
}
