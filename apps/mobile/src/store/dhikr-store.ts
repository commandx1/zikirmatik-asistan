import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";
import { getDhikrStoreText } from "./dhikr-store-text";
import { ZIKIR_ITEMS } from "./dhikr-catalog-seed";
import type { BackendDhikrLog } from "../features/dhikrs/services/dhikr-logs-api-client";
import type { AiDhikrContext, ZikirItem } from "../features/focus/types";
import type { LocalizedText } from "@zikirmatik/shared";

function toLocalizedText(value: string): LocalizedText {
  return { tr: value, en: value };
}

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
  /** freeModeCount'un son artırıldığı an (ISO) — gün dönüşünde widget/istatistik
   * bugüne mi dünkü serbest sayıma mı sayacağını bununla ayırt eder (K3). */
  freeModeActivityAt?: string;
  freeModeTarget: number;
  // Serbest mod için tur ("lap") boyu — 33/99/özel. Seçili zikirlerde
  // eşdeğeri ZikirItem.lapSize'dır (bkz. setSelectedLapSize).
  freeModeLapSize: number;
  unsavedProgressDhikrIds: string[];
  unsavedProgressSnapshots: Record<string, UnsavedProgressSnapshot>;
  isHydratedFromBackend: boolean;
  lastSavedBackendLog?: BackendDhikrLog;
  syncError?: string;
  selectDhikr: (id: string, aiContext?: Omit<AiDhikrContext, "dhikrId">) => void;
  clearSelectedDhikr: () => void;
  upsertPersonalDhikr: (item: {
    id: string;
    name: string;
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
  setSelectedLapSize: (size: number) => void;
  discardUnsavedProgress: (id: string) => void;
  incrementFreeMode: () => void;
  resetFreeMode: () => void;
  clearFreeModeSession: () => void;
  setFreeModeTarget: (target: number) => void;
  setFreeModeLapSize: (size: number) => void;
  hydrateReadyItems: (
    items: Array<{
      id: string;
      name: LocalizedText;
      arabic?: string;
      transliteration: LocalizedText;
      meaning?: LocalizedText;
      virtue?: LocalizedText;
      contentSource?: LocalizedText;
      aiPrompt?: string;
      aiAssistantNote?: string;
      aiRecommendationId?: string;
      target: number;
      current?: number;
      lastActivityLabel?: string;
      lastActivityAt?: string;
      isFavorite?: boolean;
    }>
  ) => void;
  hydratePersonalItems: (
    items: Array<{
      id: string;
      name: string;
      transliteration: string;
      arabic?: string;
      meaning?: string;
      target: number;
      current?: number;
      lastActivityLabel?: string;
      lastActivityAt?: string;
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
  return getDhikrStoreText().todayAt(now);
}

function slugify(value: string) {
  const normalized = getDhikrStoreText()
    .lowercase(value)
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

function normalizeLapSize(size: number | undefined) {
  // Tur boyu için aynı sınırlar geçerli: 1..MAX_DHIKR_TARGET, varsayılan 33.
  return normalizeTarget(size);
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

export const useDhikrStore = create<DhikrStore>()(
  persist((set, get) => ({
    items: INITIAL_ITEMS,
    selectedDhikrId: "",
    activeAiContext: undefined,
    selectedSource: undefined,
    freeModeCount: 0,
    freeModeTarget: 0,
    freeModeLapSize: 33,
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
  clearSelectedDhikr: () =>
    set({ selectedDhikrId: "", activeAiContext: undefined, selectedSource: undefined }),
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
                  name: item.name,
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
        name: item.name,
        transliteration: item.transliteration,
        arabic: item.arabic,
        meaning: item.meaning,
        current: normalizedTarget > 0 ? Math.min(normalizedCurrent, normalizedTarget) : normalizedCurrent,
        target: normalizedTarget,
        lastActivityLabel: item.lastActivityLabel ?? getDhikrStoreText().saved(),
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
                  name: item.name,
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
      name,
      transliteration,
      arabic: input.arabicOrPronunciation?.trim() || undefined,
      meaning,
      current: Math.max(0, Math.floor(input.initialCount ?? 0)),
      target: resolveCustomTarget(input.target),
      lastActivityLabel: hasInitialCount ? formatLastActivityLabel(now) : getDhikrStoreText().notStarted(),
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
              lastActivityLabel: getDhikrStoreText().notStarted(),
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
  setSelectedLapSize: (size) =>
    set((state) => ({
      items: state.items.map((item) =>
        item.id === state.selectedDhikrId ? { ...item, lapSize: normalizeLapSize(size) } : item
      )
    })),
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
        freeModeCount: nextCount,
        freeModeActivityAt: new Date().toISOString()
      };
    }),
  resetFreeMode: () => set({ freeModeCount: 0, freeModeActivityAt: undefined }),
  clearFreeModeSession: () => set({ freeModeCount: 0, freeModeTarget: 0, freeModeActivityAt: undefined }),
  setFreeModeTarget: (target) =>
    set((state) => {
      const safeTarget = resolveCustomTarget(target);
      return {
        freeModeTarget: safeTarget,
        freeModeCount: safeTarget > 0 ? Math.min(state.freeModeCount, safeTarget) : state.freeModeCount
      };
    }),
  setFreeModeLapSize: (size) => set({ freeModeLapSize: normalizeLapSize(size) }),
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
          name: item.name,
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
          lastActivityLabel: item.lastActivityLabel ?? existing?.lastActivityLabel ?? getDhikrStoreText().notStarted(),
          lastActivityAt: hasUnsavedProgress ? existing?.lastActivityAt : (item.lastActivityAt ?? existing?.lastActivityAt),
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
          name: item.name.trim(),
          arabic: item.arabic?.trim() || undefined,
          transliteration: item.transliteration.trim(),
          meaning: item.meaning?.trim() || undefined,
          current: normalizedCurrent,
          target: effectiveTarget,
          lastActivityLabel: item.lastActivityLabel?.trim() || existing?.lastActivityLabel || getDhikrStoreText().notStarted(),
          lastActivityAt: hasUnsavedProgress ? existing?.lastActivityAt : (item.lastActivityAt ?? existing?.lastActivityAt),
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
        freeModeActivityAt: undefined,
        freeModeTarget: 0,
        freeModeLapSize: 33,
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
    version: 2,
    migrate: (persistedState, version) => {
      if (version >= 2) {
        return persistedState as DhikrStore;
      }

      // Sürüm 0 (nameTurkish/plain-string alanlar) VEYA sürüm 1 (LocalizedText,
      // henüz ZikirItem.lapSize'sız) durumundan sürüm 2'ye (opsiyonel lapSize)
      // geçiş. v1 verisi zaten LocalizedText kullandığından aşağıdaki dönüşüm
      // bloğu onun için idempotenttir (değerler değişmez, yalnızca yeni bir
      // obje referansı döner). lapSize alanına burada kasıtlı olarak
      // dokunulmaz — eksikse okuma tarafı 33'e düşer (bkz. resolveLapSize,
      // features/home/services/lap-counter.ts). Bozuk/eksik/beklenmeyen
      // şekilde persist edilmiş eski state (örn. null, dizi olmayan items,
      // obje olmayan öğeler) burada crash etmemeli — her adım defensive
      // olmalı, en kötü ihtimalle öğe atlanır.
      try {
        const state = (persistedState ?? {}) as { items?: unknown };
        const rawItems = Array.isArray(state.items) ? state.items : [];

        const items = rawItems
          .filter((rawItem): rawItem is Record<string, unknown> => typeof rawItem === "object" && rawItem !== null)
          .map((rawItem) => {
            const item = { ...rawItem };
            const isPersonal = item.source === "personal";

            if (typeof item.nameTurkish === "string") {
              item.name = isPersonal ? item.nameTurkish : toLocalizedText(item.nameTurkish);
              delete item.nameTurkish;
            }

            if (typeof item.name !== "string" && !(item.name && typeof item.name === "object" && "tr" in item.name)) {
              // nameTurkish yoktu ve name de tanımsız/geçersiz — render'ı
              // crash ettirmemek için güvenli bir varsayılana düş.
              item.name = isPersonal ? "" : toLocalizedText("");
            }

            if (!isPersonal) {
              if (typeof item.transliteration === "string") {
                item.transliteration = toLocalizedText(item.transliteration);
              }
              if (typeof item.meaning === "string") {
                item.meaning = toLocalizedText(item.meaning);
              }
              if (typeof item.virtue === "string") {
                item.virtue = toLocalizedText(item.virtue);
              }
              if (typeof item.contentSource === "string") {
                item.contentSource = toLocalizedText(item.contentSource);
              }
            }

            return item;
          });

        return { ...state, items } as DhikrStore;
      } catch {
        // Migrasyon her ne sebeple olursa olsun başarısız olursa, boş bir
        // items listesiyle devam et — kullanıcı verisi kaybı yerine crash'i
        // engellemek önceliklidir; kalan alanlar zustand varsayılanlarından gelir.
        const state = (persistedState ?? {}) as Record<string, unknown>;
        return { ...state, items: [] } as unknown as DhikrStore;
      }
    },
    partialize: (state) => ({
      items: state.items,
      selectedDhikrId: state.selectedDhikrId,
      activeAiContext: state.activeAiContext,
      freeModeCount: state.freeModeCount,
      freeModeActivityAt: state.freeModeActivityAt,
      freeModeTarget: state.freeModeTarget,
      freeModeLapSize: state.freeModeLapSize,
      unsavedProgressDhikrIds: state.unsavedProgressDhikrIds,
      unsavedProgressSnapshots: state.unsavedProgressSnapshots
    })
  })
);
