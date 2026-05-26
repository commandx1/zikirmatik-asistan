import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ZIKIR_ITEMS } from "../features/focus/data";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { ZikirItem } from "../features/focus/types";

type CreateCustomDhikrInput = {
  id?: string;
  name: string;
  transliteration?: string;
  meaning?: string;
  arabicOrPronunciation?: string;
  target?: number;
  initialCount?: number;
};

type DhikrStore = {
  items: ZikirItem[];
  selectedDhikrId: string;
  isHydratedFromBackend: boolean;
  lastSavedBackendLog?: BackendDhikrLog;
  syncError?: string;
  selectDhikr: (id: string) => void;
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
  hydrateReadyItems: (
    items: Array<{
      id: string;
      nameTurkish: string;
      arabic?: string;
      transliteration: string;
      meaning?: string;
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
  applySavedBackendLog: (log: BackendDhikrLog) => void;
  setSyncError: (message?: string) => void;
  resetSessionScoped: () => void;
};

export const MAX_DHIKR_TARGET = 999_999_999;

function formatLastActivityLabel() {
  const time = new Date().toLocaleTimeString("tr-TR", {
    hour: "2-digit",
    minute: "2-digit"
  });

  return `Bugün ${time}`;
}

function slugify(value: string) {
  const normalized = value
    .toLocaleLowerCase("tr-TR")
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
    isHydratedFromBackend: false,
    lastSavedBackendLog: undefined,
    selectDhikr: (id) => {
    if (!get().items.some((item) => item.id === id)) {
      return;
    }

    set({ selectedDhikrId: id });
  },
  clearSelectedDhikr: () => set({ selectedDhikrId: "" }),
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
        lastActivityLabel: item.lastActivityLabel ?? "Kayıtlı",
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
                  current: normalizedCurrent,
                  target: normalizedTarget,
                  lastActivityLabel: item.lastActivityLabel,
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
    const custom: ZikirItem = {
      id,
      source: "personal",
      nameTurkish: name,
      transliteration,
      arabic: input.arabicOrPronunciation?.trim() || undefined,
      meaning,
      current: Math.max(0, Math.floor(input.initialCount ?? 0)),
      target: resolveCustomTarget(input.target),
      lastActivityLabel: Math.max(0, Math.floor(input.initialCount ?? 0)) > 0 ? formatLastActivityLabel() : "Henüz başlanmadı",
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
        selectedDhikrId: state.selectedDhikrId === id ? "" : state.selectedDhikrId
      };
    }),
  clearDhikrProgress: (id) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === id
          ? {
              ...item,
              current: 0,
              lastActivityLabel: "Henüz başlanmadı"
            }
          : item
      ),
      selectedDhikrId: state.selectedDhikrId === id ? "" : state.selectedDhikrId
    })),
  incrementSelected: () =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const nextCount = item.target > 0 ? Math.min(item.target, item.current + 1) : item.current + 1;
        if (nextCount === item.current) {
          return item;
        }

        return {
          ...item,
          current: nextCount,
          lastActivityLabel: formatLastActivityLabel()
        };
      })
    })),
  resetSelected: () =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        return { ...item, current: 0, lastActivityLabel: formatLastActivityLabel() };
      })
    })),
  setSelectedCount: (count) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const safeCount = item.target > 0
          ? Math.max(0, Math.min(item.target, Math.floor(count)))
          : Math.max(0, Math.floor(count));
        return {
          ...item,
          current: safeCount,
          lastActivityLabel: formatLastActivityLabel()
        };
      })
    })),
  setSelectedTarget: (target) =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const safeTarget = normalizeTarget(target);
        return {
          ...item,
          target: safeTarget,
          current: Math.min(item.current, safeTarget)
        };
      })
    })),
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
        const rawCurrent = Math.max(
          0,
          Math.floor(typeof item.current === "number" ? item.current : (existing?.current ?? 0))
        );
        const normalizedCurrent = Math.min(rawCurrent, normalizedTarget);

        return {
          ...(existing ?? {}),
          id: item.id,
          source: "ready",
          nameTurkish: item.nameTurkish,
          arabic: item.arabic,
          transliteration: item.transliteration,
          meaning: item.meaning,
          current: normalizedCurrent,
          target: normalizedTarget,
          lastActivityLabel: item.lastActivityLabel ?? existing?.lastActivityLabel ?? "Henüz başlanmadı",
          streakDays: 0,
          isFavorite: typeof item.isFavorite === "boolean" ? item.isFavorite : (existing?.isFavorite ?? false)
        };
      });

      const nextItems = [...personalItems, ...normalizedReady];
      const hasCurrentSelection = nextItems.some((item) => item.id === state.selectedDhikrId);

      return {
        items: nextItems,
        selectedDhikrId: hasCurrentSelection ? state.selectedDhikrId : "",
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
        const rawCurrent = Math.max(
          0,
          Math.floor(typeof item.current === "number" ? item.current : (existing?.current ?? 0))
        );
        const normalizedCurrent = normalizedTarget > 0 ? Math.min(rawCurrent, normalizedTarget) : rawCurrent;

        return {
          ...(existing ?? {}),
          id: item.id,
          source: "personal",
          nameTurkish: item.nameTurkish.trim(),
          arabic: item.arabic?.trim() || undefined,
          transliteration: item.transliteration.trim(),
          meaning: item.meaning?.trim() || undefined,
          current: normalizedCurrent,
          target: normalizedTarget,
          lastActivityLabel: item.lastActivityLabel?.trim() || existing?.lastActivityLabel || "Henüz başlanmadı",
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
  applySavedBackendLog: (log) => set({ lastSavedBackendLog: log }),
  setSyncError: (message) => set({ syncError: message }),
    resetSessionScoped: () =>
      set({
        items: INITIAL_ITEMS,
        selectedDhikrId: "",
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
      selectedDhikrId: state.selectedDhikrId
    })
  })
);
