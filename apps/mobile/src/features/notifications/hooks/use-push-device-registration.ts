import { useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "../../../store/auth-store";
import { registerPushDevice } from "../services/push-device-registration";

// Registers (or refreshes) this device for remote push on every app start,
// for guests and signed-in users alike, and re-registers when auth state
// changes (login links the device server-side via the same deviceId sent
// with /auth/provider/verify; this hook keeps the /devices record itself
// fresh: token, platform, and — when authenticated — the userId link).
export function usePushDeviceRegistration() {
  const authStatus = useAuthStore((s) => s.status);
  const accessToken = useAuthStore((s) => s.session?.accessToken);
  const lastRegisteredKeyRef = useRef<string | null>(null);

  useEffect(() => {
    const registrationKey = `${authStatus}:${accessToken ?? "guest"}`;

    const run = async () => {
      try {
        await registerPushDevice(authStatus === "authenticated" ? accessToken : undefined);
        lastRegisteredKeyRef.current = registrationKey;
      } catch {
        // Best effort: push registration should never block app usage.
        // A later AppState "active" event or auth change will retry.
      }
    };

    void run();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && lastRegisteredKeyRef.current !== registrationKey) {
        void run();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authStatus, accessToken]);
}
