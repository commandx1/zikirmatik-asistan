import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { listDhikrLogsByUser } from "../services/dhikr-logs-api-client";
import { DhikrsApiError, listVerifiedActiveDhikrs } from "../services/dhikrs-api-client";
import { listUserDhikrs } from "../services/user-dhikrs-api-client";

export function useDhikrBackendSync() {
  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const sessionAccessToken = useAuthStore((s) => s.session?.accessToken);
  const hydrateReadyItems = useDhikrStore((s) => s.hydrateReadyItems);
  const hydratePersonalItems = useDhikrStore((s) => s.hydratePersonalItems);
  const setSyncError = useDhikrStore((s) => s.setSyncError);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        setSyncError(undefined);

        const [dhikrs, personalDhikrs] = await Promise.all([
          listVerifiedActiveDhikrs(),
          listUserDhikrs(sessionAccessToken)
        ]);
        const logs = sessionUserId
          ? await listDhikrLogsByUser(
              sessionUserId,
              undefined,
              undefined,
              sessionAccessToken
            )
          : [];

        if (isCancelled) {
          return;
        }

        hydratePersonalItems(
          personalDhikrs.map((item) => ({
            id: item.clientId,
            transliteration: item.transliteration?.trim() || item.name,
            arabic: item.arabic,
            meaning: item.meaning,
            target: item.target,
            isFavorite: item.isFavorite
          }))
        );

        const latestByDhikr = new Map<
          string,
          {
            count: number;
            targetCount: number;
            createdAt?: string;
            isFavorite: boolean;
          }
        >();

        for (const log of logs) {
          if (!log.dhikrId) {
            continue;
          }

          const existing = latestByDhikr.get(log.dhikrId);
          if (existing) {
            continue;
          }

          latestByDhikr.set(log.dhikrId, {
            count: log.count,
            targetCount: log.targetCount,
            createdAt: log.createdAt,
            isFavorite: Boolean(log.isFavorite)
          });
        }

        const mappedItems = dhikrs.map((item) => {
          const log = latestByDhikr.get(item._id);
          return {
            id: item._id,
            arabic: item.nameArabic,
            transliteration: item.transliteration || item.nameTurkish,
            meaning: item.meaning,
            target: log?.targetCount ?? item.recommendedCount,
            current: log?.count ?? 0,
            lastActivityLabel: log?.createdAt ? toLastActivityLabel(log.createdAt) : "Henüz başlanmadı",
            isFavorite: log?.isFavorite ?? false
          };
        });

        hydrateReadyItems(mappedItems);
      } catch (error) {
        if (isCancelled) {
          return;
        }

        const message =
          error instanceof DhikrsApiError ? error.message : "Zikir verisi senkronize edilemedi.";
        setSyncError(message);
      }
    };

    void run();
    return () => {
      isCancelled = true;
    };
  }, [authStatus, hydratePersonalItems, hydrateReadyItems, sessionAccessToken, sessionUserId, setSyncError]);
}

function toLastActivityLabel(createdAt: string) {
  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) {
    return "Bugün";
  }

  return `Bugün ${date.toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  })}`;
}
