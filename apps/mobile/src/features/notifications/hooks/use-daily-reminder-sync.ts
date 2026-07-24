import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useProfileStore } from "../../../store/profile-store";
import { syncDailyReminderNotification } from "../../profile/services/daily-reminder-notifications";

// Root-mounted (see app/_layout.tsx). Günlük hatırlatma bildirimi kullanıcı
// tercihine (dailyReminderEnabled + reminderTime) bağlıdır; zamanlamayı belirli
// bir ekrana (eskiden Profil ekranı) değil uygulama köküne bağlarız. Böylece
// Profil ekranına hiç girilmese de tercihler her zaman OS ile senkron kalır:
//  - app open / tercih değişimi: effect çalışır -> idempotent resync
//  - foreground: kullanıcı OS'ta izni açıp uygulamaya döndüğünde yeniden dener
// İzin yoksa servis (enabled iken) mevcut zamanlamaya dokunmadan çıkar; tercih
// yalnızca kullanıcı değiştirince değişir (requestPermission: false).
export function useDailyReminderSync() {
  const enabled = useProfileStore((s) => s.dailyReminderEnabled);
  const reminderTime = useProfileStore((s) => s.reminderTime);
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    const run = () =>
      void syncDailyReminderNotification({
        enabled,
        reminderTime,
        requestPermission: false
      }).catch(() => {});

    run();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        run();
      }
    });

    return () => subscription.remove();
  }, [enabled, reminderTime]);
}
