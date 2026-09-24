import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";
import { toDateKey, type VirdStreakSnapshot } from "@zikirmatik/shared";
import type {
  VirdDayItemProgress,
  VirdDayProgressByDate,
  VirdProgramLocal,
  VirdReminderPrefs
} from "../features/vird/types";

// Vird programları, günlük ilerleme ve hatırlatma tercihleri için yerel
// (cihaz) store. Desen theme-store.ts/dhikr-store.ts ile aynı: safeAsyncStorage
// (native modül eksikse sessizce yut), persist + version/migrate (savunmacı,
// bkz. dhikr-store.ts'teki desen) + partialize.
//
// Bu store SUNUCU İLE DOĞRUDAN KONUŞMAZ (saf state) — senkronizasyon
// services/vird-api-client.ts + (henüz mount edilmemiş) bir sonraki worker'ın
// hook'u üzerinden yürür; bu store yalnızca `replaceFromServer` ile beslenir.

const DAY_PROGRESS_RETENTION_DAYS = 120;

export type VirdServerTodaySnapshot = {
  dateKey: string;
  /** itemKey -> sunucudaki count/target (bkz. GET v1/vird/today slots[*].items). */
  progress: Record<string, { count: number; target: number }>;
};

type VirdStoreData = {
  programs: VirdProgramLocal[];
  activeProgramId: string | null;
  /** dateKey (YYYY-MM-DD) -> itemKey -> ilerleme. 120 günden eski anahtarlar budanır. */
  dayProgress: VirdDayProgressByDate;
  reminderPrefs: VirdReminderPrefs;
  lastServerSyncAt: string | null;
};

/** Bir kaydet/başlat/şablon/AI akışı hub'a (`/vird`) dönünce gösterilecek
 * toast türü — PERSIST EDİLMEZ (yalnız bir sonraki hub mount'unda tüketilen
 * geçici sinyal, bkz. features/vird/screens/vird-hub-screen.tsx). */
export type VirdNotice = "started" | "saved" | "draft" | null;

export type VirdStore = VirdStoreData & {
  hasHydrated: boolean;
  /**
   * GET /v1/vird/today yanıtındaki authoritative seri (bkz. vird-streak.ts
   * dosya başı notu). Kasıtlı olarak PERSIST EDİLMEZ (partialize'da yok) —
   * yalnız son senkron sonucunu bellekte tutar; soğuk başlangıçta (henüz
   * senkron olmadan) null'dur ve okuma tarafı bu durumu ele almalıdır. Bu
   * görevde henüz hiçbir UI tarafından tüketilmiyor (bkz. README) — bir
   * sonraki worker için hazırlanmıştır.
   */
  virdStreak: VirdStreakSnapshot | null;
  setVirdStreak: (streak: VirdStreakSnapshot | null) => void;
  /**
   * hooks/use-vird-backend-sync.ts'in son senkron denemesinden kalan hata
   * mesajı (dhikr-store.ts'teki syncError ile aynı desen — hook'un kendisi
   * app/_layout.tsx'te değer yakalanmadan mount edildiğinden, hata durumu
   * BURADAN okunur). Başarılı bir senkronda temizlenir; PERSIST EDİLMEZ.
   */
  syncError?: string;
  setSyncError: (message?: string) => void;
  /** id (varsa) ya da clientId eşleşen programı günceller, yoksa ekler. */
  upsertProgram: (program: VirdProgramLocal) => void;
  removeProgram: (id: string) => void;
  setActiveProgram: (id: string | null) => void;
  /**
   * itemKey için mevcut count ile verilen count'un MAX'ını alır (offline/geç
   * gelen bir yazımın ilerlemeyi geriye düşürmemesi için); `completed`
   * (count >= target) bir kez true olduktan sonra hep true kalır.
   */
  recordProgress: (dateKey: string, itemKey: string, count: number, target: number) => void;
  /**
   * itemKey için count/target'ı MUTLAK olarak yazar (recordProgress'in
   * mergeMax'ının aksine önceki değeri hiç dikkate almaz) — rehberli vird
   * oturumunda kullanıcı bir sayacı geri alabildiği/sıfırlayabildiği için
   * gerekli (mergeMax burada geriye düşüşü engelleyip yanlış davranırdı).
   * recordProgress, sunucu senkronu (replaceFromServer) gibi "asla geriye
   * düşme" gereken yollar için AYNEN kalır.
   */
  setProgress: (dateKey: string, itemKey: string, count: number, target: number) => void;
  /**
   * GET /v1/vird/programs (+ opsiyonel GET /v1/vird/today) yanıtıyla yerel
   * durumu uzlaştırır: gelen listedeki HER program `origin:'server'` olarak
   * yazılır; henüz sunucuya senkronize OLMAMIŞ (`origin:'local'`, clientId'si
   * gelen listede YOK) programlar korunur (kaybolmaz — kendi POST'ları henüz
   * gitmemiş olabilir). `todayProgress` verilirse o günün ilerlemesi yerel
   * `dayProgress` ile MAX birleştirilir (recordProgress ile aynı kural).
   */
  replaceFromServer: (programs: VirdProgramLocal[], todayProgress?: VirdServerTodaySnapshot) => void;
  setReminderPrefs: (
    patch: Partial<Omit<VirdReminderPrefs, "slots">> & { slots?: Partial<VirdReminderPrefs["slots"]> }
  ) => void;
  /** Hub ekranının (vird-hub-screen.tsx) gösterip 2.5s sonra kendini
   * temizlediği bir kerelik toast sinyali. PERSIST EDİLMEZ. */
  notice: VirdNotice;
  setNotice: (notice: VirdNotice) => void;
  /** Oturum kapanışı vb. için tüm vird state'ini varsayılana döndürür. Bu
   * görev kapsamında session-boundary.ts'e KAYDEDİLMEDİ (bkz. README). */
  resetVird: () => void;
  markHydrated: () => void;
};

function defaultData(): VirdStoreData {
  return {
    programs: [],
    activeProgramId: null,
    dayProgress: {},
    reminderPrefs: {
      enabled: false,
      slots: { morning: false, prayer: false, evening: false, night: false },
      coords: null
    },
    lastServerSyncAt: null
  };
}

/** Salt takvim-günü kayması (saat bileşeni yok) — API'deki shiftDateKey ile
 * aynı yaklaşım (Date.UTC), makineden bağımsız. */
function shiftDateKey(key: string, days: number): string {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(Date.UTC(y, (m ?? 1) - 1, d ?? 1));
  dt.setUTCDate(dt.getUTCDate() + days);
  return dt.toISOString().slice(0, 10);
}

/**
 * `dateKey >= cutoff` (bugünden `retentionDays` gün öncesi) olmayan tüm
 * girdileri düşürür. `retentionDays` varsayılanı store'un kendi 120 günlük
 * penceresidir; dışa aktarılmasının nedeni guest-migration.ts'in aynı
 * mantığı DAHA DAR bir pencereyle (son 30 gün) yeniden kullanabilmesidir —
 * bkz. features/auth/services/guest-migration.ts captureGuestMigrationSnapshot.
 */
export function pruneDayProgress(
  dayProgress: VirdDayProgressByDate,
  todayKey: string,
  retentionDays: number = DAY_PROGRESS_RETENTION_DAYS
): VirdDayProgressByDate {
  const cutoff = shiftDateKey(todayKey, -retentionDays);
  const next: VirdDayProgressByDate = {};
  for (const [dateKey, value] of Object.entries(dayProgress)) {
    if (dateKey >= cutoff) {
      next[dateKey] = value;
    }
  }
  return next;
}

function mergeMax(existing: VirdDayItemProgress | undefined, count: number, target: number): VirdDayItemProgress {
  const mergedCount = Math.max(existing?.count ?? 0, count);
  return {
    count: mergedCount,
    target,
    completed: Boolean(existing?.completed) || mergedCount >= target
  };
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return Boolean(value) && typeof value === "object" && !Array.isArray(value);
}

export const useVirdStore = create<VirdStore>()(
  persist(
    (set) => ({
      ...defaultData(),
      hasHydrated: false,
      virdStreak: null,
      syncError: undefined,
      notice: null,

      setVirdStreak: (streak) => set({ virdStreak: streak }),
      setSyncError: (message) => set({ syncError: message }),
      setNotice: (notice) => set({ notice }),

      upsertProgram: (program) =>
        set((state) => {
          const index = state.programs.findIndex((existing) => existing.id === program.id || existing.clientId === program.clientId);
          const programs = [...state.programs];
          if (index >= 0) {
            programs[index] = program;
          } else {
            programs.push(program);
          }
          return { programs };
        }),

      removeProgram: (id) =>
        set((state) => ({
          programs: state.programs.filter((program) => program.id !== id),
          activeProgramId: state.activeProgramId === id ? null : state.activeProgramId
        })),

      setActiveProgram: (id) => set({ activeProgramId: id }),

      recordProgress: (dateKey, itemKey, count, target) =>
        set((state) => {
          const day = state.dayProgress[dateKey] ?? {};
          const nextDay: Record<string, VirdDayItemProgress> = {
            ...day,
            [itemKey]: mergeMax(day[itemKey], count, target)
          };
          return {
            dayProgress: pruneDayProgress({ ...state.dayProgress, [dateKey]: nextDay }, toDateKey(new Date()))
          };
        }),

      setProgress: (dateKey, itemKey, count, target) =>
        set((state) => {
          const day = state.dayProgress[dateKey] ?? {};
          const nextDay: Record<string, VirdDayItemProgress> = {
            ...day,
            [itemKey]: { count, target, completed: count >= target }
          };
          return {
            dayProgress: pruneDayProgress({ ...state.dayProgress, [dateKey]: nextDay }, toDateKey(new Date()))
          };
        }),

      replaceFromServer: (programsFromServer, todayProgress) =>
        set((state) => {
          const incoming = programsFromServer.map((program) => ({ ...program, origin: "server" as const }));
          const incomingClientIds = new Set(incoming.map((program) => program.clientId));
          const survivingLocalOnly = state.programs.filter(
            (program) => program.origin === "local" && !incomingClientIds.has(program.clientId)
          );

          let dayProgress = state.dayProgress;
          if (todayProgress) {
            const day = dayProgress[todayProgress.dateKey] ?? {};
            const nextDay: Record<string, VirdDayItemProgress> = { ...day };
            for (const [itemKey, entry] of Object.entries(todayProgress.progress)) {
              nextDay[itemKey] = mergeMax(nextDay[itemKey], entry.count, entry.target);
            }
            dayProgress = pruneDayProgress({ ...dayProgress, [todayProgress.dateKey]: nextDay }, toDateKey(new Date()));
          }

          const programs = [...incoming, ...survivingLocalOnly];
          // Cihazdaki "kartın izlediği program" seçimi sunucuda yoksa (giriş
          // sonrası sıfırlanmış store, başka cihazda kurulmuş program vb.)
          // sunucunun en son güncellenen AKTİF programını seç; aksi hâlde
          // hub/kart "program yok" gösterirken listede aktif program durur.
          const activeStillExists = programs.some((program) => program.id === state.activeProgramId);
          const activeProgramId = activeStillExists
            ? state.activeProgramId
            : (incoming.find((program) => program.status === "active")?.id ?? null);

          return {
            programs,
            activeProgramId,
            dayProgress,
            lastServerSyncAt: new Date().toISOString()
          };
        }),

      setReminderPrefs: (patch) =>
        set((state) => ({
          reminderPrefs: {
            ...state.reminderPrefs,
            ...patch,
            slots: { ...state.reminderPrefs.slots, ...(patch.slots ?? {}) }
          }
        })),

      resetVird: () => set({ ...defaultData(), virdStreak: null, syncError: undefined, notice: null }),

      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "vird-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      version: 2,
      // v2 (FAZ C): reminderPrefs.provinceKey (il seçimi) kaldırıldı, yerini
      // coords (GPS) aldı — bkz. ../features/vird/types.ts VirdReminderPrefs.
      // version < 2 için (v1 ya da hiç version taşımayan bozuk/eski veri)
      // dhikr-store.ts'teki savunmacı desenle aynı gerekçeyle (persist
      // edilmiş state ASLA crash'e sebep olmamalı) alan alan güvenli
      // varsayılanlara düşülür; provinceKey bilerek OKUNMAZ/DÜŞÜRÜLÜR.
      migrate: (persistedState, version) => {
        if (version >= 2) {
          return persistedState as VirdStore;
        }

        try {
          const state = (persistedState ?? {}) as Partial<VirdStoreData> & Record<string, unknown>;
          const defaults = defaultData();
          const rawPrefs = isPlainObject(state.reminderPrefs) ? state.reminderPrefs : undefined;
          const rawSlots = rawPrefs && isPlainObject(rawPrefs.slots) ? (rawPrefs.slots as Record<string, unknown>) : undefined;

          return {
            programs: Array.isArray(state.programs) ? (state.programs as VirdProgramLocal[]) : defaults.programs,
            activeProgramId: typeof state.activeProgramId === "string" ? state.activeProgramId : defaults.activeProgramId,
            dayProgress: isPlainObject(state.dayProgress) ? (state.dayProgress as VirdDayProgressByDate) : defaults.dayProgress,
            reminderPrefs: {
              enabled: typeof rawPrefs?.enabled === "boolean" ? rawPrefs.enabled : defaults.reminderPrefs.enabled,
              slots: {
                morning: typeof rawSlots?.morning === "boolean" ? rawSlots.morning : defaults.reminderPrefs.slots.morning,
                prayer: typeof rawSlots?.prayer === "boolean" ? rawSlots.prayer : defaults.reminderPrefs.slots.prayer,
                evening: typeof rawSlots?.evening === "boolean" ? rawSlots.evening : defaults.reminderPrefs.slots.evening,
                night: typeof rawSlots?.night === "boolean" ? rawSlots.night : defaults.reminderPrefs.slots.night
              },
              // v1'deki provinceKey kasıtlı olarak düşürülür (bkz. yukarı);
              // v2 formatında zaten coords yoktu, her ihtimalde null'a düşülür.
              coords: defaults.reminderPrefs.coords
            },
            lastServerSyncAt: typeof state.lastServerSyncAt === "string" ? state.lastServerSyncAt : defaults.lastServerSyncAt
          } as VirdStore;
        } catch {
          // Migrasyon her ne sebeple olursa olsun başarısız olursa, kullanıcı
          // verisi kaybı yerine crash'i engellemek amacıyla temiz varsayılana düş.
          return defaultData() as VirdStore;
        }
      },
      partialize: (state) => ({
        programs: state.programs,
        activeProgramId: state.activeProgramId,
        dayProgress: state.dayProgress,
        reminderPrefs: state.reminderPrefs,
        lastServerSyncAt: state.lastServerSyncAt
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
