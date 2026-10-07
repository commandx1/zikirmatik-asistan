import AsyncStorage from "@react-native-async-storage/async-storage";
import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { registerDevice, unlinkDevice } from "./devices-api-client";
import { getDeviceTimeZone } from "../../../lib/http/client";
import { usePushRegistrationStore } from "../../../store/push-registration-store";
import { PUSH_DEVICE_ID_KEY } from "../../../lib/storage/keys";


let cachedDeviceId: string | null = null;

// Stable across login/logout/guest-mode changes so the backend device
// record (and its push token) survives auth state transitions. Only
// changes on reinstall.
export async function getOrCreateDeviceId(): Promise<string> {
  if (cachedDeviceId) {
    return cachedDeviceId;
  }

  const stored = await safeGetItem(PUSH_DEVICE_ID_KEY);
  if (stored) {
    cachedDeviceId = stored;
    return stored;
  }

  const generated = Crypto.randomUUID();
  cachedDeviceId = generated;
  await safeSetItem(PUSH_DEVICE_ID_KEY, generated);
  return generated;
}

// Exported so other services (e.g. the notification-prefs updater) can
// build a register-device payload without duplicating this mapping.
export function resolvePlatform(): "ios" | "android" {
  return Platform.OS === "ios" ? "ios" : "android";
}

// B-11: registration never opens the OS permission dialog. The explanation
// card (reminder-offer.ts) or an explicit reminder toggle asks; here we only
// register silently with a push token when permission is already granted.
async function hasPushPermission(): Promise<boolean> {
  const current = await Notifications.getPermissionsAsync();
  return current.granted;
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
// pass authenticated=true only when signed in so the device gets linked.
//
// Deliberately does NOT send `prefs`: registration runs on every app start
// (usePushDeviceRegistration) and used to fire before the zustand persist
// hydration finished, silently overwriting the backend prefs with the
// store's initial values. Prefs are only written by the explicit
// "Bildirimler" master-toggle flow (sync-notification-settings.ts →
// updateDevicePrefs); new devices get the backend's opt-in-friendly
// $setOnInsert defaults (`true`).
export async function registerPushDevice(
  authenticated?: boolean,
  locale?: "tr" | "en",
  timezone: string | undefined = getDeviceTimeZone()
): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  const granted = await hasPushPermission();
  const expoPushToken = granted ? await getExpoPushToken() : undefined;

  try {
    await registerDevice(
      {
        deviceId,
        expoPushToken,
        platform: resolvePlatform(),
        ...(locale ? { locale } : {}),
        ...(timezone ? { timezone } : {})
      },
      authenticated
    );
    // Only a genuine success (server 2xx above) AND a real push token counts
    // as "reachable via server push" — see push-registration-store.ts.
    usePushRegistrationStore.getState().setServerPushActive(Boolean(expoPushToken));
  } catch (error) {
    usePushRegistrationStore.getState().setServerPushActive(false);
    throw error;
  }
}

let lastSyncedKey: string | null = null;
let syncQueue: Promise<unknown> = Promise.resolve();

// Hook entry point (app start, auth/locale change, every foreground): only
// hits the network when auth, locale, device timezone or push permission changed since the
// last SUCCESSFUL registration in this process (a failure retries on the next
// call). Serialized so a locale switch can't be overtaken by an older call.
export function syncPushDeviceRegistration(authenticated: boolean, locale: "tr" | "en"): Promise<void> {
  const next = syncQueue.then(async () => {
    const timezone = getDeviceTimeZone();
    // İzin sonradan (hatırlatma kartı / ayar) verilirse token'lı kayıt da gitsin.
    const granted = await hasPushPermission();
    const key = `${authenticated}|${locale}|${timezone ?? ""}|${granted}`;
    if (key === lastSyncedKey) {
      return;
    }
    await registerPushDevice(authenticated, locale, timezone);
    lastSyncedKey = key;
  });
  syncQueue = next.catch(() => {});
  return next;
}

// Called on logout: unlinks the device from the signed-out user without
// deleting it, so the same device keeps receiving guest-relevant pushes.
export async function unlinkPushDevice(): Promise<void> {
  const deviceId = await getOrCreateDeviceId();
  try {
    await unlinkDevice(deviceId);
  } finally {
    // Conservative reset: until the next registration reconfirms server
    // reachability, fall back to local scheduling rather than risk silence.
    usePushRegistrationStore.getState().setServerPushActive(false);
  }
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
