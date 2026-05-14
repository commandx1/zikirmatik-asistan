import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuthStore } from "../../store/auth-store";
import { MAX_DHIKR_TARGET, useDhikrStore } from "../../store/dhikr-store";
import type { ZikirSource } from "../focus/types";
import { createDhikrLog, listDhikrLogsByUser, type BackendDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";

type HomeDhikr = {
  id: string;
  source: ZikirSource;
  arabic?: string;
  turkish: string;
  meaning?: string;
};

type HomeDhikrOption = {
  id: string;
  source: ZikirSource;
  label: string;
  secondary?: string;
  target: number;
};

type HomeContextValue = {
  greeting: string;
  streakLabel: string;
  isSavingLog: boolean;
  isRefreshing: boolean;
  syncError?: string;
  count: number;
  target: number;
  progress: number;
  mainDhikr: HomeDhikr;
  quickDhikrs: string[];
  activeQuickDhikr: string;
  selectedSourceLabel: string;
  demoCompleted: boolean;
  isEditingTarget: boolean;
  targetDraft: string;
  isSelectingDhikr: boolean;
  readyDhikrs: HomeDhikrOption[];
  personalDhikrs: HomeDhikrOption[];
  selectedDhikrId: string;
  isCreatingDhikr: boolean;
  createNameDraft: string;
  createArabicDraft: string;
  createTargetDraft: string;
  createError: string | null;
  refresh: () => Promise<void>;
  onCountPress: () => void;
  onResetPress: () => void;
  onTargetPress: () => void;
  onTargetDraftChange: (value: string) => void;
  onTargetCancel: () => void;
  onTargetSubmit: () => void;
  onChangeDhikrPress: () => void;
  onCloseDhikrPicker: () => void;
  onSelectDhikr: (id: string) => void;
  onToggleDemoComplete: () => void;
  onQuickDhikrSelect: (label: string) => void;
  onSavePress: () => void;
  onOpenCreateDhikr: () => void;
  onCloseCreateDhikr: () => void;
  onCreateNameChange: (value: string) => void;
  onCreateArabicChange: (value: string) => void;
  onCreateTargetChange: (value: string) => void;
  onCreateSubmit: () => void;
};

const HomeContext = createContext<HomeContextValue | null>(null);

export function HomeProvider({ children }: { children: ReactNode }) {
  const items = useDhikrStore((state) => state.items);
  const selectedDhikrId = useDhikrStore((state) => state.selectedDhikrId);
  const selectDhikr = useDhikrStore((state) => state.selectDhikr);
  const incrementSelected = useDhikrStore((state) => state.incrementSelected);
  const resetSelected = useDhikrStore((state) => state.resetSelected);
  const setSelectedCount = useDhikrStore((state) => state.setSelectedCount);
  const setSelectedTarget = useDhikrStore((state) => state.setSelectedTarget);
  const addCustomDhikr = useDhikrStore((state) => state.addCustomDhikr);
  const applySavedBackendLog = useDhikrStore((state) => state.applySavedBackendLog);
  const lastSavedBackendLog = useDhikrStore((state) => state.lastSavedBackendLog);
  const syncError = useDhikrStore((state) => state.syncError);
  const setSyncError = useDhikrStore((state) => state.setSyncError);
  const authDisplayName = useAuthStore((state) => state.session?.displayName);
  const authStatus = useAuthStore((state) => state.status);
  const sessionUserId = useAuthStore((state) => state.session?.userId);

  const selectedDhikr = useMemo(() => {
    return items.find((item) => item.id === selectedDhikrId) ?? items[0];
  }, [items, selectedDhikrId]);

  const [activeQuickDhikr, setActiveQuickDhikr] = useState(selectedDhikr?.transliteration ?? "");
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : "100");
  const [isSelectingDhikr, setIsSelectingDhikr] = useState(false);

  const [isCreatingDhikr, setIsCreatingDhikr] = useState(false);
  const [createNameDraft, setCreateNameDraft] = useState("");
  const [createArabicDraft, setCreateArabicDraft] = useState("");
  const [createTargetDraft, setCreateTargetDraft] = useState("33");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== "authenticated" || !sessionUserId) {
      setStreakDays(0);
      return;
    }

    try {
      const logs = await listDhikrLogsByUser(sessionUserId);
      setStreakDays(calculateCompletionStreakDays(logs));
    } catch {
      // Keep the existing streak value when network is unavailable.
    }
  }, [authStatus, sessionUserId]);

  useEffect(() => {
    if (!selectedDhikr) {
      return;
    }

    setActiveQuickDhikr(selectedDhikr.transliteration);
    setTargetDraft(String(selectedDhikr.target));
  }, [selectedDhikr?.id, selectedDhikr?.target, selectedDhikr?.transliteration]);

  useEffect(() => {
    void fetchStreakDays();
  }, [fetchStreakDays]);

  useEffect(() => {
    if (authStatus !== "authenticated" || !sessionUserId || !lastSavedBackendLog) {
      return;
    }

    if (lastSavedBackendLog.userId !== sessionUserId) {
      return;
    }

    void fetchStreakDays();
  }, [authStatus, fetchStreakDays, lastSavedBackendLog, sessionUserId]);

  const readyDhikrs = useMemo<HomeDhikrOption[]>(
    () =>
      items
        .filter((item) => item.source === "ready")
        .map((item) => ({
          id: item.id,
          source: item.source,
          label: item.transliteration,
          secondary: item.arabic,
          target: item.target
        })),
    [items]
  );

  const personalDhikrs = useMemo<HomeDhikrOption[]>(
    () =>
      items
        .filter((item) => item.source === "personal")
        .map((item) => ({
          id: item.id,
          source: item.source,
          label: item.transliteration,
          secondary: item.arabic,
          target: item.target
        })),
    [items]
  );

  const quickDhikrs = useMemo(() => {
    const primaryReady = readyDhikrs.slice(0, 4).map((item) => item.label);
    const personal = personalDhikrs.map((item) => item.label);
    return Array.from(new Set([...primaryReady, ...personal]));
  }, [personalDhikrs, readyDhikrs]);

  const refresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      await fetchStreakDays();
    } finally {
      setIsRefreshing(false);
    }
  }, [fetchStreakDays]);

  const value = useMemo<HomeContextValue>(() => {
    const submitTarget = () => {
      const parsed = Number.parseInt(targetDraft, 10);
      if (!Number.isNaN(parsed) && parsed > 0) {
        setSelectedTarget(Math.min(parsed, MAX_DHIKR_TARGET));
      }
      setTargetDraft(String(!Number.isNaN(parsed) && parsed > 0 ? Math.min(parsed, MAX_DHIKR_TARGET) : selectedDhikr?.target ?? 33));
      setIsEditingTarget(false);
    };

    const closeCreate = () => {
      setIsCreatingDhikr(false);
      setCreateNameDraft("");
      setCreateArabicDraft("");
      setCreateTargetDraft("33");
      setCreateError(null);
    };

    const persistSelectedDhikrLog = ({
      countOverride,
      auto
    }: {
      countOverride?: number;
      auto?: boolean;
    } = {}) => {
      if (!selectedDhikr) {
        return;
      }

      const safeCount = Math.max(
        0,
        Math.min(selectedDhikr.target, Math.floor(countOverride ?? selectedDhikr.current))
      );
      const isCompleted = safeCount >= selectedDhikr.target;

      if (authStatus !== "authenticated" || !sessionUserId) {
        setSyncError("Kaydetmek için giriş yapmalısın.");
        return;
      }

      if (!isObjectId(selectedDhikr.id)) {
        if (!auto) {
          setSyncError("Kişisel zikirler backend'e kaydedilemez.");
        }
        return;
      }

      setIsSavingLog(true);
      setSyncError(undefined);
      void createDhikrLog({
        userId: sessionUserId,
        dhikrId: selectedDhikr.id,
        count: safeCount,
        targetCount: selectedDhikr.target,
        date: toDateKey(new Date()),
        source: "manual",
        isCompleted
      })
        .then((savedLog) => {
          applySavedBackendLog(savedLog);
        })
        .catch((error: unknown) => {
          const message = error instanceof Error ? error.message : "Zikir kaydı kaydedilemedi.";
          setSyncError(message);
        })
        .finally(() => {
          setIsSavingLog(false);
        });
    };

    return {
      greeting: `Selam, ${authDisplayName?.trim() || "Dostum"}`,
      streakLabel: `${streakDays} gün`,
      isSavingLog,
      isRefreshing,
      syncError,
      count: selectedDhikr?.current ?? 0,
      target: selectedDhikr?.target ?? 33,
      progress: selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.current / selectedDhikr.target : 0,
      mainDhikr: {
        id: selectedDhikr?.id ?? "",
        source: selectedDhikr?.source ?? "ready",
        arabic: selectedDhikr?.arabic,
        turkish: selectedDhikr?.transliteration ?? "",
        meaning: selectedDhikr?.meaning
      },
      quickDhikrs,
      activeQuickDhikr,
      selectedSourceLabel: selectedDhikr?.source === "personal" ? "Kaynak: Zikirlerim" : "Kaynak: Hazır",
      demoCompleted,
      isEditingTarget,
      targetDraft,
      isSelectingDhikr,
      readyDhikrs,
      personalDhikrs,
      selectedDhikrId: selectedDhikr?.id ?? "",
      isCreatingDhikr,
      createNameDraft,
      createArabicDraft,
      createTargetDraft,
      createError,
      refresh,
      onCountPress: () => {
        if (demoCompleted || !selectedDhikr) {
          return;
        }

        const willCompleteToday =
          selectedDhikr.target > 0 &&
          selectedDhikr.current < selectedDhikr.target &&
          selectedDhikr.current + 1 >= selectedDhikr.target;

        incrementSelected();

        if (willCompleteToday) {
          persistSelectedDhikrLog({
            countOverride: selectedDhikr.target,
            auto: true
          });
        }
      },
      onResetPress: resetSelected,
      onTargetPress: () => {
        setTargetDraft(String(selectedDhikr?.target ?? 33));
        setIsEditingTarget(true);
      },
      onTargetDraftChange: (next) => {
        const digits = next.replace(/\D+/g, "");
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length);
        setTargetDraft(trimmed);
      },
      onTargetCancel: () => {
        setTargetDraft(String(selectedDhikr?.target ?? 33));
        setIsEditingTarget(false);
      },
      onTargetSubmit: submitTarget,
      onChangeDhikrPress: () => setIsSelectingDhikr(true),
      onCloseDhikrPicker: () => setIsSelectingDhikr(false),
      onSelectDhikr: (id) => {
        selectDhikr(id);
        setIsSelectingDhikr(false);
      },
      onToggleDemoComplete: () => {
        setDemoCompleted((prev) => {
          const next = !prev;
          setSelectedCount(next ? selectedDhikr?.target ?? 0 : 0);
          return next;
        });
      },
      onQuickDhikrSelect: (label) => {
        setActiveQuickDhikr(label);
        const matched = items.find((item) => item.transliteration === label);
        if (matched) {
          selectDhikr(matched.id);
        }
      },
      onSavePress: () => {
        persistSelectedDhikrLog();
      },
      onOpenCreateDhikr: () => {
        setIsCreatingDhikr(true);
        setCreateError(null);
      },
      onCloseCreateDhikr: closeCreate,
      onCreateNameChange: (next) => {
        setCreateNameDraft(next);
        if (createError) {
          setCreateError(null);
        }
      },
      onCreateArabicChange: setCreateArabicDraft,
      onCreateTargetChange: (next) => setCreateTargetDraft(next.replace(/\D+/g, "")),
      onCreateSubmit: () => {
        const trimmed = createNameDraft.trim();
        if (!trimmed) {
          setCreateError("Zikir adı zorunlu.");
          return;
        }

        const parsedTarget = Number.parseInt(createTargetDraft, 10);
        addCustomDhikr({
          name: trimmed,
          arabicOrPronunciation: createArabicDraft,
          target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
        });
        closeCreate();
        setIsSelectingDhikr(false);
      }
    };
  }, [
    activeQuickDhikr,
    addCustomDhikr,
    applySavedBackendLog,
    createArabicDraft,
    createError,
    createNameDraft,
    createTargetDraft,
    demoCompleted,
    incrementSelected,
    isSavingLog,
    isRefreshing,
    isCreatingDhikr,
    isEditingTarget,
    isSelectingDhikr,
    items,
    personalDhikrs,
    quickDhikrs,
    readyDhikrs,
    refresh,
    resetSelected,
    syncError,
    selectDhikr,
    selectedDhikr,
    sessionUserId,
    setSyncError,
    streakDays,
    authDisplayName,
    authStatus,
    setSelectedCount,
    setSelectedTarget,
    targetDraft
  ]);

  return <HomeContext.Provider value={value}>{children}</HomeContext.Provider>;
}

export function useHomeContext() {
  const ctx = useContext(HomeContext);
  if (!ctx) {
    throw new Error("useHomeContext must be used within HomeProvider");
  }
  return ctx;
}

function isObjectId(value: string) {
  return /^[a-f\d]{24}$/i.test(value);
}

function toDateKey(value: Date) {
  const year = value.getFullYear();
  const month = String(value.getMonth() + 1).padStart(2, "0");
  const day = String(value.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function calculateCompletionStreakDays(logs: BackendDhikrLog[]) {
  if (logs.length === 0) {
    return 0;
  }

  const completionByDay = new Map<string, boolean>();
  const hasIncompleteOnlyByDay = new Map<string, boolean>();

  for (const log of logs) {
    const hasCompleted = completionByDay.get(log.date) ?? false;
    const hasIncompleteOnly = hasIncompleteOnlyByDay.get(log.date) ?? false;

    if (log.isCompleted) {
      completionByDay.set(log.date, true);
      hasIncompleteOnlyByDay.set(log.date, false);
      continue;
    }

    if (!hasCompleted) {
      hasIncompleteOnlyByDay.set(log.date, hasIncompleteOnly || true);
    }
  }

  const today = startOfDay(new Date());
  const todayKey = toDateKey(today);
  const todayCompleted = completionByDay.get(todayKey) === true;
  const todayIncompleteOnly = hasIncompleteOnlyByDay.get(todayKey) === true;

  if (todayIncompleteOnly && !todayCompleted) {
    return 0;
  }

  let cursor = todayCompleted ? today : new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1);
  let streak = 0;

  while (true) {
    const key = toDateKey(cursor);
    if (completionByDay.get(key) !== true) {
      break;
    }

    streak += 1;
    cursor = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate() - 1);
  }

  return streak;
}

function startOfDay(value: Date) {
  return new Date(value.getFullYear(), value.getMonth(), value.getDate());
}
