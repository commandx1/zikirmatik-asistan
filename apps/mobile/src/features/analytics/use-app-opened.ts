import { useEffect } from "react";
import { AppState, type AppStateStatus } from "react-native";
import { trackEvent } from "../../lib/analytics";

// Emits app_opened once for the cold start that mounts the root layout, and
// again on every background/inactive → active transition (a real re-open,
// not the initial "unknown" → "active" AppState startup value, which
// AppState.addEventListener never replays). Split out of the hook so it can
// be unit tested without a React renderer.
export function attachAppOpenedListener(): () => void {
  void trackEvent("app_opened");

  const subscription = AppState.addEventListener("change", (nextState: AppStateStatus) => {
    if (nextState === "active") {
      void trackEvent("app_opened");
    }
  });

  return () => subscription.remove();
}

export function useAppOpened(): void {
  useEffect(() => attachAppOpenedListener(), []);
}
