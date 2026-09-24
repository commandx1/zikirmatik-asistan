import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";
import type { CircleDetail, CircleSummary } from "@zikirmatik/shared";

// Zikir Halkası (grup zikri) için yerel store. Desen vird-store.ts ile aynı:
// safeAsyncStorage (native modül eksikse sessizce yut), persist +
// version/partialize + onRehydrateStorage -> markHydrated.
//
// Bu store SUNUCU İLE DOĞRUDAN KONUŞMAZ (saf state) — senkronizasyon
// features/circle/services/circle-api-client.ts + hooks/use-circle-sync.ts
// üzerinden yürür; bu store yalnızca replaceFromServer/upsertCircle ile beslenir.

type CircleTodayCount = { dateKey: string; count: number };

type CircleStoreData = {
  circles: CircleSummary[];
  /** circleId -> bugünkü (dateKey) yerel canlı sayaç — oturum ekranının
   * liveCountRef'i ile aynala tutulur (bkz. circle-session-screen.tsx). */
  todayCounts: Record<string, CircleTodayCount>;
};

export type CircleStore = CircleStoreData & {
  hasHydrated: boolean;
  /** Sunucudan gelen tam liste ile yerel state'i değiştirir. */
  replaceFromServer: (circles: CircleSummary[]) => void;
  /** id eşleşen halkayı günceller, yoksa ekler. CircleDetail de kabul edilir
   * (CircleSummary'nin üst kümesi olduğundan olduğu gibi saklanır). */
  upsertCircle: (circle: CircleSummary | CircleDetail) => void;
  removeCircle: (id: string) => void;
  setTodayCount: (circleId: string, dateKey: string, count: number) => void;
  /** Sunucu toplamı zaten monoton artar; ekranlar arası geri sıçramayı
   * önlemek için mevcut değerden düşükse no-op, yüksekse günceller. */
  bumpTotal: (id: string, total: number) => void;
  resetCircles: () => void;
  markHydrated: () => void;
};

function defaultData(): CircleStoreData {
  return {
    circles: [],
    todayCounts: {}
  };
}

export const useCircleStore = create<CircleStore>()(
  persist(
    (set) => ({
      ...defaultData(),
      hasHydrated: false,

      // Sunucu listesi yalnız özet taşır (members/myTodayCount yok). Önceden
      // detay ekranının yazdığı bu alanlar korunur; aksi hâlde uygulama ön
      // plana gelince tetiklenen senkron, açık detay ekranındaki üye listesini
      // silerdi (emülatör turunda görüldü).
      replaceFromServer: (circles) =>
        set((state) => ({
          circles: circles.map((incoming) => {
            const existing = state.circles.find((circle) => circle.id === incoming.id);
            if (!existing) {
              return incoming;
            }
            return { ...existing, ...incoming, totalCount: Math.max(existing.totalCount, incoming.totalCount) };
          })
        })),

      upsertCircle: (circle) =>
        set((state) => {
          const index = state.circles.findIndex((existing) => existing.id === circle.id);
          const circles = [...state.circles];
          if (index >= 0) {
            // guarded by index >= 0
            const existing = circles[index]!;
            circles[index] = { ...circle, totalCount: Math.max(existing.totalCount, circle.totalCount) };
          } else {
            circles.push(circle);
          }
          return { circles };
        }),

      removeCircle: (id) =>
        set((state) => ({
          circles: state.circles.filter((circle) => circle.id !== id)
        })),

      setTodayCount: (circleId, dateKey, count) =>
        set((state) => ({
          todayCounts: { ...state.todayCounts, [circleId]: { dateKey, count } }
        })),

      bumpTotal: (id, total) =>
        set((state) => {
          const index = state.circles.findIndex((circle) => circle.id === id);
          // state.circles[index] is safe once index >= 0 short-circuits the OR
          if (index < 0 || total <= state.circles[index]!.totalCount) {
            return {};
          }
          const circles = [...state.circles];
          // guarded by index >= 0 above
          circles[index] = { ...circles[index]!, totalCount: total };
          return { circles };
        }),

      resetCircles: () => set({ ...defaultData() }),

      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "circle-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      version: 1,
      partialize: (state) => ({
        circles: state.circles,
        todayCounts: state.todayCounts
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);
