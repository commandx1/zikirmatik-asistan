import { useCallback, useEffect, useMemo, useState } from "react";
import { HERO_CARD, UPCOMING_DAYS } from "../data/special-days-content";
import type {
  HeroCardViewModel,
  TodayActionViewModel,
  UpcomingDayViewModel,
} from "../types/view-model";
import {
  getSpecialDaysHome,
  SpecialDaysApiError,
  type BackendSpecialDayHomeItem,
} from "../services/special-days-api-client";
import { useProfileStore } from "../../../store/profile-store";
import { useAuthStore } from "../../../store/auth-store";

export function useSpecialDays() {
  const [heroCard, setHeroCard] = useState<HeroCardViewModel>(HERO_CARD);
  const [todayAction, setTodayAction] = useState<TodayActionViewModel | null>(null);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDayViewModel[]>(UPCOMING_DAYS);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>();

  const notificationsEnabled = useProfileStore((s) => s.kandilNotificationsEnabled);
  const setKandilNotificationsEnabled = useProfileStore((s) => s.setKandilNotificationsEnabled);
  const authStatus = useAuthStore((s) => s.status);
  const userId = useAuthStore((s) => s.session?.userId);
  const accessToken = useAuthStore((s) => s.session?.accessToken);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(undefined);
    try {
      const response = await getSpecialDaysHome(
        toDateKey(new Date()),
        authStatus === "authenticated" ? userId : undefined,
        accessToken,
      );
      if (response.hero) {
        setHeroCard({
          id: response.hero.id,
          badge: response.hero.badge,
          title: response.hero.name,
          dateLabel: response.hero.dateLabel,
          countdown: response.hero.countdown,
          remaining: response.hero.remainingLabel,
          isLocked: response.hero.isLocked,
        });
      }

      setTodayAction(response.action);
      setUpcomingDays(response.upcoming.map(mapUpcomingDay));
    } catch (error) {
      setError(error instanceof SpecialDaysApiError ? error.message : "Özel gün verisi alınamadı.");
    } finally {
      setIsLoading(false);
    }
  }, [accessToken, authStatus, userId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const hasUpcomingItems = useMemo(() => upcomingDays.length > 0, [upcomingDays]);

  return {
    notificationsEnabled,
    setNotificationsEnabled: setKandilNotificationsEnabled,
    heroCard,
    todayAction,
    upcomingDays,
    hasUpcomingItems,
    isLoading,
    error,
    refresh,
  };
}

function mapUpcomingDay(item: BackendSpecialDayHomeItem & { remainingLabel: string }): UpcomingDayViewModel {
  const icon = item.type === "bayram" ? "mosque" : item.type === "ramazan" ? "star" : "moon";
  return {
    id: item.id,
    icon,
    title: item.name,
    dateLabel: formatDayLabel(item.date),
    remaining: item.remainingLabel,
    isLocked: item.isLocked,
  };
}

function formatDayLabel(isoDate: string) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const formatter = new Intl.DateTimeFormat("tr-TR", {
    day: "numeric",
    month: "long",
  });
  return formatter.format(date);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
