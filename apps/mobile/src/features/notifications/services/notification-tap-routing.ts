// Resolves the in-app route carried by a tapped remote notification.
// The API attaches `data: { route: "/special-days/<id>" }` (or
// "/(tabs)/special-days" for the Friday campaign) to every campaign push —
// see apps/api/src/modules/notification-campaigns/notification-campaigns.service.ts.

// Only navigate to routes we expect the backend to send. Anything else
// (malformed payloads, pushes from older/newer app versions) is ignored so
// a tap can never crash navigation or deep-link somewhere unintended.
const ALLOWED_ROUTE_PATTERNS: RegExp[] = [
  /^\/special-days\/[A-Za-z0-9-]+$/,
  /^\/\(tabs\)\/special-days$/,
  // Local streak reminder (streak-reminder-notifications.ts) deep-links to
  // the main dhikr screen.
  /^\/\(tabs\)\/home$/,
  // Weekly summary campaign (weekly-summary.campaign.ts) deep-links to the
  // stats tab.
  /^\/\(tabs\)\/stats$/,
  // Local vird slot reminder (vird-reminder-notifications.ts) deep-links to
  // the vird hub with the triggering slot highlighted.
  /^\/vird\?slot=(morning|prayer|evening|night)(&prayerIndex=[1-5])?$/,
  // Zikir Halkası bildirimleri (hedefe ulaşıldı, üye katıldı vb.) halka
  // detay ekranına deep-link eder — id Mongo ObjectId (24 hex).
  /^\/circle\/[a-f0-9]{24}$/
];

type NotificationResponseLike = {
  notification?: {
    request?: {
      content?: {
        data?: unknown;
      };
    };
  };
};

export function extractNotificationRoute(
  response: NotificationResponseLike | null | undefined
): string | null {
  const data = response?.notification?.request?.content?.data;
  if (!data || typeof data !== "object") {
    return null;
  }

  const route = (data as Record<string, unknown>).route;
  if (typeof route !== "string") {
    return null;
  }

  return ALLOWED_ROUTE_PATTERNS.some((pattern) => pattern.test(route)) ? route : null;
}
