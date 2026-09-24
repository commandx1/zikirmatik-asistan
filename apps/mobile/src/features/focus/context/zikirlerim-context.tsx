import { createContext, useCallback, useContext, useEffect, useMemo, useState, type PropsWithChildren } from "react";
import { useStableCallback } from "../../../hooks/use-stable-callback";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { i18n, useAppLocale } from "../../../i18n";
import { useAuthStore } from "../../../store/auth-store";
import { useDhikrStore } from "../../../store/dhikr-store";
import { resolveLocalizedText, toDateKey, type LocalizedText } from "@zikirmatik/shared";
import { buildDhikrLogPayload } from "../../dhikrs/services/dhikr-log-payload";
import { isObjectId as isObjectIdLike } from "../../dhikrs/services/dhikr-ids";
import { dhikrDisplayName as dhikrDisplayNamePure } from "../../dhikrs/services/dhikr-display";
import { useProfileStore } from "../../../store/profile-store";
import { toIntlLocale } from "../../../lib/locale-format";
import {
  createDhikrLog,
  deleteDhikrLogsByKey,
  setDhikrFavoriteByKey,
  type BackendDhikrLog
} from "../../dhikrs/services/dhikr-logs-api-client";
import { shouldConfirmUnsavedDhikrTransition } from "../../home/services/unsaved-transition-guard";
import { usePendingTransition } from "../../home/hooks/use-pending-transition";
import {
  deleteUserDhikrByClientId,
  updateUserDhikrByClientId
} from "../../dhikrs/services/user-dhikrs-api-client";
import type { ZikirFilterKey, ZikirItem } from "../types";
import { queryClient } from "../../../lib/query-client";
import { qk } from "../../../lib/query-keys";
import { dhikrLogsQueryFn } from "../../dhikrs/services/dhikr-queries";

const NO_LOGS: BackendDhikrLog[] = [];

type UpdateDhikrValues = {
  name: string;
  transliteration: string;
  meaning: string;
  target: number;
};

type ZikirlerimStateValue = {
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
};

/** Stable callbacks only — subscribing to this never re-renders on list/state changes. */
type ZikirlerimActionsValue = {
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

const ZikirlerimStateContext = createContext<ZikirlerimStateValue | null>(null);
const ZikirlerimActionsContext = createContext<ZikirlerimActionsValue | null>(null);

type PendingFocusTransition = { kind: "select"; id: string } | { kind: "startHome"; id: string };

export function ZikirlerimProvider({ children }: PropsWithChildren) {
  const { t } = useTranslation("focus");
  const locale = useAppLocale();
  const dhikrDisplayName = useCallback(
    (item: { name: LocalizedText | string; transliteration: LocalizedText | string }) =>
      dhikrDisplayNamePure(item, locale),
    [locale]
  );
  const router = useRouter();
  const filters = useMemo<Array<{ key: ZikirFilterKey; label: string }>>(
    () => [
      { key: "all", label: t("focus:filters.all") },
      { key: "active", label: t("focus:filters.active") },
      { key: "completed", label: t("focus:filters.completed") },
      { key: "favorites", label: t("focus:filters.favorites") }
    ],
    [t]
  );
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingDhikrId, setDeletingDhikrId] = useState("");
  const [editingDhikrId, setEditingDhikrId] = useState("");
  const [isUpdatingDhikr, setIsUpdatingDhikr] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);
  const [isSavingUnsavedTransition, setIsSavingUnsavedTransition] = useState(false);
  const [unsavedTransitionError, setUnsavedTransitionError] = useState<string | null>(null);

  // Loglar React Query cache'inde (qk.dhikrLogs) — useDhikrBackendSync ile
  // aynı anahtar. Yerel güncellemeler setQueryData ile aynı cache'e yazılır.
  const isLogsEnabled = authStatus === "authenticated" && !!sessionUserId;
  const logsQuery = useQuery(
    {
      queryKey: qk.dhikrLogs(sessionUserId),
      queryFn: dhikrLogsQueryFn(sessionUserId as string),
      enabled: isLogsEnabled
    },
    queryClient
  );
  // Eskiden fetch hatası listeyi boşaltırdı; aynı görünür sonuç korunur.
  const logs = !isLogsEnabled || logsQuery.error ? NO_LOGS : logsQuery.data ?? NO_LOGS;
  const setLogs = useCallback(
    (updater: (prev: BackendDhikrLog[]) => BackendDhikrLog[]) => {
      if (!sessionUserId) {
        return;
      }
      queryClient.setQueryData<BackendDhikrLog[]>(qk.dhikrLogs(sessionUserId), (prev) => updater(prev ?? []));
    },
    [sessionUserId]
  );
  const refetchLogs = logsQuery.refetch;

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
  }, [authStatus, lastSavedBackendLog, sessionUserId, setLogs]);

  const refresh = useStableCallback(async () => {
    if (!isLogsEnabled) {
      return;
    }
    setIsRefreshing(true);
    try {
      await refetchLogs();
    } finally {
      setIsRefreshing(false);
    }
  });

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
        name: resolveLocalizedText(
          matched?.name ?? latestLog.customDhikrName ?? matched?.transliteration ?? t("focus:fallback.savedDhikr"),
          locale
        ),
        arabic: matched?.arabic ?? latestLog.customDhikrArabic,
        transliteration: matched?.transliteration ?? latestLog.customDhikrName ?? t("focus:fallback.savedDhikr"),
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
  }, [authStatus, items, locale, logs, t, unsavedProgressDhikrIds]);

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

  const closeUpdateModal = useStableCallback(() => {
    if (isUpdatingDhikr) {
      return;
    }

    setEditingDhikrId("");
    setUpdateError(null);
  });

  const saveDhikrUpdate = useStableCallback(
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
        name: trimmedName,
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
          await updateUserDhikrByClientId(editingDhikr.id, {
            name: trimmedName,
            transliteration: trimmedTransliteration || undefined,
            meaning: trimmedMeaning || undefined,
            target: nextTarget
          });
        }

        setEditingDhikrId("");
        setUpdateError(null);
      } catch {
        upsertPersonalDhikr({
          id: previousSnapshot.id,
          name: resolveLocalizedText(previousSnapshot.name, locale),
          transliteration: resolveLocalizedText(previousSnapshot.transliteration, locale),
          arabic: previousSnapshot.arabic,
          meaning: previousSnapshot.meaning ? resolveLocalizedText(previousSnapshot.meaning, locale) : undefined,
          current: previousSnapshot.current,
          target: previousSnapshot.target,
          lastActivityLabel: previousSnapshot.lastActivityLabel,
          isFavorite: previousSnapshot.isFavorite
        });
        setUpdateError(t("focus:errors.dhikrUpdateFailed"));
      } finally {
        setIsUpdatingDhikr(false);
      }
    }
  );

  const selectDhikrImmediately = (id: string) => {
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
            name: resolveLocalizedText(fallbackPersonal.name, locale),
            transliteration: resolveLocalizedText(fallbackPersonal.transliteration, locale),
            arabic: fallbackPersonal.arabic,
            meaning: fallbackPersonal.meaning ? resolveLocalizedText(fallbackPersonal.meaning, locale) : undefined,
            current: fallbackPersonal.current,
            target: fallbackPersonal.target,
            lastActivityLabel: fallbackPersonal.lastActivityLabel,
            isFavorite: fallbackPersonal.isFavorite
          });
        }
      }
    }

    storeSelectDhikr(id);
  };

  const saveSelectedDhikrProgress = async () => {
    const selectedItem = items.find((item) => item.id === selectedDhikrId);
    if (!selectedItem) {
      return true;
    }

    if (authStatus !== "authenticated" || !sessionUserId) {
      const message = t("focus:errors.loginRequiredToSave");
      setSyncError(message);
      setUnsavedTransitionError(message);
      return false;
    }

    const safeCount = Math.max(0, Math.floor(selectedItem.current));
    const payload = buildDhikrLogPayload(selectedItem, {
      userId: sessionUserId,
      displayName: dhikrDisplayName(selectedItem),
      count: safeCount,
      // Custom dhikrs are always sent as not completed here (unlike home);
      // pre-existing divergence, kept as is.
      isCompleted: isObjectIdLike(selectedItem.id) && selectedItem.target > 0 && safeCount >= selectedItem.target
    });

    setIsSavingUnsavedTransition(true);
    setUnsavedTransitionError(null);
    setSyncError(undefined);
    try {
      const savedLog = await createDhikrLog(payload);
      applySavedBackendLog(savedLog);
      return true;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t("focus:errors.dhikrLogSaveFailed");
      setSyncError(message);
      setUnsavedTransitionError(message);
      return false;
    } finally {
      setIsSavingUnsavedTransition(false);
    }
  };

  const runFocusTransition = (transition: PendingFocusTransition) => {
    selectDhikrImmediately(transition.id);
    if (transition.kind === "startHome") {
      router.push("/(tabs)/home");
    }
  };

  const unsavedTransition = usePendingTransition<PendingFocusTransition>({
    run: runFocusTransition,
    discard: () => discardUnsavedProgress(selectedDhikrId),
    save: saveSelectedDhikrProgress,
    isSaving: isSavingUnsavedTransition,
    setError: setUnsavedTransitionError
  });

  const requestFocusTransition = (transition: PendingFocusTransition) =>
    unsavedTransition.request(
      transition,
      shouldConfirmUnsavedDhikrTransition({
        selectedDhikrId,
        targetDhikrId: transition.id,
        unsavedProgressDhikrIds
      })
    );

  const toggleFavorite = useStableCallback((id: string) => {
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
        ? updateUserDhikrByClientId(id, { isFavorite: nextFavorite })
        : setDhikrFavoriteByKey(
            isObjectIdLike(id)
              ? { dhikrId: id, isFavorite: nextFavorite }
              : { customDhikrId: id, isFavorite: nextFavorite }
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
  });

  const deleteDhikr = useStableCallback(async (item: ZikirItem) => {
    if (!item.id || deletingDhikrId === item.id) {
      return;
    }

    setDeletingDhikrId(item.id);
    try {
      if (authStatus === "authenticated" && sessionUserId) {
        if (item.source === "personal") {
          await deleteUserDhikrByClientId(item.id);
        }

        const deletePayload = isObjectIdLike(item.id)
          ? { dhikrId: item.id }
          : { customDhikrId: item.id };
        await deleteDhikrLogsByKey(deletePayload);
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
  });

  const openUpdateModal = useStableCallback((item: ZikirItem) => {
    if (item.source !== "personal") {
      return;
    }
    setEditingDhikrId(item.id);
    setUpdateError(null);
  });

  const selectDhikr = useStableCallback((id: string) => requestFocusTransition({ kind: "select", id }));
  const startDhikrOnHome = useStableCallback((id: string) => requestFocusTransition({ kind: "startHome", id }));
  const clearUpdateError = useCallback(() => {
    setUpdateError(null);
  }, []);

  const selectedStoreItem = items.find((item) => item.id === selectedDhikrId);
  const unsavedTransitionDhikrName =
    (selectedStoreItem ? dhikrDisplayName(selectedStoreItem) : "") || t("focus:fallback.thisDhikr");
  const unsavedTransitionCount = selectedStoreItem?.current ?? 0;

  const state = useMemo<ZikirlerimStateValue>(
    () => ({
      filters,
      activeFilter,
      items: visibleItems,
      selectedDhikrId,
      deletingDhikrId,
      editingDhikr,
      isUpdateOpen: Boolean(editingDhikr),
      isUpdatingDhikr,
      updateError,
      isUnsavedTransitionOpen: Boolean(unsavedTransition.pending),
      isSavingUnsavedTransition,
      unsavedTransitionDhikrName,
      unsavedTransitionCount,
      unsavedTransitionError,
      isRefreshing
    }),
    [
      filters, activeFilter, visibleItems, selectedDhikrId, deletingDhikrId, editingDhikr, isUpdatingDhikr,
      updateError, unsavedTransition.pending, isSavingUnsavedTransition, unsavedTransitionDhikrName,
      unsavedTransitionCount, unsavedTransitionError, isRefreshing
    ]
  );

  const actions = useMemo<ZikirlerimActionsValue>(
    () => ({
      refresh,
      setActiveFilter,
      toggleFavorite,
      selectDhikr,
      startDhikrOnHome,
      cancelUnsavedTransition: unsavedTransition.cancel,
      saveAndContinueUnsavedTransition: unsavedTransition.saveAndContinue,
      continueWithoutSavingUnsavedTransition: unsavedTransition.continueWithoutSaving,
      deleteDhikr,
      openUpdateModal,
      closeUpdateModal,
      clearUpdateError,
      saveDhikrUpdate
    }),
    [
      refresh, toggleFavorite, selectDhikr, startDhikrOnHome, unsavedTransition.cancel,
      unsavedTransition.saveAndContinue, unsavedTransition.continueWithoutSaving, deleteDhikr, openUpdateModal,
      closeUpdateModal, clearUpdateError, saveDhikrUpdate
    ]
  );

  return (
    <ZikirlerimActionsContext.Provider value={actions}>
      <ZikirlerimStateContext.Provider value={state}>{children}</ZikirlerimStateContext.Provider>
    </ZikirlerimActionsContext.Provider>
  );
}

export function useZikirlerimState() {
  const context = useContext(ZikirlerimStateContext);
  if (!context) {
    throw new Error("useZikirlerimState must be used within ZikirlerimProvider");
  }
  return context;
}

export function useZikirlerimActions() {
  const context = useContext(ZikirlerimActionsContext);
  if (!context) {
    throw new Error("useZikirlerimActions must be used within ZikirlerimProvider");
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
    return i18n.t("focus:relativeDate.saved");
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
    return i18n.t("focus:relativeDate.today");
  }

  if (normalized.getTime() === yesterday.getTime()) {
    return i18n.t("focus:relativeDate.yesterday");
  }

  return normalized.toLocaleDateString(toIntlLocale(useProfileStore.getState().locale));
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

