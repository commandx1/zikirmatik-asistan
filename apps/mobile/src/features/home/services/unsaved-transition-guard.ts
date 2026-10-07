type UnsavedTransitionInput = {
  selectedDhikrId: string;
  targetDhikrId?: string;
  unsavedProgressDhikrIds: string[];
  hasUnsavedFreeMode?: boolean;
  isLeavingFreeMode?: boolean;
  /** Seçili zikrin / serbest modun şu anki sayımı (M-04: 0'da uyarı yok). */
  currentCount?: number;
  /** M-03: yerel kayıt misafirde "kaydedildi" sayılır — uyarı yalnız üyede. Verilmezse üye varsayılır. */
  isMember?: boolean;
};

export function shouldConfirmUnsavedDhikrTransition(input: UnsavedTransitionInput) {
  if (input.isMember === false || (input.currentCount !== undefined && input.currentCount <= 0)) {
    return false;
  }

  if (!input.selectedDhikrId) {
    return Boolean(input.hasUnsavedFreeMode && input.isLeavingFreeMode);
  }

  if (input.targetDhikrId && input.targetDhikrId === input.selectedDhikrId) {
    return false;
  }

  return input.unsavedProgressDhikrIds.includes(input.selectedDhikrId);
}

/** Aktif sayaçta kaydedilmemiş ilerleme var mı (karşılama/meşgul kararı için) — üye + sayım > 0. */
export function hasUnsavedActiveProgress(input: {
  selectedDhikrId: string;
  unsavedProgressDhikrIds: string[];
  currentCount: number;
  isMember: boolean;
}) {
  if (!input.isMember || input.currentCount <= 0) {
    return false;
  }
  return input.selectedDhikrId ? input.unsavedProgressDhikrIds.includes(input.selectedDhikrId) : true;
}
