import { useEffect, useMemo, useRef } from "react";
import { AppState } from "react-native";
import { useVirdStore } from "../../../store/vird-store";
import { syncVirdReminders } from "../services/vird-reminder-notifications";
import type { VirdDayProgramLike } from "../services/vird-day";

/**
 * ⚠️ HENÜZ HİÇBİR YERE MOUNT EDİLMEDİ. Bir sonraki worker bunu kök bileşene
 * (app/_layout.tsx — `useEventNotificationSync()`'in zaten mount edildiği
 * yere, bkz. notifications/hooks/use-event-notification-sync.ts) eklemelidir.
 * Bu görevin kapsamı yalnızca hook'un kendisidir; UI/mount noktası dahil değil
 * (bkz. features/vird/README.md "Sonraki worker için" bölümü).
 *
 * Aktif vird programı + reminderPrefs + dayProgress store'dan okunur; bunlar
 * değiştiğinde VE uygulama arka plandan öne geldiğinde (AppState 'active')
 * syncVirdReminders'ı tetikler. Desen use-event-notification-sync.ts ile
 * birebir aynıdır (idempotent resync, izin YOKSA prompt göstermez —
 * requestPermission: false, sessizce mevcut zamanlamaya dokunmaz).
 */
export function useVirdReminderSync(): void {
  const appState = useRef(AppState.currentState);

  const activeProgram = useVirdStore((state) => state.programs.find((program) => program.id === state.activeProgramId) ?? null);
  const reminderPrefs = useVirdStore((state) => state.reminderPrefs);
  const dayProgress = useVirdStore((state) => state.dayProgress);

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
      }
    });

    return () => subscription.remove();
  }, [programForScheduling, reminderPrefs, dayProgress]);
}
