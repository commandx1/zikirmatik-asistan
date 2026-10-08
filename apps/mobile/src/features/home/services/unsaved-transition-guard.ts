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
  if (input.currentCount !== undefined && input.currentCount <= 0) {
    return false;
  }

  // M-03: a guest's local save counts as saved for a dhikr, but a free-mode count is not a saved dhikr.
  if (input.isMember === false && input.selectedDhikrId) {
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

/**
 * MOB-KOL-04 / B-47: koleksiyondaki "Kaydet ve devam" nereye gider?
 * Serbest mod (seçili zikir yok) önce ad formu ister — ana sayfadaki akış;
 * seçili zikir doğrudan log olarak kaydedilir; oturumsuz seçili zikir giriş ister.
 */
export function resolveCollectionSaveRoute(input: {
  hasSelectedDhikr: boolean;
  freeModeCount: number;
  isMember: boolean;
}): "free-save-form" | "save-log" | "login-required" {
  if (!input.hasSelectedDhikr) {
    return input.freeModeCount > 0 ? "free-save-form" : "login-required";
  }
  return input.isMember ? "save-log" : "login-required";
}
