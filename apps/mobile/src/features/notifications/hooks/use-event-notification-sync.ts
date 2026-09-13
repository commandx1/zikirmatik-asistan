import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { resolveServerPushActive, syncEventNotifications } from "../services/event-notifications";
import { usePushRegistrationStore } from "../../../store/push-registration-store";
import { useAppConfigStore } from "../../../store/app-config-store";

// Root-mounted (see app/_layout.tsx). Cuma + özel gün bildirimleri tamamen
// lokaldir ve tercihe bağlı DEĞİLDİR; bu yüzden zamanlamayı belirli bir ekrana
// (eskiden Profil ekranı) değil uygulama köküne bağlarız. Böylece kullanıcı
// Profil ekranına hiç girmese bile bildirimler zamanlanır:
//  - app open: effect mount'ta bir kez çalışır -> idempotent resync
//  - foreground: kullanıcı OS'ta izni açıp uygulamaya döndüğünde yeniden dener
//  - registered veya serverPushEnabled değiştiğinde (push kaydı sonradan
//    tamamlanır/logout olur, ya da sunucunun rollout bayrağı açılır/kapanır):
//    resync tekrar tetiklenir, özel gün zamanlaması buna göre kurulur ya da
//    iptal edilir.
// İzin yoksa servis mevcut zamanlamaya dokunmadan sessizce çıkar; kullanıcıya
// prompt gösterilmez (requestPermission: false).
//
// syncEventNotifications'a geçirilen serverPushActive = registered (bu
// cihazın sunucu push kaydı, push-registration-store.ts) && serverPushEnabled
// (sunucunun rollout bayrağı, app-config-store.ts — bkz.
// resolveServerPushActive, event-notifications.ts). Sunucu push hattı
// üretimde devreye alınana kadar (SERVER_PUSH_ENABLED=1, bkz.
// apps/api/docs/notification-campaigns-runbook.md "Devreye alma sırası")
// serverPushEnabled varsayılan false'dur, dolayısıyla kayıt başarılı olsa
// bile yerel zamanlama aynen sürer.
export function useEventNotificationSync() {
  const appState = useRef(AppState.currentState);
  const registered = usePushRegistrationStore((state) => state.serverPushActive);
  const serverPushEnabled = useAppConfigStore((state) => state.serverPushEnabled);
  const serverPushActive = resolveServerPushActive(registered, serverPushEnabled);

  useEffect(() => {
    void syncEventNotifications({ requestPermission: false, serverPushActive }).catch(() => {});

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        void syncEventNotifications({ requestPermission: false, serverPushActive }).catch(() => {});
      }
    });

    return () => subscription.remove();
  }, [registered, serverPushEnabled]);
}
