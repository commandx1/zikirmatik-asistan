import { useEffect, useRef } from "react";
import { router, useRootNavigationState } from "expo-router";
import * as Notifications from "expo-notifications";
import { createDeferredRoute } from "../services/deferred-route";
import { extractNotificationRoute } from "../services/notification-tap-routing";

// Routes campaign push taps to the screen named in the payload's
// `data.route`. Handles both the warm path (app in foreground/background
// when tapped) and the cold-start path, where the tap that launched the app
// is only available via the last notification response.
export function useNotificationTapRouting() {
  const handledColdStartRef = useRef(false);
  // B-18: the root navigator has a key only once it is mounted.
  const isNavigationReady = Boolean(useRootNavigationState()?.key);
  const deferredRef = useRef<ReturnType<typeof createDeferredRoute> | null>(null);
  if (!deferredRef.current) {
    deferredRef.current = createDeferredRoute((route) => {
      try {
        router.push(route as never);
      } catch {
        // Best effort: a bad route must never crash the app shell.
      }
    });
  }

  useEffect(() => {
    deferredRef.current?.setReady(isNavigationReady);
  }, [isNavigationReady]);

  useEffect(() => {
    const navigate = (route: string) => deferredRef.current?.go(route);

    if (!handledColdStartRef.current) {
      handledColdStartRef.current = true;
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        const route = extractNotificationRoute(response);
        if (route) {
          navigate(route);
        }
        // B-18: temizlenmezse sonraki soğuk açılışlar aynı rotaya tekrar gider.
        if (response) {
          void Notifications.clearLastNotificationResponseAsync().catch(() => {});
        }
      });
    }

    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const route = extractNotificationRoute(response);
        if (route) {
          navigate(route);
        }
      }
    );

    return () => {
      subscription.remove();
    };
  }, []);
}
