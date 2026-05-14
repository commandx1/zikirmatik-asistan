import { create } from "zustand";
import { ZIKIR_ITEMS } from "../features/focus/data";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { ZikirItem } from "../features/focus/types";

type CreateCustomDhikrInput = {
  name: string;
  arabicOrPronunciation?: string;
  target?: number;
};

type DhikrStore = {
  items: ZikirItem[];
  selectedDhikrId: string;
  isHydratedFromBackend: boolean;
  lastSavedBackendLog?: BackendDhikrLog;
  syncError?: string;
  selectDhikr: (id: string) => void;
  toggleFavorite: (id: string) => void;
  addCustomDhikr: (input: CreateCustomDhikrInput) => string;
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
  applySavedBackendLog: (log: BackendDhikrLog) => void;
  setSyncError: (message?: string) => void;
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

const INITIAL_ITEMS = ZIKIR_ITEMS;

export const useDhikrStore = create<DhikrStore>((set, get) => ({
  items: INITIAL_ITEMS,
  selectedDhikrId: INITIAL_ITEMS[0]?.id ?? "",
  isHydratedFromBackend: false,
  lastSavedBackendLog: undefined,
  selectDhikr: (id) => {
    if (!get().items.some((item) => item.id === id)) {
      return;
    }

    set({ selectedDhikrId: id });
  },
  toggleFavorite: (id) =>
    set((state) => ({
      items: state.items.map((item) => (item.id === id ? { ...item, isFavorite: !item.isFavorite } : item))
    })),
  addCustomDhikr: (input) => {
    const name = input.name.trim();
    if (!name) {
      return get().selectedDhikrId;
    }

    const id = `personal-${slugify(name)}-${Date.now().toString(36)}`;
    const custom: ZikirItem = {
      id,
      source: "personal",
      transliteration: name,
      arabic: input.arabicOrPronunciation?.trim() || undefined,
      meaning: undefined,
      current: 0,
      target: normalizeTarget(input.target),
      lastActivityLabel: "Henüz başlanmadı",
      streakDays: 0,
      isFavorite: false
    };

    set((state) => ({
      items: [custom, ...state.items],
      selectedDhikrId: id
    }));

    return id;
  },
  incrementSelected: () =>
    set((state) => ({
      items: state.items.map((item) => {
        if (item.id !== state.selectedDhikrId) {
          return item;
        }

        const nextCount = Math.min(item.target, item.current + 1);
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

        const safeCount = Math.max(0, Math.min(item.target, Math.floor(count)));
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
        selectedDhikrId: hasCurrentSelection ? state.selectedDhikrId : nextItems[0]?.id ?? "",
        isHydratedFromBackend: true,
        syncError: undefined
      };
    }),
  applySavedBackendLog: (log) => set({ lastSavedBackendLog: log }),
  setSyncError: (message) => set({ syncError: message })
}));
