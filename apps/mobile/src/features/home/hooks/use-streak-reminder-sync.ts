import { useEffect, useMemo } from "react";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useStreakReminderStore } from "../../../store/streak-reminder-store";
import { useProfileStore } from "../../../store/profile-store";
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
  const freeModeActivityAt = useDhikrStore((state) => state.freeModeActivityAt);
  const activeDayKeys = useDhikrStore((state) => state.activeDayKeys);
  const enabled = useStreakReminderStore((state) => state.streakReminderEnabled);
  // Notification texts come from i18n.t at schedule time: resync on language change.
  const locale = useProfileStore((s) => s.locale);

  const { currentStreak, hasCompletedToday } = useMemo(
    () => deriveStreakReminderStatus({ items, freeModeCount, freeModeActivityAt, activeDayKeys }),
    [items, freeModeCount, freeModeActivityAt, activeDayKeys]
  );

  useEffect(() => {
    void syncStreakReminderNotification({
      enabled,
      status: { currentStreak, hasCompletedToday }
    });
  }, [enabled, currentStreak, hasCompletedToday, locale]);
}
