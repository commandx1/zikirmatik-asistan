// Zikir Halkalarını sunucuyla senkronize eder. app/_layout.tsx'e
// (useVirdBackendSync'in yanına) mount edilir. Desen use-vird-backend-sync.ts
// ile aynı, ama daha basit: yerel -> sunucu push'u yok (halkalar yalnızca
// sunucuda yaratılır/katılınır — bkz. görev notu), yalnız
// fetchCircles -> replaceFromServer. Misafirde (authStatus !== 'authenticated')
// HİÇBİR istek yapılmaz; signOut'ta store zaten session-boundary.ts ile sıfırlanır.
import { useCallback, useEffect, useRef } from "react";
import { AppState } from "react-native";
import { useAuthStore } from "../../../store/auth-store";
import { useCircleStore } from "../../../store/circle-store";
import { fetchCircles } from "../services/circle-api-client";

export function useCircleSync(): void {
  const authStatus = useAuthStore((state) => state.status);
  const appState = useRef(AppState.currentState);
  const isSyncingRef = useRef(false);

  const runSync = useCallback(async () => {
    if (isSyncingRef.current) {
      return;
    }

    const accessToken = useAuthStore.getState().session?.accessToken;
    if (useAuthStore.getState().status !== "authenticated" || !accessToken) {
      return;
    }

    isSyncingRef.current = true;
    try {
      const circles = await fetchCircles(accessToken);
      useCircleStore.getState().replaceFromServer(circles);
    } catch (error) {
      // Yerel state dokunulmadan kalır — bir sonraki tetikte (foreground,
      // yeniden mount) yeniden denenir (bkz. use-vird-backend-sync.ts).
      console.warn("[use-circle-sync] senkron başarısız", error);
    } finally {
      isSyncingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (authStatus !== "authenticated") {
      return;
    }

    void runSync();

    const subscription = AppState.addEventListener("change", (nextState) => {
      const prev = appState.current;
      appState.current = nextState;
      if (prev.match(/inactive|background/) && nextState === "active") {
        void runSync();
      }
    });

    return () => subscription.remove();
  }, [authStatus, runSync]);
}
