import { create } from "zustand";
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
    transliteration: string;
    arabic?: string;
    meaning?: string;
    current: number;
    target: number;
    lastActivityLabel?: string;
    isFavorite?: boolean;
  }) => void;
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
      transliteration: string;
      arabic?: string;
      meaning?: string;
      target: number;
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

  return normalizeTarget(target);
}

const INITIAL_ITEMS = ZIKIR_ITEMS;

export const useDhikrStore = create<DhikrStore>((set, get) => ({
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
      const normalizedReady: ZikirItem[] = readyItems.map((item) => ({
        id: item.id,
        source: "ready",
        arabic: item.arabic,
        transliteration: item.transliteration,
        meaning: item.meaning,
        current: Math.max(0, Math.floor(item.current ?? 0)),
        target: normalizeTarget(item.target),
        lastActivityLabel: item.lastActivityLabel ?? "Henüz başlanmadı",
        streakDays: 0,
        isFavorite: Boolean(item.isFavorite)
      }));

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
      const normalizedPersonal: ZikirItem[] = personalItems.map((item) => ({
        id: item.id,
        source: "personal",
        arabic: item.arabic?.trim() || undefined,
        transliteration: item.transliteration.trim(),
        meaning: item.meaning?.trim() || undefined,
        current: 0,
        target: resolveCustomTarget(item.target),
        lastActivityLabel: "Henüz başlanmadı",
        streakDays: 0,
        isFavorite: Boolean(item.isFavorite)
      }));

      const nextItems = [...normalizedPersonal, ...readyItems];
      const hasCurrentSelection = nextItems.some((item) => item.id === state.selectedDhikrId);

      return {
        items: nextItems,
        selectedDhikrId: hasCurrentSelection ? state.selectedDhikrId : ""
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
}));
