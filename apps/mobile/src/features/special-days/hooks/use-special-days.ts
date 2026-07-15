import { useCallback, useEffect, useMemo, useState } from "react";
import { i18n, type SupportedLocale } from "../../../i18n";
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
import { toIntlLocale } from "../../../lib/locale-format";

export function useSpecialDays() {
  const [heroCard, setHeroCard] = useState<HeroCardViewModel>(HERO_CARD);
  const [todayAction, setTodayAction] = useState<TodayActionViewModel | null>(null);
  const [upcomingDays, setUpcomingDays] = useState<UpcomingDayViewModel[]>(UPCOMING_DAYS);
  const [isLoading, setIsLoading] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
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
        const days = daysUntil(response.hero.date);
        setHeroCard({
          id: response.hero.id,
          badge: response.hero.badge,
          title: response.hero.name,
          dateLabel: response.hero.dateLabel,
          countdown: [{ value: String(days), label: i18n.t("special-days:countdown.dayUnit") }],
          remaining: formatDaysRemaining(days),
          isLocked: response.hero.isLocked,
          isTodaySpecial: response.hero.source === "today",
        });
      }

      setTodayAction(response.action);
      setUpcomingDays(response.upcoming.map((item) => mapUpcomingDay(item, useProfileStore.getState().locale)));
    } catch (error) {
      setError(error instanceof SpecialDaysApiError ? error.message : i18n.t("special-days:errors.homeLoadFailed"));
    } finally {
      setIsLoading(false);
      setHasLoadedOnce(true);
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
    hasLoadedOnce,
    error,
    refresh,
  };
}

function mapUpcomingDay(
  item: BackendSpecialDayHomeItem & { remainingLabel: string },
  locale: SupportedLocale,
): UpcomingDayViewModel {
  const icon = item.type === "bayram" ? "mosque" : item.type === "ramazan" ? "star" : "moon";
  return {
    id: item.id,
    icon,
    title: item.name,
    dateLabel: formatDayLabel(item.date, locale),
    remaining: formatDaysRemaining(daysUntil(item.date)),
    isLocked: item.isLocked,
  };
}

function formatDayLabel(isoDate: string, locale: SupportedLocale) {
  const date = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(date.getTime())) {
    return isoDate;
  }

  const formatter = new Intl.DateTimeFormat(toIntlLocale(locale), {
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

function daysUntil(isoDate: string): number {
  const now = new Date();
  const todayUtc = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate());
  const parts = isoDate.split("-").map(Number);
  const targetUtc = Date.UTC(parts[0], parts[1] - 1, parts[2]);
  return Math.max(0, Math.round((targetUtc - todayUtc) / 86_400_000));
}

function formatDaysRemaining(days: number): string {
  if (days === 0) return i18n.t("special-days:remaining.today");
  if (days === 1) return i18n.t("special-days:remaining.oneDay");
  return i18n.t("special-days:remaining.days", { count: days });
}
