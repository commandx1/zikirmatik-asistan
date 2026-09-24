import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

// Rollout flags fetched from the server (GET /app-config, see
// src/lib/app-config.ts: fetchAppConfigOrNull). Currently a single flag:
// serverPushEnabled, mirroring the API's SERVER_PUSH_ENABLED env var. It
// gates (together with this device's OWN confirmed push registration, see
// push-registration-store.ts) whether kandil/special-day reminders hand off
// from local scheduling to the server push pipeline — see
// resolveServerPushActive in features/notifications/services/event-notifications.ts.
// Kept false by default — the server push pipeline
// (apps/api/src/modules/push-campaigns/) isn't live in production yet (bkz.
// apps/api/docs/notification-campaigns-runbook.md "Devreye alma sırası") —
// so local scheduling keeps running everywhere until this is deliberately
// flipped on server-side.
//
// Persisted so a transient /app-config failure on app start doesn't lose a
// previously-confirmed true value; the fetch call site (app/_layout.tsx)
// only writes here after a SUCCESSFUL request — on failure it leaves this
// store untouched, so the last known value survives.
type AppConfigState = {
  serverPushEnabled: boolean;
  setServerPushEnabled: (enabled: boolean) => void;
};

export const useAppConfigStore = create<AppConfigState>()(
  persist(
    (set) => ({
      serverPushEnabled: false,
      setServerPushEnabled: (enabled) => set({ serverPushEnabled: enabled })
    }),
    {
      name: "app-config-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ serverPushEnabled: state.serverPushEnabled })
    }
  )
);
