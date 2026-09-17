import { useCircleStore } from "./circle-store";
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
  // signInWithProvider (previousUserId !== session.userId dalı).
  useVirdStore.getState().resetVird();
  // vird-store ile aynı gerekçe: halka üyeliği kullanıcıya özel, signOut'ta
  // (ya da farklı kullanıcıya geçişte) sıfırlanmalı.
  useCircleStore.getState().resetCircles();
}
