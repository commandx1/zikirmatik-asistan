import { useEffect } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "../../../store/auth-store";

const REFRESH_INTERVAL_MS = 12 * 60 * 1000;

export function useAuthSessionSync() {
  const status = useAuthStore((s) => s.status);
  const refreshAuthenticatedSession = useAuthStore((s) => s.refreshAuthenticatedSession);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    void refreshAuthenticatedSession();
  }, [status, refreshAuthenticatedSession]);

  useEffect(() => {
    if (status !== "authenticated") {
      return;
    }

    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active") {
        void refreshAuthenticatedSession();
      }
    });

    const intervalId = setInterval(() => {
      void refreshAuthenticatedSession();
    }, REFRESH_INTERVAL_MS);

    return () => {
      subscription.remove();
      clearInterval(intervalId);
    };
  }, [status, refreshAuthenticatedSession]);
}
