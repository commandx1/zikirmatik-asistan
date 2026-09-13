import { useDhikrStore } from "./dhikr-store";
import { useOnboardingStore } from "./onboarding-store";
import { useProfileStore } from "./profile-store";
import { useVirdStore } from "./vird-store";

export function resetSessionScopedStores() {
  useOnboardingStore.getState().resetOnboarding();
  useProfileStore.getState().resetSessionScoped();
  useDhikrStore.getState().resetSessionScoped();
  // dhikr-store ile aynı desen: misafir verisi guest->üye göçünde (bu
  // fonksiyon O YOLDA ÇAĞRILMAZ) korunur, ama gerçek signOut()'ta (ya da
  // farklı bir kullanıcıya geçişte) dhikr-store'un items'ı gibi vird
  // programları/ilerlemesi de sıfırlanır — bkz. auth-store.ts signOut /
  // signInWithRequiredProvider (previousUserId !== session.userId dalı).
  useVirdStore.getState().resetVird();
}
