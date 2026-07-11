import { useEffect, useRef } from "react";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import { extractNotificationRoute } from "../services/notification-tap-routing";

// Routes campaign push taps to the screen named in the payload's
// `data.route`. Handles both the warm path (app in foreground/background
// when tapped) and the cold-start path, where the tap that launched the app
// is only available via the last notification response.
export function useNotificationTapRouting() {
  const handledColdStartRef = useRef(false);

  useEffect(() => {
    const navigate = (route: string) => {
      try {
        router.push(route as never);
      } catch {
        // Best effort: a bad route must never crash the app shell.
      }
    };

    if (!handledColdStartRef.current) {
      handledColdStartRef.current = true;
      void Notifications.getLastNotificationResponseAsync().then((response) => {
        const route = extractNotificationRoute(response);
        if (route) {
          navigate(route);
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
