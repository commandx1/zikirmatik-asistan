import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useDeviceNotificationPrefsStore } from "../../../store/device-notification-prefs-store";
import { registerDevice, unlinkDevice } from "./devices-api-client";

const DEVICE_ID_STORAGE_KEY = "push-device-id-v1";
const PERMISSION_PROMPTED_STORAGE_KEY = "push-permission-prompted-v1";

let cachedDeviceId: string | null = null;

// Stable across login/logout/guest-mode changes so the backend device
// record (and its push token) survives auth state transitions. Only
// changes on reinstall.
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await safeGetItem(DEVICE_ID_STORAGE_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = Crypto.randomUUID();
  cachedDeviceId = generated;
  await safeSetItem(DEVICE_ID_STORAGE_KEY, generated);
  return generated;
}

// Exported so other services (e.g. the notification-prefs updater) can
// build a register-device payload without duplicating this mapping.
export function resolvePlatform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

// Best-effort: never throws. If permission was already asked once (granted
// or denied), we never trigger the native prompt again automatically — the
// user can still grant it later via the explicit reminder opt-in flow.
async function ensurePushPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  if (current.granted) {
    return true;
  }

  if (!current.canAskAgain) {
    return false;
  }

  const alreadyPrompted = await safeGetItem(PERMISSION_PROMPTED_STORAGE_KEY);
  if (alreadyPrompted) {
    return false;
  }

  await safeSetItem(PERMISSION_PROMPTED_STORAGE_KEY, "1");
  const requested = await Notifications.requestPermissionsAsync();
  return requested.granted;
}

async function getExpoPushToken(): Promise<string | undefined> {
  try {
    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const result = await Notifications.getExpoPushTokenAsync(
      projectId ? { projectId } : undefined
    );
    return result.data;
  } catch {
    // Simulators / dev builds without push capability throw here — treat as
    // "no token available" instead of failing registration.
    return undefined;
  }
}

// Registers (or refreshes) this device with the backend. Works for guests:
// pass accessToken only when authenticated so the device gets linked.
// Always forwards the local device-notification-prefs-store values as
// `prefs` so the backend's own defaults (opt-in-friendly `true`) never
// silently diverge from what the client's single "Bildirimler" master
// toggle actually shows — this store is the source of truth.
export async function registerPushDevice(accessToken?: string): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const granted = await ensurePushPermission();
  const expoPushToken = granted ? await getExpoPushToken() : undefined;
  const { specialDays, friday } = useDeviceNotificationPrefsStore.getState();

  await registerDevice(
    {
      deviceId,
      expoPushToken,
      platform: resolvePlatform(),
      prefs: { specialDays, friday }
    },
    accessToken
  );
}

// Called on logout: unlinks the device from the signed-out user without
// deleting it, so the same device keeps receiving guest-relevant pushes.
export async function unlinkPushDevice(): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  await unlinkDevice(deviceId);
}

async function safeGetItem(key: string) {
  try {
    return await AsyncStorage.getItem(key);
  } catch {
    return null;
  }
}

async function safeSetItem(key: string, value: string) {
  try {
    await AsyncStorage.setItem(key, value);
  } catch {
    // Native module missing in current binary; ignore and keep in-memory state.
  }
}
