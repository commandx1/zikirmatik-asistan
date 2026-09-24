import AsyncStorage from "@react-native-async-storage/async-storage";
import { aiGuideLastKey } from "../lib/storage/keys";
import { useBadgeCelebrationStore } from "./badge-celebration-store";
import { useCircleStore } from "./circle-store";
import { useDhikrStore } from "./dhikr-store";
import { useOnboardingStore } from "./onboarding-store";
import { useProfileStore } from "./profile-store";
import { useStreakReminderStore } from "./streak-reminder-store";
import { useVirdStore } from "./vird-store";

export function resetSessionScopedStores(previousUserId?: string) {
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
  // Rozet kutlamaları ve seri hatırlatma tercihi de kullanıcıya özel: bir
  // sonraki kullanıcı öncekinin "zaten kutlandı" listesini ya da hatırlatma
  // tercihini görmemeli.
  useBadgeCelebrationStore.setState({ hasSeeded: false, celebratedBadgeKeys: [] });
  useStreakReminderStore.setState({ streakReminderEnabled: false });

  // AI Rehber'in "son cevap" önbelleği kullanıcıya özel bir AsyncStorage
  // anahtarında tutulur (persist dışı, bkz. lib/storage/keys.ts). Bir sonraki
  // kullanıcı öncekinin önbelleğini görmesin diye ÇIKAN kullanıcının anahtarı
  // silinir. previousUserId parametresi, session state'i temizlenmeden ÖNCE
  // çağıran taraftan (auth-store) geçirilir.
  if (previousUserId) {
    void AsyncStorage.removeItem(aiGuideLastKey(previousUserId)).catch(() => {});
  }
}
