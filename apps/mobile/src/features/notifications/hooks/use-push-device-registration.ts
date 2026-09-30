import { useEffect, useState } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "../../../store/auth-store";
import { useProfileStore } from "../../../store/profile-store";
import { syncPushDeviceRegistration } from "../services/push-device-registration";

// Registers (or refreshes) this device for remote push on app start, for
// guests and signed-in users alike, and re-registers when auth status or the
// in-app language changes (login links the device server-side via the same
// deviceId sent with /auth/provider/verify; this hook keeps the /devices
// record itself fresh: token, platform, locale, timezone and — when
// authenticated — the userId link). Every foreground also calls the sync,
// which is a no-op unless auth/locale/timezone changed or the last attempt
// failed (see syncPushDeviceRegistration). The bearer token itself is
// resolved deep in devices-api-client's `auth: true` (via the auth bridge).
export function usePushDeviceRegistration() {
  const authenticated = useAuthStore((s) => s.status) === "authenticated";
  const locale = useProfileStore((s) => s.locale);
  // Wait for the persisted in-app language, otherwise a user whose choice
  // differs from the device language would register twice on every start.
  const [profileHydrated, setProfileHydrated] = useState(() => useProfileStore.persist.hasHydrated());

  useEffect(() => {
    if (profileHydrated) {
      return;
    }
    if (useProfileStore.persist.hasHydrated()) {
      setProfileHydrated(true);
      return;
    }
    return useProfileStore.persist.onFinishHydration(() => setProfileHydrated(true));
  }, [profileHydrated]);

  useEffect(() => {
    if (!profileHydrated) {
      return;
    }

    // Best effort: push registration should never block app usage.
    const run = () => void syncPushDeviceRegistration(authenticated, locale).catch(() => {});
    run();

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        run();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [authenticated, locale, profileHydrated]);
}
