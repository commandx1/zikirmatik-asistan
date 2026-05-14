import { useEffect } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { listDhikrLogsByUser } from "../services/dhikr-logs-api-client";
import { DhikrsApiError, listVerifiedActiveDhikrs } from "../services/dhikrs-api-client";

export function useDhikrBackendSync() {
  const authStatus = useAuthStore((s) => s.status);
  const sessionUserId = useAuthStore((s) => s.session?.userId);
  const hydrateReadyItems = useDhikrStore((s) => s.hydrateReadyItems);
  const setSyncError = useDhikrStore((s) => s.setSyncError);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    let isCancelled = false;

    const run = async () => {
      try {
        setSyncError(undefined);

        const dhikrs = await listVerifiedActiveDhikrs();
        const today = toDateKey(new Date());
        const logs = sessionUserId
          ? await listDhikrLogsByUser(sessionUserId, today, today)
          : [];

        if (isCancelled) {
          return;
        }

        const latestByDhikr = new Map<
          string,
          {
            count: number;
            targetCount: number;
            createdAt?: string;
          }
        >();

        for (const log of logs) {
          const existing = latestByDhikr.get(log.dhikrId);
          if (existing) {
            continue;
          }

          latestByDhikr.set(log.dhikrId, {
            count: log.count,
            targetCount: log.targetCount,
            createdAt: log.createdAt
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
            lastActivityLabel: log?.createdAt ? toLastActivityLabel(log.createdAt) : "Henüz başlanmadı"
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
  }, [authStatus, hydrateReadyItems, sessionUserId, setSyncError]);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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
