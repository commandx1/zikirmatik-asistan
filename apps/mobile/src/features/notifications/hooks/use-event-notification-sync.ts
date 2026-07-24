import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { syncEventNotifications } from "../services/event-notifications";

// Root-mounted (see app/_layout.tsx). Cuma + özel gün bildirimleri tamamen
// lokaldir ve tercihe bağlı DEĞİLDİR; bu yüzden zamanlamayı belirli bir ekrana
// (eskiden Profil ekranı) değil uygulama köküne bağlarız. Böylece kullanıcı
// Profil ekranına hiç girmese bile bildirimler zamanlanır:
//  - app open: effect mount'ta bir kez çalışır -> idempotent resync
//  - foreground: kullanıcı OS'ta izni açıp uygulamaya döndüğünde yeniden dener
// İzin yoksa servis mevcut zamanlamaya dokunmadan sessizce çıkar; kullanıcıya
// prompt gösterilmez (requestPermission: false).
export function useEventNotificationSync() {
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    void syncEventNotifications({ requestPermission: false }).catch(() => {});

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        void syncEventNotifications({ requestPermission: false }).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, []);
}
