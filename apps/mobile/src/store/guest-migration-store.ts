import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";
import type { VirdDayProgressByDate, VirdProgramLocal } from "../features/vird/types";

export type GuestSnapshotItem = {
  id: string;
  source: "ready" | "personal";
  // Snapshot is a flattened, locale-resolved copy of ZikirItem — only the
  // active-locale string is captured, since it's used for backend name
  // matching (see resolveLogKey) and personal-dhikr creation, both of which
  // operate on plain strings.
  name: string;
  transliteration: string;
  arabic?: string;
  meaning?: string;
  current: number;
  target: number;
  isFavorite: boolean;
};

/**
 * Misafirin yerel vird (günlük zikir programı) state'inin göç anlık
 * görüntüsü. Yalnızca `origin:'local'` programlar taşınır (bkz.
 * captureGuestMigrationSnapshot) — bir misafirin ZATEN sunucuya senkronize
 * olmuş (`origin:'server'`) bir programı olamaz (misafir authenticate
 * olamaz). `dayProgress` yalnızca son 30 günle sınırlıdır (bkz.
 * store/vird-store.ts pruneDayProgress) — tam 120 günlük pencereyi taşımak
 * göç payload'ını gereksiz büyütür, göç zaten yalnızca YAKIN geçmişi
 * kurtarmayı hedefler.
 */
export type GuestVirdSnapshot = {
  programs: VirdProgramLocal[];
  activeProgramId: string | null;
  dayProgress: VirdDayProgressByDate;
};

export type GuestMigrationSnapshot = {
  id: string;
  capturedAt: string;
  /** Local calendar day (YYYY-MM-DD) the guest progress is attributed to. */
  dateKey: string;
  items: GuestSnapshotItem[];
  /**
   * v2 alanı (bkz. captureGuestMigrationSnapshot) — eski (bu alan eklenmeden
   * önce kuyruğa alınmış) bekleyen bir snapshot'ta bulunmaz; okuma tarafı
   * (planGuestMigration/runGuestMigration) bunu HER ZAMAN opsiyonel ele
   * almalıdır.
   */
  vird?: GuestVirdSnapshot;
};

export type GuestMigrationStatus = "idle" | "pending" | "running" | "completed" | "failed";

export const MAX_GUEST_MIGRATION_ATTEMPTS = 3;

/**
 * Normalizes a rehydrated persisted state in place.
 * - "running" resumes as "pending": the app died mid-run and every migration
 *   step is idempotent, so re-running is safe.
 * - A terminal "failed" with the snapshot still intact gets one fresh round of
 *   attempts per cold start: guest data captured while offline (e.g.
 *   airplane-mode login) must not be lost forever. A persistently failing run
 *   re-opens the sync gate again after MAX_GUEST_MIGRATION_ATTEMPTS.
 */
export function rescueRehydratedState(state: {
  status: GuestMigrationStatus;
  snapshot?: GuestMigrationSnapshot;
  attempts: number;
}): void {
  if (state.status === "running") {
    state.status = "pending";
    return;
  }
  if (state.status === "failed" && state.snapshot) {
    state.status = "pending";
    state.attempts = 0;
  }
}

type GuestMigrationStore = {
  status: GuestMigrationStatus;
  snapshot?: GuestMigrationSnapshot;
  attempts: number;
  lastError?: string;
  queueSnapshot: (snapshot: GuestMigrationSnapshot) => void;
  beginRun: () => void;
  completeRun: () => void;
  failRun: (message: string) => void;
  clear: () => void;
};

export const useGuestMigrationStore = create<GuestMigrationStore>()(
  persist(
    (set, get) => ({
      status: "idle",
      snapshot: undefined,
      attempts: 0,
      lastError: undefined,
      queueSnapshot: (snapshot) =>
        set({
          status: "pending",
          snapshot,
          attempts: 0,
          lastError: undefined
        }),
      beginRun: () => {
        if (get().status !== "pending") {
          return;
        }
        set({ status: "running" });
      },
      completeRun: () =>
        set({
          status: "completed",
          snapshot: undefined,
          lastError: undefined
        }),
      failRun: (message) => {
        const attempts = get().attempts + 1;
        if (attempts >= MAX_GUEST_MIGRATION_ATTEMPTS) {
          // Terminal: release the sync gate so the app keeps working; keep the
          // snapshot around for debugging / a potential manual retry path.
          set({ status: "failed", attempts, lastError: message });
          return;
        }
        set({ status: "pending", attempts, lastError: message });
      },
      clear: () =>
        set({
          status: "idle",
          snapshot: undefined,
          attempts: 0,
          lastError: undefined
        })
    }),
    {
      name: "zikirmatik-guest-migration",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        // Never persist a live "running" state — if the app dies mid-run the
        // migration must resume as "pending" (each step is idempotent).
        status: state.status === "running" ? ("pending" as const) : state.status,
        snapshot: state.snapshot,
        attempts: state.attempts,
        lastError: state.lastError
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          rescueRehydratedState(state);
        }
      }
    }
  )
);
