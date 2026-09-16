import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import * as Location from "expo-location";
import { useVirdStore } from "../../../store/vird-store";
import { syncVirdReminders } from "../services/vird-reminder-notifications";
import type { VirdDayProgramLike } from "../services/vird-day";

function round3(value: number): number {
  return Math.round(value * 1000) / 1000;
}

/**
 * `app/_layout.tsx`'e mount edilmiştir (`useEventNotificationSync()`'in
 * yanına, bkz. notifications/hooks/use-event-notification-sync.ts).
 *
 * Aktif vird programı + reminderPrefs + dayProgress store'dan okunur; bunlar
 * değiştiğinde VE uygulama arka plandan öne geldiğinde (AppState 'active')
 * syncVirdReminders'ı tetikler. Desen use-event-notification-sync.ts ile
 * birebir aynıdır (idempotent resync, izin YOKSA prompt göstermez —
 * requestPermission: false, sessizce mevcut zamanlamaya dokunmaz).
 *
 * FAZ C: ayrıca mount + foreground'da konumu SESSİZCE tazeler (izin zaten
 * verilmişse) — burada ASLA izin istemi açılmaz, o yalnızca ayar kartındaki
 * "Konumu kullan" butonundan tetiklenir (bkz. vird-reminder-settings.tsx).
 */
export function useVirdReminderSync(): void {
  const appState = useRef(AppState.currentState);

  const activeProgram = useVirdStore((state) => state.programs.find((program) => program.id === state.activeProgramId) ?? null);
  const reminderPrefs = useVirdStore((state) => state.reminderPrefs);
  const dayProgress = useVirdStore((state) => state.dayProgress);
  const setReminderPrefs = useVirdStore((state) => state.setReminderPrefs);

  // activeProgram referansı yalnızca store'daki ilgili program gerçekten
  // değiştiğinde değişir (bkz. vird-store.ts upsertProgram/replaceFromServer);
  // burada useMemo, syncVirdReminders'ın HER render'da değil yalnızca gerçek
  // bir değişiklikte tetiklenmesini garanti eder (yeni bir object literal her
  // render'da effect'i gereksiz yere tetiklemesin diye).
  const programForScheduling = useMemo<VirdDayProgramLike | null>(() => {
    if (!activeProgram) {
      return null;
    }
    return {
      startDate: activeProgram.startDate,
      phases: activeProgram.phases,
      prayerSelection: activeProgram.prayerSelection
    };
  }, [activeProgram]);

  useEffect(() => {
    void syncVirdReminders({
      program: programForScheduling,
      reminderPrefs,
      dayProgress,
      requestPermission: false
    }).catch(() => {});

    void refreshCoords();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        void syncVirdReminders({
          program: programForScheduling,
          reminderPrefs,
          dayProgress,
          requestPermission: false
        }).catch(() => {});
        void refreshCoords();
      }
    });

    return () => subscription.remove();
  }, [programForScheduling, reminderPrefs, dayProgress]);

  async function refreshCoords(): Promise<void> {
    if (!reminderPrefs.enabled) {
      return;
    }
    try {
      const permission = await Location.getForegroundPermissionsAsync();
      if (!permission.granted) {
        return;
      }

      const position = (await Location.getLastKnownPositionAsync()) ?? (await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Low }));
      if (!position) {
        return;
      }

      const next = { lat: round3(position.coords.latitude), lng: round3(position.coords.longitude) };
      const current = useVirdStore.getState().reminderPrefs.coords;
      if (!current || current.lat !== next.lat || current.lng !== next.lng) {
        setReminderPrefs({ coords: next });
      }
    } catch {
      // Konum alınamazsa sessizce mevcut hatırlatma tercihine dokunma
      // (sabit saat tablosuna düşülür, bkz. prayer-times.ts).
    }
  }
}
