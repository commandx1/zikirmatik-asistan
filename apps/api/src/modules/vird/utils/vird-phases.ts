type PhaseRange = { fromDay: number; toDay?: number | null };

/**
 * Manuel gün bazlı (journey) faz kuralları — AI programıyla aynı: 1. günden
 * başlar, boşluk/çakışma yok, toDay ≥ fromDay. `toDay: null` bir sonraki faz
 * başlayana dek (son fazsa açık uçlu) sürer. Geçerliyse null, değilse
 * Türkçe hata metni döner.
 */
export function findManualPhasesError(phases: PhaseRange[]): string | null {
  const sorted = [...phases].sort((a, b) => a.fromDay - b.fromDay);
  let expectedFrom = 1;
  for (const [index, phase] of sorted.entries()) {
    if (phase.fromDay !== expectedFrom) {
      return `Fazlar 1. günden başlayıp boşluksuz ve çakışmasız ilerlemeli — beklenen başlangıç günü ${expectedFrom}, gelen ${phase.fromDay}.`;
    }
    const next = sorted[index + 1];
    const toDay = phase.toDay ?? (next ? next.fromDay - 1 : null);
    if (toDay === null) {
      return null;
    }
    if (toDay < phase.fromDay) {
      return `Faz bitiş günü (${toDay}), başlangıç gününden (${phase.fromDay}) küçük olamaz.`;
    }
    expectedFrom = toDay + 1;
  }
  return null;
}
