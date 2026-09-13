import * as Application from "expo-application";
import { Platform } from "react-native";

const ANDROID_PACKAGE = "com.zikirmatik_asistan.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// Replace with your actual App Store ID once published on iOS
const APP_STORE_URL = `https://apps.apple.com/app/id000000000`;

export const STORE_URL = Platform.OS === "android" ? PLAY_STORE_URL : APP_STORE_URL;

type AppConfigPayload = {
  minVersion: string | null;
  serverPushEnabled: boolean;
};

type AppConfigResponseJson = {
  data?: { minVersion?: string; serverPushEnabled?: boolean };
  minVersion?: string;
  serverPushEnabled?: boolean;
};

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";
  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${port}`;
}

/**
 * Raw GET /app-config call. Returns null when the request itself failed
 * (network error, non-2xx, unparsable JSON) — as opposed to a value the
 * server genuinely sent — so callers that must tell "server said no" apart
 * from "couldn't reach the server" (e.g. deciding whether to overwrite a
 * persisted flag) can do so. Most callers should use fetchAppConfig or
 * fetchMinRequiredVersion instead, which collapse failures to safe defaults.
 */
export async function fetchAppConfigOrNull(): Promise<AppConfigPayload | null> {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/app-config`);
    if (!response.ok) return null;
    const json = (await response.json()) as AppConfigResponseJson;
    const minVersion = json?.data?.minVersion ?? json?.minVersion ?? null;
    const serverPushEnabled = (json?.data?.serverPushEnabled ?? json?.serverPushEnabled) === true;
    return { minVersion, serverPushEnabled };
  } catch {
    return null;
  }
}

/**
 * Best-effort /app-config: never throws. On failure resolves to the safe
 * defaults — no forced update, and serverPushEnabled: false so mobile keeps
 * scheduling local special-day reminders (see use-event-notification-sync.ts).
 */
export async function fetchAppConfig(): Promise<AppConfigPayload> {
  return (await fetchAppConfigOrNull()) ?? { minVersion: null, serverPushEnabled: false };
}

/** Returns the minimum required app version, or null if the check cannot be completed. */
export async function fetchMinRequiredVersion(): Promise<string | null> {
  const { minVersion } = await fetchAppConfig();
  return minVersion;
}

/**
 * True when the running binary's build number is older than the required minimum.
 * Uses versionCode (nativeBuildVersion) which auto-increments on every EAS build,
 * so APP_MIN_VERSION in the API env just needs to be the minimum acceptable build number.
 */
export function isUpdateRequired(minBuildNumber: string): boolean {
  const current = Number(Application.nativeBuildVersion);
  const min = Number(minBuildNumber);
  if (!current || !min) return false;
  return current < min;
}
