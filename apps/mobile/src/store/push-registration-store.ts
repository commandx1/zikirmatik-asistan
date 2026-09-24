import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeAsyncStorage } from "../lib/storage/zustand-storage";

// Tracks whether THIS device currently has a confirmed, working server-side
// push registration (see features/notifications/services/push-device-registration.ts:
// registerPushDevice sets this true only after `POST /v1/devices/register`
// succeeds AND an Expo push token was obtained; unlinkPushDevice — called on
// logout — resets it to false so local scheduling resumes as a safety net
// until the next registration confirms it again).
//
// Consumed by features/notifications/services/event-notifications.ts (via
// use-event-notification-sync.ts) to decide whether to keep scheduling
// SPECIAL DAY reminders locally: the server now also sends kandil-eve/day
// pushes (apps/api/src/modules/push-campaigns/), so once this device is
// confirmed reachable through that channel, on-device scheduling of the same
// notifications would duplicate them. Friday + daily local reminders have no
// server equivalent and are unaffected by this flag.
type PushRegistrationState = {
  serverPushActive: boolean;
  setServerPushActive: (active: boolean) => void;
};

export const usePushRegistrationStore = create<PushRegistrationState>()(
  persist(
    (set) => ({
      serverPushActive: false,
      setServerPushActive: (active) => set({ serverPushActive: active })
    }),
    {
      name: "push-registration-store-v1",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({ serverPushActive: state.serverPushActive })
    }
  )
);
