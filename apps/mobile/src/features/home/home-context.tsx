import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useAuthStore } from "../../store/auth-store";
import { MAX_DHIKR_TARGET, useDhikrStore } from "../../store/dhikr-store";
import type { ZikirSource } from "../focus/types";
import { createDhikrLog, listDhikrLogsByUser, type BackendDhikrLog } from "../dhikrs/services/dhikr-logs-api-client";
import { createUserDhikr } from "../dhikrs/services/user-dhikrs-api-client";

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

const FREE_MODE_LABEL = "Serbest";

type HomeContextValue = {
  greeting: string;
  streakLabel: string;
  isSavingLog: boolean;
  isRefreshing: boolean;
  syncError?: string;
  isTargetMode: boolean;
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
  isFreeSaveNameModalOpen: boolean;
  freeSaveNameDraft: string;
  freeSaveTransliterationDraft: string;
  freeSaveMeaningDraft: string;
  freeSaveNameError: string | null;
  freeSaveTargetDraft: string;
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
  onFreeSaveNameChange: (value: string) => void;
  onFreeSaveTransliterationChange: (value: string) => void;
  onFreeSaveMeaningChange: (value: string) => void;
  onFreeSaveNameCancel: () => void;
  onFreeSaveNameSubmit: () => void;
  onFreeSaveTargetChange: (value: string) => void;
  onStartFreeMode: () => void;
};

const HomeContext = createContext<HomeContextValue | null>(null);

export function HomeProvider({ children }: { children: ReactNode }) {
  const items = useDhikrStore((state) => state.items);
  const selectedDhikrId = useDhikrStore((state) => state.selectedDhikrId);
  const selectDhikr = useDhikrStore((state) => state.selectDhikr);
  const clearSelectedDhikr = useDhikrStore((state) => state.clearSelectedDhikr);
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
  const sessionAccessToken = useAuthStore((state) => state.session?.accessToken);

  const selectedDhikr = useMemo(() => {
    return items.find((item) => item.id === selectedDhikrId);
  }, [items, selectedDhikrId]);

  const [activeQuickDhikr, setActiveQuickDhikr] = useState(selectedDhikr?.transliteration ?? "");
  const [demoCompleted, setDemoCompleted] = useState(false);
  const [isEditingTarget, setIsEditingTarget] = useState(false);
  const [targetDraft, setTargetDraft] = useState(selectedDhikr ? String(selectedDhikr.target) : "100");
  const [isSelectingDhikr, setIsSelectingDhikr] = useState(false);
  const [freeCount, setFreeCount] = useState(0);

  const [isCreatingDhikr, setIsCreatingDhikr] = useState(false);
  const [createNameDraft, setCreateNameDraft] = useState("");
  const [createArabicDraft, setCreateArabicDraft] = useState("");
  const [createTargetDraft, setCreateTargetDraft] = useState("33");
  const [createError, setCreateError] = useState<string | null>(null);
  const [isFreeSaveNameModalOpen, setFreeSaveNameModalOpen] = useState(false);
  const [freeSaveNameDraft, setFreeSaveNameDraft] = useState("");
  const [freeSaveTransliterationDraft, setFreeSaveTransliterationDraft] = useState("");
  const [freeSaveMeaningDraft, setFreeSaveMeaningDraft] = useState("");
  const [freeSaveNameError, setFreeSaveNameError] = useState<string | null>(null);
  const [freeSaveTargetDraft, setFreeSaveTargetDraft] = useState("");
  const [isSavingLog, setIsSavingLog] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [streakDays, setStreakDays] = useState(0);

  const fetchStreakDays = useCallback(async () => {
    if (authStatus !== "authenticated" || !sessionUserId) {
      setStreakDays(0);
      return;
    }

    try {
      const logs = await listDhikrLogsByUser(
        sessionUserId,
        undefined,
        undefined,
        sessionAccessToken
      );
      setStreakDays(calculateCompletionStreakDays(logs));
    } catch {
      // Keep the existing streak value when network is unavailable.
    }
  }, [authStatus, sessionAccessToken, sessionUserId]);

  useEffect(() => {
    if (!selectedDhikr) {
      setActiveQuickDhikr(FREE_MODE_LABEL);
      setIsEditingTarget(false);
      return;
    }

    setActiveQuickDhikr(selectedDhikr.transliteration);
    setTargetDraft(String(selectedDhikr.target > 0 ? selectedDhikr.target : 100));
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
    return Array.from(new Set([FREE_MODE_LABEL, ...primaryReady, ...personal]));
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
    const isTargetMode = Boolean(selectedDhikr && selectedDhikr.target > 0);

    const submitTarget = () => {
      if (!selectedDhikr) {
        setIsEditingTarget(false);
        return;
      }

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

    const closeFreeSaveName = () => {
      setFreeSaveNameModalOpen(false);
      setFreeSaveNameDraft("");
      setFreeSaveTransliterationDraft("");
      setFreeSaveMeaningDraft("");
      setFreeSaveNameError(null);
      setFreeSaveTargetDraft("");
    };

    const persistSelectedDhikrLog = ({
      countOverride,
    }: {
      countOverride?: number;
    } = {}) => {
      if (!selectedDhikr) {
        return;
      }

      const rawCount = Math.max(0, Math.floor(countOverride ?? selectedDhikr.current));
      const safeCount = selectedDhikr.target > 0
        ? Math.min(selectedDhikr.target, rawCount)
        : rawCount;
      const isCompleted = selectedDhikr.target > 0 && safeCount >= selectedDhikr.target;

      if (authStatus !== "authenticated" || !sessionUserId) {
        setSyncError("Kaydetmek için giriş yapmalısın.");
        return;
      }

      setIsSavingLog(true);
      setSyncError(undefined);
      const payload = isObjectId(selectedDhikr.id)
        ? {
            userId: sessionUserId,
            dhikrId: selectedDhikr.id,
            count: safeCount,
            targetCount: selectedDhikr.target,
            date: toDateKey(new Date()),
            source: "manual" as const,
            isCompleted,
            isFavorite: selectedDhikr.isFavorite
          }
        : {
            userId: sessionUserId,
            customDhikrId: selectedDhikr.id,
            customDhikrName: selectedDhikr.transliteration,
            customDhikrArabic: selectedDhikr.arabic,
            count: safeCount,
            targetCount: selectedDhikr.target,
            date: toDateKey(new Date()),
            source: "manual" as const,
            isCompleted: false,
            isFavorite: selectedDhikr.isFavorite
          };
      void createDhikrLog({
        ...payload
      }, sessionAccessToken)
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
      isTargetMode,
      count: selectedDhikr?.current ?? freeCount,
      target: selectedDhikr?.target ?? 0,
      progress: selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.current / selectedDhikr.target : 0,
      mainDhikr: {
        id: selectedDhikr?.id ?? "",
        source: selectedDhikr?.source ?? "personal",
        arabic: selectedDhikr?.arabic,
        turkish: selectedDhikr?.transliteration ?? "",
        meaning: selectedDhikr?.meaning
      },
      quickDhikrs,
      activeQuickDhikr,
      selectedSourceLabel: selectedDhikr
        ? selectedDhikr.source === "personal"
          ? "Kaynak: Zikirlerim"
          : "Kaynak: Hazır"
        : "Serbest Zikir",
      demoCompleted,
      isEditingTarget,
      targetDraft,
      isSelectingDhikr,
      readyDhikrs,
      personalDhikrs,
      selectedDhikrId: selectedDhikrId,
      isCreatingDhikr,
      createNameDraft,
      createArabicDraft,
      createTargetDraft,
      createError,
      isFreeSaveNameModalOpen,
      freeSaveNameDraft,
      freeSaveTransliterationDraft,
      freeSaveMeaningDraft,
      freeSaveNameError,
      freeSaveTargetDraft,
      refresh,
      onCountPress: () => {
        if (demoCompleted) {
          return;
        }

        if (!selectedDhikr) {
          setFreeCount((prev) => prev + 1);
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
          });
        }
      },
      onResetPress: () => {
        if (selectedDhikr) {
          resetSelected();
          return;
        }

        setFreeCount(0);
      },
      onTargetPress: () => {
        if (!selectedDhikr) {
          return;
        }

        setTargetDraft(String(selectedDhikr.target > 0 ? selectedDhikr.target : 100));
        setIsEditingTarget(true);
      },
      onTargetDraftChange: (next) => {
        const digits = next.replace(/\D+/g, "");
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length);
        setTargetDraft(trimmed);
      },
      onTargetCancel: () => {
        setTargetDraft(String(selectedDhikr && selectedDhikr.target > 0 ? selectedDhikr.target : 100));
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
        if (label === FREE_MODE_LABEL) {
          clearSelectedDhikr();
          setActiveQuickDhikr(FREE_MODE_LABEL);
          return;
        }

        setActiveQuickDhikr(label);
        const matched = items.find((item) => item.transliteration === label);
        if (matched) {
          selectDhikr(matched.id);
        }
      },
      onSavePress: () => {
        if (selectedDhikr) {
          persistSelectedDhikrLog();
          return;
        }

        if (freeCount <= 0) {
          setSyncError("Önce en az bir zikir çekmelisin.");
          return;
        }

        setSyncError(undefined);
        setFreeSaveNameModalOpen(true);
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
        const createdId = addCustomDhikr({
          name: trimmed,
          arabicOrPronunciation: createArabicDraft,
          target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
        });
        if (authStatus === "authenticated") {
          void createUserDhikr(
            {
              clientId: createdId,
              name: trimmed,
              transliteration: createArabicDraft.trim() || undefined,
              target: Number.isNaN(parsedTarget) ? 33 : parsedTarget
            },
            sessionAccessToken
          ).catch(() => {
            setSyncError("Zikir kaydı senkronize edilemedi.");
          });
        }
        closeCreate();
        setIsSelectingDhikr(false);
      },
      onFreeSaveNameChange: (next) => {
        setFreeSaveNameDraft(next);
        if (freeSaveNameError) {
          setFreeSaveNameError(null);
        }
      },
      onFreeSaveTransliterationChange: (next) => {
        setFreeSaveTransliterationDraft(next);
      },
      onFreeSaveMeaningChange: (next) => {
        setFreeSaveMeaningDraft(next);
      },
      onFreeSaveTargetChange: (next) => {
        const digits = next.replace(/\D+/g, "");
        const trimmed = digits.slice(0, String(MAX_DHIKR_TARGET).length);
        setFreeSaveTargetDraft(trimmed);
        if (freeSaveNameError) {
          setFreeSaveNameError(null);
        }
      },
      onFreeSaveNameCancel: closeFreeSaveName,
      onFreeSaveNameSubmit: () => {
        const trimmed = freeSaveNameDraft.trim();
        if (!trimmed) {
          setFreeSaveNameError("Zikir adı zorunlu.");
          return;
        }
        const parsedTarget = freeSaveTargetDraft.trim().length > 0
          ? Number.parseInt(freeSaveTargetDraft, 10)
          : undefined;
        if (parsedTarget !== undefined && (!Number.isFinite(parsedTarget) || parsedTarget <= 0)) {
          setFreeSaveNameError("Hedef girilecekse 1 veya daha büyük olmalı.");
          return;
        }

        const createdId = addCustomDhikr({
          name: trimmed,
          transliteration: freeSaveTransliterationDraft.trim() || undefined,
          meaning: freeSaveMeaningDraft.trim() || undefined,
          target: parsedTarget,
          initialCount: freeCount
        });
        closeFreeSaveName();
        if (authStatus !== "authenticated" || !sessionUserId) {
          setSyncError("Kalıcı kaydetmek için giriş yapmalısın.");
          setFreeCount(0);
          return;
        }

        setIsSavingLog(true);
        setSyncError(undefined);
        void createUserDhikr(
          {
            clientId: createdId,
            name: trimmed,
            transliteration: freeSaveTransliterationDraft.trim() || undefined,
            meaning: freeSaveMeaningDraft.trim() || undefined,
            target: parsedTarget ?? 0
          },
          sessionAccessToken
        )
          .then(() =>
            createDhikrLog({
              userId: sessionUserId,
              customDhikrId: createdId,
              customDhikrName: freeSaveTransliterationDraft.trim() || trimmed,
              count: freeCount,
              targetCount: parsedTarget ?? 0,
              date: toDateKey(new Date()),
              source: "manual",
              isCompleted: false
            }, sessionAccessToken)
          )
          .then((savedLog) => {
            applySavedBackendLog(savedLog);
            setFreeCount(0);
          })
          .catch((error: unknown) => {
            const message = error instanceof Error ? error.message : "Zikir kaydı kaydedilemedi.";
            setSyncError(message);
          })
          .finally(() => {
            setIsSavingLog(false);
          });
      },
      onStartFreeMode: () => {
        clearSelectedDhikr();
        setFreeCount(0);
        setSyncError(undefined);
      },
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
    freeCount,
    freeSaveNameDraft,
    freeSaveTransliterationDraft,
    freeSaveMeaningDraft,
    freeSaveNameError,
    freeSaveTargetDraft,
    incrementSelected,
    isSavingLog,
    isRefreshing,
    isCreatingDhikr,
    isEditingTarget,
    isSelectingDhikr,
    isFreeSaveNameModalOpen,
    items,
    personalDhikrs,
    quickDhikrs,
    readyDhikrs,
    refresh,
    resetSelected,
    syncError,
    selectDhikr,
    selectedDhikrId,
    selectedDhikr,
    sessionUserId,
    sessionAccessToken,
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
