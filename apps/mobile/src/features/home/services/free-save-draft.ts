/** Sunucunun tek kayıt / kişisel zikir hedefi tavanı (API MAX_LOG_COUNT, karar A-02). */
export const MAX_DHIKR_TARGET = 100_000;

export type FreeSaveDraftResult =
  | { ok: true; name: string; target: number }
  | { ok: false; error: "nameRequired" | "targetInvalid" };

/** Serbest mod "kaydet" formu: ad zorunlu; hedef boş = sınırsız (0), doldurulduysa >= 1. */
export function validateFreeSaveDraft(draft: { name: string; target: string }): FreeSaveDraftResult {
  const name = draft.name.trim();
  if (!name) {
    return { ok: false, error: "nameRequired" };
  }
  const targetText = draft.target.trim();
  if (targetText.length === 0) {
    return { ok: true, name, target: 0 };
  }
  const parsed = Number.parseInt(targetText, 10);
  if (!Number.isFinite(parsed) || parsed <= 0 || parsed > MAX_DHIKR_TARGET) {
    return { ok: false, error: "targetInvalid" };
  }
  return { ok: true, name, target: parsed };
}

/** B-49: aynı formun hızlı çift gönderimi tek zikir oluştursun — `enter()` yalnız ilk çağrıda true. */
export function createOnceGate() {
  let locked = false;
  return {
    enter() {
      if (locked) return false;
      locked = true;
      return true;
    },
    release() {
      locked = false;
    }
  };
}
