import { useCallback, useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import type { StatsSummary } from "@zikirmatik/shared";
import { i18n } from "../../../i18n";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { buildLocalStatsSummary } from "../services/stats-aggregation";
import { getStatsSummary } from "../services/stats-api-client";

// Yalnızca tek bir özet döndüğü için sabit bir "period" anahtarı yeterli —
// qk.stats(userId, period) imzasını (diğer okuyucularla) paylaşır.
const STATS_SUMMARY_PERIOD = "summary";

// Shared with useBadgeCelebration: one cache entry per user, so a member's
// popup and stats screen read the very same server badges.
export function statsSummaryQueryOptions(userId: string | undefined) {
  return {
    queryKey: qk.stats(userId, STATS_SUMMARY_PERIOD),
    queryFn: getStatsSummary,
    staleTime: 0,
    retry: false
  } as const;
}

export type UseStatsResult = {
  data: StatsSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  isPremium: boolean;
  /** Server-authoritative (or, in guest mode, locally-derived) premium lock state for the detail sections. */
  locked: boolean;
  refresh: () => Promise<void>;
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : i18n.t("stats:errors.loadFailed");
}

export function useStats(): UseStatsResult {
  const authStatus = useAuthStore((s) => s.status);
  const guestMode = useAuthStore((s) => s.guestMode);
  const userId = useAuthStore((s) => s.session?.userId);
  const isPremium = useProfileStore((s) => s.isPremium);
  const dhikrItems = useDhikrStore((s) => s.items);
  const freeModeCount = useDhikrStore((s) => s.freeModeCount);
  const freeModeActivityAt = useDhikrStore((s) => s.freeModeActivityAt);
  const activeDayKeys = useDhikrStore((s) => s.activeDayKeys);
  const lifetimeCount = useDhikrStore((s) => s.lifetimeCount);

  // Misafir yolu (yerel özet) değişmedi — yalnızca kimlikli yol RQ'ya taşındı.
  const [data, setData] = useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isGuest = guestMode && authStatus !== "authenticated";

  useEffect(() => {
    if (!isGuest) {
      return;
    }

    setData(buildLocalStatsSummary(dhikrItems, freeModeCount, isPremium, freeModeActivityAt, activeDayKeys, lifetimeCount));
    setIsLoading(false);
  }, [dhikrItems, freeModeCount, freeModeActivityAt, activeDayKeys, lifetimeCount, isGuest, isPremium]);

  const isAuthedFetch = !isGuest && authStatus === "authenticated";
  // `isPremium` sorgu anahtarında YOK ama queryFn çağrısı isPremium
  // değişince de yeniden tetiklenmeli (server-enforced `locked` kilidi
  // açılsın) — bu yüzden isPremium'u da bağımlı tutan bir efektle
  // invalidate ediyoruz.
  const statsQuery = useQuery(
    { ...statsSummaryQueryOptions(userId), enabled: isAuthedFetch },
    queryClient
  );

  const isPremiumMountedRef = useRef(isPremium);
  useEffect(() => {
    if (!isAuthedFetch || isPremiumMountedRef.current === isPremium) {
      return;
    }
    isPremiumMountedRef.current = isPremium;
    void queryClient.invalidateQueries({ queryKey: statsSummaryQueryOptions(userId).queryKey });
  }, [isPremium, isAuthedFetch, userId]);

  const [isRefreshing, setIsRefreshing] = useState(false);

  const refresh = useCallback(async () => {
    if (isGuest) {
      setData(buildLocalStatsSummary(dhikrItems, freeModeCount, isPremium, freeModeActivityAt, activeDayKeys, lifetimeCount));
      return;
    }

    if (authStatus !== "authenticated") {
      return;
    }
    setIsRefreshing(true);
    try {
      await statsQuery.refetch();
    } finally {
      setIsRefreshing(false);
    }
  }, [authStatus, dhikrItems, freeModeCount, freeModeActivityAt, activeDayKeys, lifetimeCount, isGuest, isPremium, statsQuery]);

  const resolvedData = isGuest ? data : isAuthedFetch ? (statsQuery.data ?? null) : null;
  const resolvedIsLoading = isGuest ? isLoading : isAuthedFetch ? statsQuery.isLoading : false;
  const resolvedError = isAuthedFetch && statsQuery.error ? toMessage(statsQuery.error) : undefined;
  const locked = resolvedData?.locked ?? !isPremium;

  return {
    data: resolvedData,
    isLoading: resolvedIsLoading,
    isRefreshing,
    error: resolvedError,
    isPremium,
    locked,
    refresh
  };
}

