import { Platform } from "react-native";

// Single place that reads EXPO_PUBLIC_* vars. Keep the literal
// `process.env.EXPO_PUBLIC_X` form: Expo inlines these at build time.
// Values are raw (trimmed); call-site defaults stay at the call site.

export const API_PORT = process.env.EXPO_PUBLIC_API_PORT?.trim();

export const AUTH_SIMULATE_PROVIDER_OUTAGE = process.env.EXPO_PUBLIC_AUTH_SIMULATE_PROVIDER_OUTAGE === "1";
export const E2E_MOCK_AUTH = process.env.EXPO_PUBLIC_E2E_MOCK_AUTH === "1";

export const GOOGLE_WEB_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID?.trim();
export const GOOGLE_ANDROID_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID?.trim();
export const GOOGLE_IOS_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID?.trim();

export const DEV_GOOGLE_EMAIL = process.env.EXPO_PUBLIC_DEV_GOOGLE_EMAIL?.trim();
export const DEV_GOOGLE_NAME = process.env.EXPO_PUBLIC_DEV_GOOGLE_NAME?.trim();
export const DEV_GOOGLE_SUB = process.env.EXPO_PUBLIC_DEV_GOOGLE_SUB?.trim();

export const REVENUECAT_ENTITLEMENT_ID = process.env.EXPO_PUBLIC_REVENUECAT_ENTITLEMENT_ID?.trim();
export const REVENUECAT_API_KEY_IOS = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS?.trim();
export const REVENUECAT_API_KEY_ANDROID = process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID?.trim();

// Configured base URL without trailing slashes, else the local dev API
// (Android emulator reaches the host via 10.0.2.2).
export const API_BASE_URL = (() => {
  const configured = process.env.EXPO_PUBLIC_API_BASE_URL?.trim();
  if (configured) {
    return configured.replace(/\/+$/, "");
  }

  const host = Platform.OS === "android" ? "10.0.2.2" : "127.0.0.1";
  return `http://${host}:${API_PORT || "3000"}`;
})();
