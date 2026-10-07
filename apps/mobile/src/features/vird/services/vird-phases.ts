// Manuel vird fazlarının istemci doğrulaması — apps/api/src/modules/vird/utils/
// vird-phases.ts findManualPhasesError ile AYNI kurallar (A-24): 1. günden
// başla, boşluk/çakışma yok, bitiş >= başlangıç; toDay null = sonraki fazın
// başlangıcına (sonuncuysa açık uçlu) kadar. Sunucu 400 VIRD_PHASES_INVALID
// döner; bu fonksiyon aynı hatayı istek atmadan yakalar.
import type { VirdPhase } from "../types";

export type PhasesError = "start" | "gap_or_overlap" | "end_before_start";

export function findPhasesError(phases: Pick<VirdPhase, "fromDay" | "toDay">[]): PhasesError | null {
  const sorted = [...phases].sort((a, b) => a.fromDay - b.fromDay);
  let expectedFrom = 1;
  for (const [index, phase] of sorted.entries()) {
    if (phase.fromDay !== expectedFrom) {
      return index === 0 ? "start" : "gap_or_overlap";
    }
    const next = sorted[index + 1];
    const toDay = phase.toDay ?? (next ? next.fromDay - 1 : null);
    if (toDay === null) {
      return null;
    }
    if (toDay < phase.fromDay) {
      return "end_before_start";
    }
    expectedFrom = toDay + 1;
  }
  return null;
}
