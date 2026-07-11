import { useEffect, useMemo } from "react";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useStreakReminderStore } from "../../../store/streak-reminder-store";
import {
  deriveStreakReminderStatus,
  syncStreakReminderNotification
} from "../services/streak-reminder-notifications";

// Root-mounted (see app/_layout.tsx). Reacting to dhikr-store state gives us
// both behaviors for free without touching individual completion call sites:
// - app open: effect runs once on mount -> idempotent resync
// - dhikr completed today: items/freeModeCount change -> today's pending
//   reminder is cancelled and rescheduled for tomorrow 21:00
export function useStreakReminderSync() {
  const items = useDhikrStore((state) => state.items);
  const freeModeCount = useDhikrStore((state) => state.freeModeCount);
  const enabled = useStreakReminderStore((state) => state.streakReminderEnabled);

  const { currentStreak, hasCompletedToday } = useMemo(
    () => deriveStreakReminderStatus(items, freeModeCount),
    [items, freeModeCount]
  );

  useEffect(() => {
    void syncStreakReminderNotification({
      enabled,
      status: { currentStreak, hasCompletedToday }
    });
  }, [enabled, currentStreak, hasCompletedToday]);
}
