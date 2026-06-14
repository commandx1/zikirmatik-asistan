import * as Application from "expo-application";
import { Platform } from "react-native";

const ANDROID_PACKAGE = "com.zikirmatik_asistan.app";
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
// Replace with your actual App Store ID once published on iOS
const APP_STORE_URL = `https://apps.apple.com/app/id000000000`;

export const STORE_URL = Platform.OS === "android" ? PLAY_STORE_URL : APP_STORE_URL;

function resolveApiBaseUrl() {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) return configured.replace(/\/+$/, "");
  const port = process.env.EXPO_PUBLIC_API_PORT?.trim() || "3000";
  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${port}`;
}

/** Returns the minimum required app version, or null if the check cannot be completed. */
export async function fetchMinRequiredVersion(): Promise<string | null> {
  try {
    const response = await fetch(`${resolveApiBaseUrl()}/app-config`);
    if (!response.ok) return null;
    const json = (await response.json()) as { data?: { minVersion?: string }; minVersion?: string };
    return json?.data?.minVersion ?? json?.minVersion ?? null;
  } catch {
    return null;
  }
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
