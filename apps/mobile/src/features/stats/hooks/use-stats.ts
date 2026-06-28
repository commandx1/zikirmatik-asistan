import { useCallback, useEffect, useState } from "react";
import type { StatsSummary } from "@zikirmatik/shared";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { getStatsSummary } from "../services/stats-api-client";

export type UseStatsResult = {
  data: StatsSummary | null;
  isLoading: boolean;
  isRefreshing: boolean;
  error?: string;
  isPremium: boolean;
  refresh: () => Promise<void>;
};

function toMessage(error: unknown): string {
  return error instanceof Error ? error.message : "İstatistikler yüklenemedi.";
}

export function useStats(): UseStatsResult {
  const authStatus = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const isPremium = useProfileStore((s) => s.isPremium);

  const [data, setData] = useState<StatsSummary | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | undefined>();

  useEffect(() => {
    if (authStatus !== "authenticated") {
      setIsLoading(false);
      return;
    }

    let isCancelled = false;
    setIsLoading(true);
    setError(undefined);

    getStatsSummary(accessToken)
      .then((summary) => {
        if (!isCancelled) {
          setData(summary);
        }
      })
      .catch((cause) => {
        if (!isCancelled) {
          setError(toMessage(cause));
        }
      })
      .finally(() => {
        if (!isCancelled) {
          setIsLoading(false);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, [authStatus, accessToken]);

  const refresh = useCallback(async () => {
    if (authStatus !== "authenticated") {
      return;
    }
    setIsRefreshing(true);
    setError(undefined);
    try {
      const summary = await getStatsSummary(accessToken);
      setData(summary);
    } catch (cause) {
      setError(toMessage(cause));
    } finally {
      setIsRefreshing(false);
    }
  }, [authStatus, accessToken]);

  return { data, isLoading, isRefreshing, error, isPremium, refresh };
}
