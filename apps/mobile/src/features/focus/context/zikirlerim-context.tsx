import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { listDhikrLogsByUser, type BackendDhikrLog } from "../../dhikrs/services/dhikr-logs-api-client";
import type { ZikirFilterKey, ZikirItem } from "../types";

type ZikirlerimContextValue = {
  filters: Array<{ key: ZikirFilterKey; label: string }>;
  activeFilter: ZikirFilterKey;
  items: ZikirItem[];
  selectedDhikrId: string;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  setActiveFilter: (filter: ZikirFilterKey) => void;
  toggleFavorite: (id: string) => void;
  selectDhikr: (id: string) => void;
};

const ZikirlerimContext = createContext<ZikirlerimContextValue | null>(null);

const FILTERS: Array<{ key: ZikirFilterKey; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Tamamlanan" },
  { key: "favorites", label: "Favoriler" }
];

export function ZikirlerimProvider({ children }: PropsWithChildren) {
  const [activeFilter, setActiveFilter] = useState<ZikirFilterKey>("all");
  const items = useDhikrStore((state) => state.items);
  const selectedDhikrId = useDhikrStore((state) => state.selectedDhikrId);
  const toggleFavorite = useDhikrStore((state) => state.toggleFavorite);
  const selectDhikr = useDhikrStore((state) => state.selectDhikr);
  const lastSavedBackendLog = useDhikrStore((state) => state.lastSavedBackendLog);
  const authStatus = useAuthStore((state) => state.status);
  const sessionUserId = useAuthStore((state) => state.session?.userId);
  const [logs, setLogs] = useState<BackendDhikrLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchLogs = useCallback(async () => {
    if (authStatus !== "authenticated" || !sessionUserId) {
      setLogs([]);
      return;
    }

    try {
      const nextLogs = await listDhikrLogsByUser(sessionUserId);
      setLogs(nextLogs);
    } catch {
      setLogs([]);
    }
  }, [authStatus, sessionUserId]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !sessionUserId || !lastSavedBackendLog) {
      return;
    }

    if (lastSavedBackendLog.userId !== sessionUserId) {
      return;
    }

    setLogs((prev) => {
      const next = [...prev];
      const existingIndex = next.findIndex(
        (log) =>
          log.userId === lastSavedBackendLog.userId &&
          log.dhikrId === lastSavedBackendLog.dhikrId &&
          log.date === lastSavedBackendLog.date
      );

      if (existingIndex >= 0) {
        next[existingIndex] = lastSavedBackendLog;
      } else {
        next.unshift(lastSavedBackendLog);
      }

      return next.sort((a, b) => toLogTimestamp(b) - toLogTimestamp(a));
    });
  }, [authStatus, lastSavedBackendLog, sessionUserId]);

  useEffect(() => {
    let isCancelled = false;

    if (authStatus !== "authenticated" || !sessionUserId) {
      setLogs([]);
      return () => {
        isCancelled = true;
      };
    }

    void listDhikrLogsByUser(sessionUserId)
      .then((nextLogs) => {
        if (isCancelled) {
          return;
        }
        setLogs(nextLogs);
      })
      .catch(() => {
        if (isCancelled) {
          return;
        }
        setLogs([]);
      });

    return () => {
      isCancelled = true;
    };
  }, [authStatus, sessionUserId]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchLogs();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchLogs]);

  const enrichedItems = useMemo(() => {
    if (authStatus !== "authenticated") {
      return items.filter((item) => item.current > 0);
    }

    if (logs.length === 0) {
      return [];
    }

    const itemById = new Map(items.map((item) => [item.id, item]));
    const groupedByDhikr = new Map<string, BackendDhikrLog[]>();
    for (const log of logs) {
      const list = groupedByDhikr.get(log.dhikrId);
      if (list) {
        list.push(log);
      } else {
        groupedByDhikr.set(log.dhikrId, [log]);
      }
    }

    const nextItems: ZikirItem[] = [];
    for (const [dhikrId, dhikrLogs] of groupedByDhikr.entries()) {
      const matched = itemById.get(dhikrId);
      const sorted = [...dhikrLogs].sort((a, b) => toLogTimestamp(b) - toLogTimestamp(a));
      const latestLog = sorted[0];

      nextItems.push({
        id: dhikrId,
        source: matched?.source ?? "ready",
        arabic: matched?.arabic,
        transliteration: matched?.transliteration ?? "Kayıtlı Zikir",
        meaning: matched?.meaning,
        current: latestLog.count,
        target: matched?.target ?? latestLog.targetCount,
        lastActivityLabel: toLastActivityLabel(latestLog.createdAt, latestLog.date),
        streakDays: calculateStreakDays(sorted),
        isFavorite: matched?.isFavorite ?? false
      });
    }

    return nextItems.sort((a, b) => {
      const aLogs = groupedByDhikr.get(a.id) ?? [];
      const bLogs = groupedByDhikr.get(b.id) ?? [];
      const latestA = aLogs.reduce((max, log) => Math.max(max, toLogTimestamp(log)), 0);
      const latestB = bLogs.reduce((max, log) => Math.max(max, toLogTimestamp(log)), 0);
      return latestB - latestA;
    });
  }, [authStatus, items, logs]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") {
      return enrichedItems;
    }
    if (activeFilter === "favorites") {
      return enrichedItems.filter((item) => item.isFavorite);
    }
    if (activeFilter === "completed") {
      return enrichedItems.filter((item) => item.current >= item.target);
    }
    return enrichedItems.filter((item) => item.current < item.target);
  }, [activeFilter, enrichedItems]);

  const value: ZikirlerimContextValue = {
    filters: FILTERS,
    activeFilter,
    items: visibleItems,
    selectedDhikrId,
    isRefreshing,
    refresh,
    setActiveFilter,
    toggleFavorite,
    selectDhikr
  };

  return <ZikirlerimContext.Provider value={value}>{children}</ZikirlerimContext.Provider>;
}

export function useZikirlerim() {
  const context = useContext(ZikirlerimContext);
  if (!context) {
    throw new Error("useZikirlerim must be used within ZikirlerimProvider");
  }
  return context;
}

function calculateStreakDays(logs: BackendDhikrLog[]) {
  if (logs.length === 0) {
    return 0;
  }

  const statusByDay = new Map<string, "completed" | "incomplete">();
  for (const log of logs) {
    const current = statusByDay.get(log.date);
    if (current === "incomplete") {
      continue;
    }
    statusByDay.set(log.date, log.isCompleted ? "completed" : "incomplete");
  }

  let streak = 0;
  const today = startOfDay(new Date());

  const todayKey = toDateKey(today);
  const todayStatus = statusByDay.get(todayKey);

  if (todayStatus === "incomplete") {
    return 0;
  }

  let cursor =
    todayStatus === "completed"
      ? today
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  while (true) {
    const key = toDateKey(cursor);
    const status = statusByDay.get(key);
    if (status !== "completed") {
      break;
    }

    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

function toLastActivityLabel(createdAt: string | undefined, dateKey: string) {
  const fromCreatedAt = createdAt ? new Date(createdAt) : null;
  const date = fromCreatedAt && !Number.isNaN(fromCreatedAt.getTime()) ? fromCreatedAt : parseDateKey(dateKey);
  if (!date) {
    return "Kayıtlı";
  }

  return date.toLocaleDateString("tr-TR");
}

function parseDateKey(dateKey: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  if (!match) {
    return null;
  }

  const year = Number.parseInt(match[1], 10);
  const month = Number.parseInt(match[2], 10);
  const day = Number.parseInt(match[3], 10);
  return new Date(year, month - 1, day);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}

function toLogTimestamp(log: BackendDhikrLog) {
  if (log.createdAt) {
    const created = new Date(log.createdAt).getTime();
    if (!Number.isNaN(created)) {
      return created;
    }
  }

  const parsedDate = parseDateKey(log.date);
  return parsedDate ? parsedDate.getTime() : 0;
}
