import { useEffect, useState } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { listDhikrLogsByUser } from "../../dhikrs/services/dhikr-logs-api-client";
import { getUserStreak } from "../services/streaks-api-client";

type DailyStatsViewModel = {
  streakDays: number;
  weeklyTotal: number;
  completionRate: number;
};

const FALLBACK_STATS: DailyStatsViewModel = {
  streakDays: 12,
  weeklyTotal: 387,
  completionRate: 83
};

export function useDailyStats(): DailyStatsViewModel {
  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const sessionAccessToken = useAuthStore((s) => s.session?.accessToken);
  const [stats, setStats] = useState<DailyStatsViewModel>(FALLBACK_STATS);

  useEffect(() => {
    if (authStatus !== "authenticated" || !sessionUserId) {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        const now = new Date();
        const weekStart = new Date(now);
        weekStart.setDate(now.getDate() - 6);

        const [streak, weeklyLogs] = await Promise.all([
          getUserStreak(sessionUserId, sessionAccessToken),
          listDhikrLogsByUser(
            sessionUserId,
            toDateKey(weekStart),
            toDateKey(now),
            sessionAccessToken
          )
        ]);

        if (isCancelled) {
          return;
        }

        const weeklyTotal = weeklyLogs.reduce((sum, item) => sum + item.count, 0);
        const completionRate =
          weeklyLogs.length === 0
            ? 0
            : Math.round(
                (weeklyLogs.reduce((sum, item) => sum + (item.isCompleted ? 1 : 0), 0) / weeklyLogs.length) * 100
              );

        setStats({
          streakDays: streak.currentStreak ?? 0,
          weeklyTotal,
          completionRate
        });
      } catch {
        if (!isCancelled) {
          setStats(FALLBACK_STATS);
        }
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, sessionAccessToken, sessionUserId]);

  return stats;
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
