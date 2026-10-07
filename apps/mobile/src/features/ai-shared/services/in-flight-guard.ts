// B-23: React state (isLoading) kredi ön kontrolü gibi bir await'ten sonra
// güncellenir; çift dokunuş araya girer. Senkron bayrak bunu kapatır.
export function createInFlightGuard() {
  let busy = false;
  return {
    /** false → zaten bir gönderim sürüyor, çağıran vazgeçmeli. */
    acquire(): boolean {
      if (busy) return false;
      busy = true;
      return true;
    },
    release() {
      busy = false;
    }
  };
}
