import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { i18n } from "../i18n";
import { useProfileStore } from "./profile-store";
import { toIntlLocale } from "../lib/locale-format";
import { ZIKIR_ITEMS } from "../features/focus/data";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { AiDhikrContext, ZikirItem } from "../features/focus/types";

type CreateCustomDhikrInput = {
  id?: string;
  name: string;
  transliteration?: string;
  meaning?: string;
  arabicOrPronunciation?: string;
  target?: number;
  initialCount?: number;
};

type UnsavedProgressSnapshot = {
  current: number;
  target: number;
  lastActivityLabel: string;
  lastActivityAt?: string;
};

type DhikrStore = {
  items: ZikirItem[];
  selectedDhikrId: string;
  activeAiContext?: AiDhikrContext;
  selectedSource?: 'special-day';
  freeModeCount: number;
  freeModeTarget: number;
  unsavedProgressDhikrIds: string[];
  unsavedProgressSnapshots: Record<string, UnsavedProgressSnapshot>;
  isHydratedFromBackend: boolean;
  lastSavedBackendLog?: BackendDhikrLog;
  syncError?: string;
  selectDhikr: (id: string, aiContext?: Omit<AiDhikrContext, "dhikrId">) => void;
  clearSelectedDhikr: () => void;
  upsertPersonalDhikr: (item: {
    id: string;
    nameTurkish: string;
    transliteration: string;
    arabic?: string;
    meaning?: string;
    current: number;
    target: number;
    lastActivityLabel?: string;
    isFavorite?: boolean;
  }) => void;
  upsertDhikrSnapshot: (item: ZikirItem) => void;
  toggleFavorite: (id: string) => void;
  addCustomDhikr: (input: CreateCustomDhikrInput) => string;
  removePersonalDhikr: (id: string) => void;
  clearDhikrProgress: (id: string) => void;
  incrementSelected: () => void;
  resetSelected: () => void;
  setSelectedCount: (count: number) => void;
  setSelectedTarget: (target: number) => void;
  discardUnsavedProgress: (id: string) => void;
  incrementFreeMode: () => void;
  resetFreeMode: () => void;
  clearFreeModeSession: () => void;
  setFreeModeTarget: (target: number) => void;
  hydrateReadyItems: (
    items: Array<{
      id: string;
      nameTurkish: string;
      arabic?: string;
      transliteration: string;
      meaning?: string;
      virtue?: string;
      contentSource?: string;
      aiPrompt?: string;
      aiAssistantNote?: string;
      aiRecommendationId?: string;
      target: number;
      current?: number;
      lastActivityLabel?: string;
      isFavorite?: boolean;
    }>
  ) => void;
  hydratePersonalItems: (
    items: Array<{
      id: string;
      nameTurkish: string;
      transliteration: string;
      arabic?: string;
      meaning?: string;
      target: number;
      current?: number;
      lastActivityLabel?: string;
      isFavorite?: boolean;
    }>
  ) => void;
  setSelectedSource: (source: 'special-day' | undefined) => void;
  applySavedBackendLog: (log: BackendDhikrLog) => void;
  setSyncError: (message?: string) => void;
  resetSessionScoped: () => void;
};

export const MAX_DHIKR_TARGET = 9999;

function formatLastActivityLabel(now: Date = new Date()) {
  const time = now.toLocaleTimeString(toIntlLocale(useProfileStore.getState().locale), {
    hour: "2-digit",
    minute: "2-digit"
  });

  return i18n.t("focus:relativeDate.todayAt", { time });
}

function slugify(value: string) {
  const normalized = value
    .toLocaleLowerCase(toIntlLocale(useProfileStore.getState().locale))
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return normalized.length > 0 ? normalized : "zikir";
}

function normalizeTarget(target: number | undefined) {
  if (typeof target !== "number" || Number.isNaN(target)) {
    return 33;
  }

  return Math.max(1, Math.min(MAX_DHIKR_TARGET, Math.floor(target)));
}

function resolveCustomTarget(target: number | undefined) {
  if (typeof target !== "number" || Number.isNaN(target)) {
    return 0;
  }

  if (target <= 0) {
    return 0;
  }

  return normalizeTarget(target);
}

const INITIAL_ITEMS = ZIKIR_ITEMS;

function addUnique(values: string[], value: string) {
  return values.includes(value) ? values : [...values, value];
}

function removeValue(values: string[], value: string | undefined) {
  return value ? values.filter((item) => item !== value) : values;
}

function markUnsavedProgress(
  unsavedIds: string[],
  snapshots: Record<string, UnsavedProgressSnapshot>,
  item: ZikirItem | undefined
) {
  if (!item) {
    return {
      unsavedProgressDhikrIds: unsavedIds,
      unsavedProgressSnapshots: snapshots
    };
  }

  return {
    unsavedProgressDhikrIds: addUnique(unsavedIds, item.id),
    unsavedProgressSnapshots: snapshots[item.id]
      ? snapshots
      : {
          ...snapshots,
          [item.id]: {
            current: item.current,
            target: item.target,
            lastActivityLabel: item.lastActivityLabel,
            lastActivityAt: item.lastActivityAt
          }
        }
  };
}

function clearUnsavedSnapshot(
  unsavedIds: string[],
  snapshots: Record<string, UnsavedProgressSnapshot>,
  id: string | undefined
) {
  if (!id) {
    return {
      unsavedProgressDhikrIds: unsavedIds,
      unsavedProgressSnapshots: snapshots
    };
  }

  const remainingSnapshots = { ...snapshots };
  delete remainingSnapshots[id];
  return {
    unsavedProgressDhikrIds: removeValue(unsavedIds, id),
    unsavedProgressSnapshots: remainingSnapshots
  };
}

const safeAsyncStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  }
};

export const useDhikrStore = create<DhikrStore>()(
  persist((set, get) => ({
    items: INITIAL_ITEMS,
    selectedDhikrId: "",
    activeAiContext: undefined,
    selectedSource: undefined,
    freeModeCount: 0,
    freeModeTarget: 0,
    unsavedProgressDhikrIds: [],
    unsavedProgressSnapshots: {},
    isHydratedFromBackend: false,
    lastSavedBackendLog: undefined,
    selectDhikr: (id, aiContext) => {
    if (!get().items.some((item) => item.id === id)) {
      return;
    }

    set({
      selectedDhikrId: id,
      activeAiContext: aiContext
        ? {
            dhikrId: id,
            ...aiContext
          }
        : undefined,
      selectedSource: undefined,
    });
  },
  clearSelectedDhikr: () => set({ selectedDhikrId: "", activeAiContext: undefined, selectedSource: undefined }),
  setSelectedSource: (source) => set({ selectedSource: source }),
  upsertPersonalDhikr: (item) =>
    set((state) => {
      const existing = state.items.find((value) => value.id === item.id);
      const normalizedTarget = item.target > 0 ? normalizeTarget(item.target) : 0;
      const normalizedCurrent = Math.max(0, Math.floor(item.current));

      if (existing) {
        return {
          items: state.items.map((value) =>
            value.id === item.id
              ? {
                  ...value,
                  source: "personal",
                  nameTurkish: item.nameTurkish,
                  transliteration: item.transliteration,
                  arabic: item.arabic,
                  meaning: item.meaning,
                  current: normalizedTarget > 0 ? Math.min(normalizedCurrent, normalizedTarget) : normalizedCurrent,
                  target: normalizedTarget,
                  lastActivityLabel: item.lastActivityLabel ?? value.lastActivityLabel,
                  lastActivityAt: value.lastActivityAt,
                  isFavorite: item.isFavorite ?? value.isFavorite
                }
              : value
          )
        };
      }

      const nextPersonal: ZikirItem = {
        id: item.id,
        source: "personal",
        nameTurkish: item.nameTurkish,
        transliteration: item.transliteration,
        arabic: item.arabic,
        meaning: item.meaning,
        current: normalizedTarget > 0 ? Math.min(normalizedCurrent, normalizedTarget) : normalizedCurrent,
        target: normalizedTarget,
        lastActivityLabel: item.lastActivityLabel ?? i18n.t("focus:relativeDate.saved"),
        streakDays: 0,
        isFavorite: Boolean(item.isFavorite)
      };

      return {
        items: [nextPersonal, ...state.items]
      };
    }),
  upsertDhikrSnapshot: (item) =>
    set((state) => {
      const normalizedTarget = item.source === "personal"
        ? resolveCustomTarget(item.target)
        : normalizeTarget(item.target);
      const normalizedCurrentRaw = Math.max(0, Math.floor(item.current));
      const normalizedCurrent = normalizedTarget > 0
        ? Math.min(normalizedCurrentRaw, normalizedTarget)
        : normalizedCurrentRaw;
      const existing = state.items.find((value) => value.id === item.id);

      if (existing) {
        return {
          items: state.items.map((value) =>
            value.id === item.id
              ? {
                  ...value,
                  source: item.source,
                  nameTurkish: item.nameTurkish,
                  arabic: item.arabic,
                  transliteration: item.transliteration,
                  meaning: item.meaning,
                  virtue: item.virtue,
                  contentSource: item.contentSource,
                  current: normalizedCurrent,
                  target: normalizedTarget,
                  lastActivityLabel: item.lastActivityLabel,
                  lastActivityAt: item.lastActivityAt,
                  isFavorite: item.isFavorite
                }
              : value
          )
        };
      }

      return {
        items: [
          {
            ...item,
            current: normalizedCurrent,
            target: normalizedTarget
          },
          ...state.items
        ]
      };
    }),
  toggleFavorite: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    })),
  addCustomDhikr: (input) => {
    const name = input.name.trim();
    if (!name) {
      return get().selectedDhikrId;
    }
    const transliteration = input.transliteration?.trim() || name;
    const meaning = input.meaning?.trim() || undefined;

    const id = input.id?.trim() || `personal-${slugify(name)}-${Date.now().toString(36)}`;
    const hasInitialCount = Math.max(0, Math.floor(input.initialCount ?? 0)) > 0;
    const now = new Date();
    const custom: ZikirItem = {
      id,
      source: "personal",
      nameTurkish: name,
      transliteration,
      arabic: input.arabicOrPronunciation?.trim() || undefined,
      meaning,
      current: Math.max(0, Math.floor(input.initialCount ?? 0)),
      target: resolveCustomTarget(input.target),
      lastActivityLabel: hasInitialCount ? formatLastActivityLabel(now) : i18n.t("focus:relativeDate.notStarted"),
      lastActivityAt: hasInitialCount ? now.toISOString() : undefined,
      streakDays: 0,
      isFavorite: false
    };

    set((state) => ({
      items: [custom, ...state.items],
      selectedDhikrId: id
    }));

    return id;
  },
  removePersonalDhikr: (id) =>
    set((state) => {
      const item = state.items.find((value) => value.id === id);
      if (!item || item.source !== "personal") {
        return {};
      }

      return {
        items: state.items.filter((value) => value.id !== id),
        selectedDhikrId: state.selectedDhikrId === id ? "" : state.selectedDhikrId,
        activeAiContext: state.activeAiContext?.dhikrId === id ? undefined : state.activeAiContext
      };
    }),
  clearDhikrProgress: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              current: 0,
              lastActivityLabel: i18n.t("focus:relativeDate.notStarted"),
              lastActivityAt: undefined
            }
          : item
      ),
      selectedDhikrId: state.selectedDhikrId === id ? "" : state.selectedDhikrId,
      activeAiContext: state.activeAiContext?.dhikrId === id ? undefined : state.activeAiContext
    })),
  incrementSelected: () =>
    set((state) => {
      let changedItem: ZikirItem | undefined;
      const items = state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const nextCount = item.target > 0 ? Math.min(item.target, item.current + 1) : item.current + 1;
        if (nextCount === item.current) {
          return item;
        }

        changedItem = item;
        const now = new Date();
        return {
          ...item,
          current: nextCount,
          lastActivityLabel: formatLastActivityLabel(now),
          lastActivityAt: now.toISOString()
        };
      });

      return {
        items,
        ...markUnsavedProgress(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, changedItem)
      };
    }),
  resetSelected: () =>
    set((state) => {
      let changedItem: ZikirItem | undefined;
      const items = state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        changedItem = item;
        const now = new Date();
        return {
          ...item,
          current: 0,
          lastActivityLabel: formatLastActivityLabel(now),
          lastActivityAt: now.toISOString()
        };
      });

      return {
        items,
        ...markUnsavedProgress(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, changedItem)
      };
    }),
  setSelectedCount: (count) =>
    set((state) => {
      let changedItem: ZikirItem | undefined;
      const items = state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const safeCount = item.target > 0
          ? Math.max(0, Math.min(item.target, Math.floor(count)))
          : Math.max(0, Math.floor(count));
        changedItem = item;
        const now = new Date();
        return {
          ...item,
          current: safeCount,
          lastActivityLabel: formatLastActivityLabel(now),
          lastActivityAt: now.toISOString()
        };
      });

      return {
        items,
        ...markUnsavedProgress(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, changedItem)
      };
    }),
  setSelectedTarget: (target) =>
    set((state) => {
      let changedItem: ZikirItem | undefined;
      const items = state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const safeTarget = normalizeTarget(target);
        changedItem = item;
        return {
          ...item,
          target: safeTarget,
          current: Math.min(item.current, safeTarget)
        };
      });

      return {
        items,
        ...markUnsavedProgress(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, changedItem)
      };
    }),
  discardUnsavedProgress: (id) =>
    set((state) => {
      const snapshot = state.unsavedProgressSnapshots[id];
      if (!snapshot) {
        return clearUnsavedSnapshot(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, id);
      }

      return {
        items: state.items.map((item) =>
          item.id === id
            ? {
                ...item,
                current: snapshot.current,
                target: snapshot.target,
                lastActivityLabel: snapshot.lastActivityLabel,
                lastActivityAt: snapshot.lastActivityAt
              }
            : item
        ),
        ...clearUnsavedSnapshot(state.unsavedProgressDhikrIds, state.unsavedProgressSnapshots, id)
      };
    }),
  incrementFreeMode: () =>
    set((state) => {
      const nextCount =
        state.freeModeTarget > 0 ? Math.min(state.freeModeTarget, state.freeModeCount + 1) : state.freeModeCount + 1;

      if (nextCount === state.freeModeCount) {
        return {};
      }

      return {
        freeModeCount: nextCount
      };
    }),
  resetFreeMode: () => set({ freeModeCount: 0 }),
  clearFreeModeSession: () => set({ freeModeCount: 0, freeModeTarget: 0 }),
  setFreeModeTarget: (target) =>
    set((state) => {
      const safeTarget = resolveCustomTarget(target);
      return {
        freeModeTarget: safeTarget,
        freeModeCount: safeTarget > 0 ? Math.min(state.freeModeCount, safeTarget) : state.freeModeCount
      };
    }),
  hydrateReadyItems: (readyItems) =>
    set((state) => {
      if (readyItems.length === 0) {
        return {
          isHydratedFromBackend: true
        };
      }

      const personalItems = state.items.filter((item) => item.source === "personal");
      const normalizedReady: ZikirItem[] = readyItems.map((item) => {
        const existing = state.items.find((value) => value.id === item.id && value.source === "ready");
        const normalizedTarget = normalizeTarget(item.target);
        const hasUnsavedProgress = state.unsavedProgressDhikrIds.includes(item.id);
        const rawCurrent = Math.max(
          0,
          Math.floor(hasUnsavedProgress ? (existing?.current ?? 0) : (typeof item.current === "number" ? item.current : (existing?.current ?? 0)))
        );
        const effectiveTarget = hasUnsavedProgress && existing ? existing.target : normalizedTarget;
        const normalizedCurrent = Math.min(rawCurrent, effectiveTarget);

        return {
          ...(existing ?? {}),
          id: item.id,
          source: "ready",
          nameTurkish: item.nameTurkish,
          arabic: item.arabic,
          transliteration: item.transliteration,
          meaning: item.meaning,
          virtue: item.virtue,
          contentSource: item.contentSource,
          aiPrompt: item.aiPrompt ?? (state.activeAiContext?.dhikrId === item.id ? state.activeAiContext.prompt : undefined),
          aiAssistantNote: item.aiAssistantNote ?? (state.activeAiContext?.dhikrId === item.id ? state.activeAiContext.assistantNote : undefined),
          aiRecommendationId: item.aiRecommendationId ?? (state.activeAiContext?.dhikrId === item.id ? state.activeAiContext.recommendationId : undefined),
          current: normalizedCurrent,
          target: effectiveTarget,
          lastActivityLabel: item.lastActivityLabel ?? existing?.lastActivityLabel ?? i18n.t("focus:relativeDate.notStarted"),
          streakDays: 0,
          isFavorite: typeof item.isFavorite === "boolean" ? item.isFavorite : (existing?.isFavorite ?? false)
        };
      });

      const nextItems = [...personalItems, ...normalizedReady];
      const hasCurrentSelection = nextItems.some((item) => item.id === state.selectedDhikrId);

      return {
        items: nextItems,
        selectedDhikrId: hasCurrentSelection ? state.selectedDhikrId : "",
        activeAiContext:
          hasCurrentSelection && state.activeAiContext?.dhikrId === state.selectedDhikrId
            ? state.activeAiContext
            : undefined,
        isHydratedFromBackend: true,
        syncError: undefined
      };
    }),
  hydratePersonalItems: (personalItems) =>
    set((state) => {
      const readyItems = state.items.filter((item) => item.source === "ready");
      const normalizedPersonal: ZikirItem[] = personalItems.map((item) => {
        const existing = state.items.find((value) => value.id === item.id && value.source === "personal");
        const normalizedTarget = resolveCustomTarget(item.target);
        const hasUnsavedProgress = state.unsavedProgressDhikrIds.includes(item.id);
        const rawCurrent = Math.max(
          0,
          Math.floor(hasUnsavedProgress ? (existing?.current ?? 0) : (typeof item.current === "number" ? item.current : (existing?.current ?? 0)))
        );
        const effectiveTarget = hasUnsavedProgress && existing ? existing.target : normalizedTarget;
        const normalizedCurrent = effectiveTarget > 0 ? Math.min(rawCurrent, effectiveTarget) : rawCurrent;

        return {
          ...(existing ?? {}),
          id: item.id,
          source: "personal",
          nameTurkish: item.nameTurkish.trim(),
          arabic: item.arabic?.trim() || undefined,
          transliteration: item.transliteration.trim(),
          meaning: item.meaning?.trim() || undefined,
          current: normalizedCurrent,
          target: effectiveTarget,
          lastActivityLabel: item.lastActivityLabel?.trim() || existing?.lastActivityLabel || i18n.t("focus:relativeDate.notStarted"),
          streakDays: 0,
          isFavorite: typeof item.isFavorite === "boolean" ? item.isFavorite : (existing?.isFavorite ?? false)
        };
      });

      const nextItems = [...normalizedPersonal, ...readyItems];

      return {
        items: nextItems,
        // Personal hydration is only one half of sync pipeline.
        // Keep current selection here to avoid transient deselection
        // before ready items are re-hydrated.
        selectedDhikrId: state.selectedDhikrId
      };
    }),
  applySavedBackendLog: (log) => set((state) => {
    const targetId = log.dhikrId ?? log.customDhikrId;
    const items = targetId
      ? state.items.map((item) =>
          item.id === targetId
            ? {
                ...item,
                aiPrompt: log.aiPrompt,
                aiAssistantNote: log.aiAssistantNote,
                aiRecommendationId: log.aiRecommendationId
              }
            : item
        )
      : state.items;

    return {
      items,
      lastSavedBackendLog: log,
      ...clearUnsavedSnapshot(
        state.unsavedProgressDhikrIds,
        state.unsavedProgressSnapshots,
        targetId
      )
    };
  }),
  setSyncError: (message) => set({ syncError: message }),
    resetSessionScoped: () =>
      set({
        items: INITIAL_ITEMS,
        selectedDhikrId: "",
        activeAiContext: undefined,
        freeModeCount: 0,
        freeModeTarget: 0,
        unsavedProgressDhikrIds: [],
        unsavedProgressSnapshots: {},
        isHydratedFromBackend: false,
        lastSavedBackendLog: undefined,
        syncError: undefined
      })
  }),
  {
    name: "dhikr-store-v1",
    storage: createJSONStorage(() => safeAsyncStorage),
    partialize: (state) => ({
      items: state.items,
      selectedDhikrId: state.selectedDhikrId,
      activeAiContext: state.activeAiContext,
      freeModeCount: state.freeModeCount,
      freeModeTarget: state.freeModeTarget,
      unsavedProgressDhikrIds: state.unsavedProgressDhikrIds,
      unsavedProgressSnapshots: state.unsavedProgressSnapshots
    })
  })
);
