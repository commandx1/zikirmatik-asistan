import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useRouter } from "expo-router";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import {
  createDhikrLog,
  deleteDhikrLogsByKey,
  listDhikrLogsByUser,
  setDhikrFavoriteByKey,
  type BackendDhikrLog
} from "../../dhikrs/services/dhikr-logs-api-client";
import { shouldConfirmUnsavedDhikrTransition } from "../../home/services/unsaved-transition-guard";
import {
  deleteUserDhikrByClientId,
  updateUserDhikrByClientId
} from "../../dhikrs/services/user-dhikrs-api-client";
import type { ZikirFilterKey, ZikirItem } from "../types";

type UpdateDhikrValues = {
  name: string;
  transliteration: string;
  meaning: string;
  target: number;
};

type ZikirlerimContextValue = {
  filters: Array<{ key: ZikirFilterKey; label: string }>;
  activeFilter: ZikirFilterKey;
  items: ZikirItem[];
  selectedDhikrId: string;
  deletingDhikrId: string;
  editingDhikr: ZikirItem | null;
  isUpdateOpen: boolean;
  isUpdatingDhikr: boolean;
  updateError: string | null;
  isUnsavedTransitionOpen: boolean;
  isSavingUnsavedTransition: boolean;
  unsavedTransitionDhikrName: string;
  unsavedTransitionCount: number;
  unsavedTransitionError: string | null;
  isRefreshing: boolean;
  refresh: () => Promise<void>;
  setActiveFilter: (filter: ZikirFilterKey) => void;
  toggleFavorite: (id: string) => void;
  selectDhikr: (id: string) => void;
  startDhikrOnHome: (id: string) => void;
  cancelUnsavedTransition: () => void;
  saveAndContinueUnsavedTransition: () => void;
  continueWithoutSavingUnsavedTransition: () => void;
  deleteDhikr: (item: ZikirItem) => Promise<void>;
  openUpdateModal: (item: ZikirItem) => void;
  closeUpdateModal: () => void;
  clearUpdateError: () => void;
  saveDhikrUpdate: (values: UpdateDhikrValues) => Promise<void>;
};

const ZikirlerimContext = createContext<ZikirlerimContextValue | null>(null);

const FILTERS: Array<{ key: ZikirFilterKey; label: string }> = [
  { key: "all", label: "Tümü" },
  { key: "active", label: "Aktif" },
  { key: "completed", label: "Tamamlanan" },
  { key: "favorites", label: "Favoriler" }
];

type PendingFocusTransition = { kind: "select"; id: string } | { kind: "startHome"; id: string };

export function ZikirlerimProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const [activeFilter, setActiveFilter] = useState<ZikirFilterKey>("all");
  const items = useDhikrStore((state) => state.items);
  const selectedDhikrId = useDhikrStore((state) => state.selectedDhikrId);
  const unsavedProgressDhikrIds = useDhikrStore((state) => state.unsavedProgressDhikrIds);
  const storeToggleFavorite = useDhikrStore((state) => state.toggleFavorite);
  const storeSelectDhikr = useDhikrStore((state) => state.selectDhikr);
  const storeClearSelectedDhikr = useDhikrStore((state) => state.clearSelectedDhikr);
  const upsertPersonalDhikr = useDhikrStore((state) => state.upsertPersonalDhikr);
  const upsertDhikrSnapshot = useDhikrStore((state) => state.upsertDhikrSnapshot);
  const applySavedBackendLog = useDhikrStore((state) => state.applySavedBackendLog);
  const setSyncError = useDhikrStore((state) => state.setSyncError);
  const discardUnsavedProgress = useDhikrStore((state) => state.discardUnsavedProgress);
  const removePersonalDhikr = useDhikrStore((state) => state.removePersonalDhikr);
  const clearDhikrProgress = useDhikrStore((state) => state.clearDhikrProgress);
  const lastSavedBackendLog = useDhikrStore((state) => state.lastSavedBackendLog);
  const authStatus = useAuthStore((state) => state.status);
  const sessionUserId = useAuthStore((state) => state.session?.userId);
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);
  const [logs, setLogs] = useState<BackendDhikrLog[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingDhikrId, setDeletingDhikrId] = useState("");
  const [editingDhikrId, setEditingDhikrId] = useState("");
  const [isUpdatingDhikr, setIsUpdatingDhikr] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [pendingFocusTransition, setPendingFocusTransition] = useState<PendingFocusTransition | null>(null);
  const [isSavingUnsavedTransition, setIsSavingUnsavedTransition] = useState(false);
  const [unsavedTransitionError, setUnsavedTransitionError] = useState<string | null>(null);

  const fetchLogs = useCallback(async () => {
    if (authStatus !== "authenticated" || !sessionUserId) {
      setLogs([]);
      return;
    }

    try {
      const nextLogs = await listDhikrLogsByUser(
        sessionUserId,
        undefined,
        undefined,
        sessionAccessToken
      );
      setLogs(nextLogs);
    } catch {
      setLogs([]);
    }
  }, [authStatus, sessionAccessToken, sessionUserId]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !sessionUserId || !lastSavedBackendLog) {
      return;
    }

    if (lastSavedBackendLog.userId !== sessionUserId) {
      return;
    }

    setLogs((prev) => {
      const next = [...prev];
      const lastLogKey = resolveLogDhikrKey(lastSavedBackendLog);
      if (!lastLogKey) {
        return next;
      }
      const existingIndex = next.findIndex(
        (log) =>
          log.userId === lastSavedBackendLog.userId &&
          resolveLogDhikrKey(log) === lastLogKey &&
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

    void listDhikrLogsByUser(
      sessionUserId,
      undefined,
      undefined,
      sessionAccessToken
    )
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
  }, [authStatus, sessionAccessToken, sessionUserId]);

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
      return items.filter((item) => item.source === "personal" || item.current > 0);
    }

    const personalLocalItems = items.filter((item) => item.source === "personal");

    if (logs.length === 0) {
      return personalLocalItems;
    }

    const itemById = new Map(items.map((item) => [item.id, item]));
    const groupedByDhikr = new Map<string, BackendDhikrLog[]>();
    for (const log of logs) {
      const dhikrKey = resolveLogDhikrKey(log);
      if (!dhikrKey) {
        continue;
      }

      const list = groupedByDhikr.get(dhikrKey);
      if (list) {
        list.push(log);
      } else {
        groupedByDhikr.set(dhikrKey, [log]);
      }
    }

    const nextItems: ZikirItem[] = [];
    for (const [dhikrId, dhikrLogs] of groupedByDhikr.entries()) {
      const matched = itemById.get(dhikrId);
      const sorted = [...dhikrLogs].sort((a, b) => toLogTimestamp(b) - toLogTimestamp(a));
      const latestLog = sorted[0];
      const hasUnsavedProgress = unsavedProgressDhikrIds.includes(dhikrId);
      const streakInfo = calculateStreakInfo(sorted);
      const lastActivityLabel =
        streakInfo.days > 1 && streakInfo.rangeLabel
          ? streakInfo.rangeLabel
          : toLastActivityLabel(latestLog.createdAt, latestLog.date);

      nextItems.push({
        id: dhikrId,
        source: matched?.source ?? "personal",
        nameTurkish: matched?.nameTurkish ?? latestLog.customDhikrName ?? matched?.transliteration ?? "Kayıtlı Zikir",
        arabic: matched?.arabic ?? latestLog.customDhikrArabic,
        transliteration: matched?.transliteration ?? latestLog.customDhikrName ?? "Kayıtlı Zikir",
        meaning: matched?.meaning,
        virtue: matched?.virtue,
        contentSource: matched?.contentSource,
        aiPrompt: latestLog.aiPrompt ?? matched?.aiPrompt,
        aiAssistantNote: latestLog.aiAssistantNote ?? matched?.aiAssistantNote,
        aiRecommendationId: latestLog.aiRecommendationId ?? matched?.aiRecommendationId,
        current: hasUnsavedProgress && matched ? matched.current : latestLog.count,
        target: hasUnsavedProgress && matched ? matched.target : (matched?.target ?? latestLog.targetCount),
        lastActivityLabel,
        streakDays: streakInfo.days,
        isFavorite: latestLog.isFavorite ?? matched?.isFavorite ?? false
      });
    }

    for (const personalItem of personalLocalItems) {
      if (nextItems.some((item) => item.id === personalItem.id)) {
        continue;
      }

      nextItems.push(personalItem);
    }

    return nextItems.sort((a, b) => {
      const aLogs = groupedByDhikr.get(a.id) ?? [];
      const bLogs = groupedByDhikr.get(b.id) ?? [];
      const latestA = aLogs.reduce((max, log) => Math.max(max, toLogTimestamp(log)), 0);
      const latestB = bLogs.reduce((max, log) => Math.max(max, toLogTimestamp(log)), 0);
      return latestB - latestA;
    });
  }, [authStatus, items, logs, unsavedProgressDhikrIds]);

  const visibleItems = useMemo(() => {
    if (activeFilter === "all") {
      return enrichedItems;
    }
    if (activeFilter === "favorites") {
      return enrichedItems.filter((item) => item.isFavorite);
    }
    if (activeFilter === "completed") {
      return enrichedItems.filter((item) => item.target > 0 && item.current >= item.target);
    }
    return enrichedItems.filter((item) => item.target <= 0 || item.current < item.target);
  }, [activeFilter, enrichedItems]);

  const editingDhikr = useMemo(() => {
    if (!editingDhikrId) {
      return null;
    }

    return (
      enrichedItems.find((item) => item.id === editingDhikrId) ??
      items.find((item) => item.id === editingDhikrId) ??
      null
    );
  }, [editingDhikrId, enrichedItems, items]);

  const closeUpdateModal = useCallback(() => {
    if (isUpdatingDhikr) {
      return;
    }

    setEditingDhikrId("");
    setUpdateError(null);
  }, [isUpdatingDhikr]);

  const saveDhikrUpdate = useCallback(
    async (values: UpdateDhikrValues) => {
      if (!editingDhikr || editingDhikr.source !== "personal" || isUpdatingDhikr) {
        return;
      }

      const trimmedName = values.name.trim();
      const trimmedTransliteration = values.transliteration.trim();
      const trimmedMeaning = values.meaning.trim();
      const nextTarget = values.target > 0 ? values.target : 0;

      const previousSnapshot: ZikirItem = {
        ...editingDhikr
      };

      setUpdateError(null);
      setIsUpdatingDhikr(true);

      upsertPersonalDhikr({
        id: editingDhikr.id,
        nameTurkish: trimmedName,
        transliteration: trimmedTransliteration,
        arabic: editingDhikr.arabic,
        meaning: trimmedMeaning || undefined,
        current: editingDhikr.current,
        target: nextTarget,
        lastActivityLabel: editingDhikr.lastActivityLabel,
        isFavorite: editingDhikr.isFavorite
      });

      try {
        if (authStatus === "authenticated" && sessionUserId) {
          await updateUserDhikrByClientId(
            editingDhikr.id,
            {
              name: trimmedName,
              transliteration: trimmedTransliteration || undefined,
              meaning: trimmedMeaning || undefined,
              target: nextTarget
            },
            sessionAccessToken
          );
        }

        setEditingDhikrId("");
        setUpdateError(null);
      } catch {
        upsertPersonalDhikr({
          id: previousSnapshot.id,
          nameTurkish: previousSnapshot.nameTurkish,
          transliteration: previousSnapshot.transliteration,
          arabic: previousSnapshot.arabic,
          meaning: previousSnapshot.meaning,
          current: previousSnapshot.current,
          target: previousSnapshot.target,
          lastActivityLabel: previousSnapshot.lastActivityLabel,
          isFavorite: previousSnapshot.isFavorite
        });
        setUpdateError("Zikir güncellenemedi. Lütfen tekrar dene.");
      } finally {
        setIsUpdatingDhikr(false);
      }
    },
    [authStatus, editingDhikr, isUpdatingDhikr, sessionAccessToken, sessionUserId, upsertPersonalDhikr]
  );

  const selectDhikrImmediately = useCallback(
    (id: string) => {
      const fromVisible = visibleItems.find((item) => item.id === id);
      if (fromVisible) {
        upsertDhikrSnapshot(fromVisible);
      } else {
        const existsInStore = items.some((item) => item.id === id);
        if (!existsInStore) {
          const fallbackPersonal = enrichedItems.find((item) => item.id === id && item.source === "personal");
          if (fallbackPersonal) {
            upsertPersonalDhikr({
              id: fallbackPersonal.id,
              nameTurkish: fallbackPersonal.nameTurkish,
              transliteration: fallbackPersonal.transliteration,
              arabic: fallbackPersonal.arabic,
              meaning: fallbackPersonal.meaning,
              current: fallbackPersonal.current,
              target: fallbackPersonal.target,
              lastActivityLabel: fallbackPersonal.lastActivityLabel,
              isFavorite: fallbackPersonal.isFavorite
            });
          }
        }
      }

      storeSelectDhikr(id);
    },
    [enrichedItems, items, storeSelectDhikr, upsertDhikrSnapshot, upsertPersonalDhikr, visibleItems]
  );

  const saveSelectedDhikrProgress = useCallback(async () => {
    const selectedItem = items.find((item) => item.id === selectedDhikrId);
    if (!selectedItem) {
      return true;
    }

    if (authStatus !== "authenticated" || !sessionUserId) {
      const message = "Kaydetmek için giriş yapmalısın.";
      setSyncError(message);
      setUnsavedTransitionError(message);
      return false;
    }

    const safeCount = Math.max(0, Math.floor(selectedItem.current));
    const isCompleted = selectedItem.target > 0 && safeCount >= selectedItem.target;
    const payload = isObjectIdLike(selectedItem.id)
      ? {
          userId: sessionUserId,
          dhikrId: selectedItem.id,
          count: safeCount,
          targetCount: selectedItem.target,
          date: toDateKey(new Date()),
          source: "manual" as const,
          isCompleted,
          isFavorite: selectedItem.isFavorite
        }
      : {
          userId: sessionUserId,
          customDhikrId: selectedItem.id,
          customDhikrName: selectedItem.nameTurkish || selectedItem.transliteration,
          customDhikrArabic: selectedItem.arabic,
          count: safeCount,
          targetCount: selectedItem.target,
          date: toDateKey(new Date()),
          source: "manual" as const,
          isCompleted: false,
          isFavorite: selectedItem.isFavorite
        };

    setIsSavingUnsavedTransition(true);
    setUnsavedTransitionError(null);
    setSyncError(undefined);
    try {
      const savedLog = await createDhikrLog(payload, sessionAccessToken);
      applySavedBackendLog(savedLog);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "Zikir kaydı kaydedilemedi.";
      setSyncError(message);
      setUnsavedTransitionError(message);
      return false;
    } finally {
      setIsSavingUnsavedTransition(false);
    }
  }, [
    applySavedBackendLog,
    authStatus,
    items,
    selectedDhikrId,
    sessionAccessToken,
    sessionUserId,
    setSyncError
  ]);

  const runFocusTransition = useCallback(
    (transition: PendingFocusTransition) => {
      selectDhikrImmediately(transition.id);
      if (transition.kind === "startHome") {
        router.push("/(tabs)/home");
      }
    },
    [router, selectDhikrImmediately]
  );

  const requestFocusTransition = useCallback(
    (transition: PendingFocusTransition) => {
      if (
        shouldConfirmUnsavedDhikrTransition({
          selectedDhikrId,
          targetDhikrId: transition.id,
          unsavedProgressDhikrIds
        })
      ) {
        setPendingFocusTransition(transition);
        setUnsavedTransitionError(null);
        return;
      }

      runFocusTransition(transition);
    },
    [runFocusTransition, selectedDhikrId, unsavedProgressDhikrIds]
  );

  const cancelUnsavedTransition = useCallback(() => {
    if (isSavingUnsavedTransition) {
      return;
    }

    setPendingFocusTransition(null);
    setUnsavedTransitionError(null);
  }, [isSavingUnsavedTransition]);

  const continueWithoutSavingUnsavedTransition = useCallback(() => {
    if (!pendingFocusTransition || isSavingUnsavedTransition) {
      return;
    }

    const transition = pendingFocusTransition;
    discardUnsavedProgress(selectedDhikrId);
    setPendingFocusTransition(null);
    setUnsavedTransitionError(null);
    runFocusTransition(transition);
  }, [
    discardUnsavedProgress,
    isSavingUnsavedTransition,
    pendingFocusTransition,
    runFocusTransition,
    selectedDhikrId
  ]);

  const saveAndContinueUnsavedTransition = useCallback(() => {
    if (!pendingFocusTransition || isSavingUnsavedTransition) {
      return;
    }

    const transition = pendingFocusTransition;
    void saveSelectedDhikrProgress().then((didSave) => {
      if (!didSave) {
        return;
      }

      setPendingFocusTransition(null);
      setUnsavedTransitionError(null);
      runFocusTransition(transition);
    });
  }, [isSavingUnsavedTransition, pendingFocusTransition, runFocusTransition, saveSelectedDhikrProgress]);

  const value: ZikirlerimContextValue = {
    filters: FILTERS,
    activeFilter,
    items: visibleItems,
    selectedDhikrId,
    deletingDhikrId,
    editingDhikr,
    isUpdateOpen: Boolean(editingDhikr),
    isUpdatingDhikr,
    updateError,
    isUnsavedTransitionOpen: Boolean(pendingFocusTransition),
    isSavingUnsavedTransition,
    unsavedTransitionDhikrName:
      items.find((item) => item.id === selectedDhikrId)?.nameTurkish ||
      items.find((item) => item.id === selectedDhikrId)?.transliteration ||
      "Bu zikir",
    unsavedTransitionCount: items.find((item) => item.id === selectedDhikrId)?.current ?? 0,
    unsavedTransitionError,
    isRefreshing,
    refresh,
    setActiveFilter,
    toggleFavorite: (id) => {
      const fallbackStoreItem = items.find((item) => item.id === id);
      const contextItem = enrichedItems.find((item) => item.id === id);
      const currentFavorite = contextItem?.isFavorite ?? fallbackStoreItem?.isFavorite ?? false;
      const nextFavorite = !currentFavorite;

      storeToggleFavorite(id);
      setLogs((prev) =>
        prev.map((log) =>
          resolveLogDhikrKey(log) === id
            ? {
                ...log,
                isFavorite: nextFavorite
              }
            : log
        )
      );

      if (authStatus !== "authenticated" || !sessionUserId || !contextItem) {
        return;
      }

      const favoriteRequest =
        contextItem.source === "personal"
          ? updateUserDhikrByClientId(
              id,
              { isFavorite: nextFavorite },
              sessionAccessToken
            )
          : setDhikrFavoriteByKey(
              isObjectIdLike(id)
                ? { dhikrId: id, isFavorite: nextFavorite }
                : { customDhikrId: id, isFavorite: nextFavorite },
              sessionAccessToken
            );

      void favoriteRequest.catch(() => {
        storeToggleFavorite(id);
        setLogs((prev) =>
          prev.map((log) =>
            resolveLogDhikrKey(log) === id
              ? {
                  ...log,
                  isFavorite: currentFavorite
                }
              : log
          )
        );
      });
    },
    selectDhikr: (id) => requestFocusTransition({ kind: "select", id }),
    startDhikrOnHome: (id) => requestFocusTransition({ kind: "startHome", id }),
    cancelUnsavedTransition,
    saveAndContinueUnsavedTransition,
    continueWithoutSavingUnsavedTransition,
    deleteDhikr: async (item) => {
      if (!item.id || deletingDhikrId === item.id) {
        return;
      }

      setDeletingDhikrId(item.id);
      try {
        if (authStatus === "authenticated" && sessionUserId) {
          if (item.source === "personal") {
            await deleteUserDhikrByClientId(item.id, sessionAccessToken);
          }

          const deletePayload = isObjectIdLike(item.id)
            ? { dhikrId: item.id }
            : { customDhikrId: item.id };
          await deleteDhikrLogsByKey(
            deletePayload,
            sessionAccessToken
          );
        }

        setLogs((prev) => prev.filter((log) => resolveLogDhikrKey(log) !== item.id));

        if (item.source === "personal") {
          removePersonalDhikr(item.id);
        } else {
          clearDhikrProgress(item.id);
        }

        if (selectedDhikrId === item.id) {
          storeClearSelectedDhikr();
        }

        if (editingDhikrId === item.id) {
          setEditingDhikrId("");
          setUpdateError(null);
        }
      } finally {
        setDeletingDhikrId("");
      }
    },
    openUpdateModal: (item) => {
      if (item.source !== "personal") {
        return;
      }
      setEditingDhikrId(item.id);
      setUpdateError(null);
    },
    closeUpdateModal,
    clearUpdateError: () => {
      setUpdateError(null);
    },
    saveDhikrUpdate
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

type StreakInfo = {
  days: number;
  rangeLabel?: string;
};

function calculateStreakInfo(logs: BackendDhikrLog[]): StreakInfo {
  if (logs.length === 0) {
    return { days: 0 };
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
    return { days: 0 };
  }

  let cursor =
    todayStatus === "completed"
      ? today
      : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  const streakEnd = new Date(cursor);
  let streakStart = new Date(cursor);

  while (true) {
    const key = toDateKey(cursor);
    const status = statusByDay.get(key);
    if (status !== "completed") {
      break;
    }

    streakStart = new Date(cursor);
    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  if (streak > 1) {
    return {
      days: streak,
      rangeLabel: `${formatDate(streakStart)} - ${formatDate(streakEnd)}`
    };
  }

  return { days: streak };
}

function toLastActivityLabel(createdAt: string | undefined, dateKey: string) {
  const fromCreatedAt = createdAt ? new Date(createdAt) : null;
  const date = fromCreatedAt && !Number.isNaN(fromCreatedAt.getTime()) ? fromCreatedAt : parseDateKey(dateKey);
  if (!date) {
    return "Kayıtlı";
  }

  return toRelativeDateLabel(date);
}

function formatDate(value: Date) {
  return toRelativeDateLabel(value);
}

function toRelativeDateLabel(value: Date) {
  const normalized = startOfDay(value);
  const today = startOfDay(new Date());
  const yesterday = new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);

  if (normalized.getTime() === today.getTime()) {
    return "Bugün";
  }

  if (normalized.getTime() === yesterday.getTime()) {
    return "Dün";
  }

  return normalized.toLocaleDateString("tr-TR");
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

function resolveLogDhikrKey(log: BackendDhikrLog) {
  return log.dhikrId ?? log.customDhikrId;
}

function isObjectIdLike(value: string) {
  return /^[a-fA-F0-9]{24}$/.test(value);
}
