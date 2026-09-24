import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";
import { SECURE_SESSION_INSTALL_MARKER } from "./keys";
import { safeAsyncStorage } from "./zustand-storage";

// Persist adapter for the auth store only: tokens live in Keychain/Keystore.
// Legacy plaintext AsyncStorage values are moved over on first read. If
// SecureStore fails (native module missing, keychain error) we fall back to
// AsyncStorage for that call so the session is never lost.
// Persisted JSON is ~0.3-0.8 KB, under the iOS 2048-byte SecureStore warning.
//
// Keychain items survive app uninstall on iOS (unlike AsyncStorage, which is
// wiped), so a reinstall would otherwise boot signed in with the old session.
// An AsyncStorage marker detects that first launch and clears the stale entry.

const options: SecureStore.SecureStoreOptions = {
  // Readable by background work after the first unlock, not just in foreground.
  keychainAccessible: SecureStore.AFTER_FIRST_UNLOCK
};

let warned = false;
function warnOnce(error: unknown) {
  if (!warned) {
    warned = true;
    console.warn("[secure-session-storage] SecureStore unavailable, using AsyncStorage", error);
  }
}

// Runs once per process so concurrent getItem calls don't race each other.
let installCheckPromise: Promise<void> | null = null;
function ensureFreshInstallHandled(name: string) {
  if (!installCheckPromise) {
    installCheckPromise = (async () => {
      const marker = await safeAsyncStorage.getItem(SECURE_SESSION_INSTALL_MARKER);
      if (marker === null) {
        try {
          await SecureStore.deleteItemAsync(name, options);
        } catch {
          // Nothing to clean up, or SecureStore unavailable; ignore.
        }
        await safeAsyncStorage.setItem(SECURE_SESSION_INSTALL_MARKER, "1");
      }
    })();
  }
  return installCheckPromise;
}

export const secureSessionStorage: StateStorage = {
  getItem: async (name) => {
    await ensureFreshInstallHandled(name);

    let secureValue: string | null;
    try {
      secureValue = await SecureStore.getItemAsync(name, options);
    } catch (error) {
      warnOnce(error);
      return safeAsyncStorage.getItem(name);
    }
    if (secureValue !== null) {
      return secureValue;
    }

    const legacy = await safeAsyncStorage.getItem(name);
    if (legacy !== null) {
      try {
        await SecureStore.setItemAsync(name, legacy, options);
        await safeAsyncStorage.removeItem(name);
      } catch (error) {
        // Keep the plaintext copy; migration retries on the next launch.
        warnOnce(error);
      }
    }
    return legacy;
  },
  setItem: async (name, value) => {
    try {
      await SecureStore.setItemAsync(name, value, options);
      // Drop any plaintext copy left by an earlier fallback write.
      await safeAsyncStorage.removeItem(name);
    } catch (error) {
      warnOnce(error);
      await safeAsyncStorage.setItem(name, value);
    }
    // A session written here must never be discarded as "stale" on next launch.
    await safeAsyncStorage.setItem(SECURE_SESSION_INSTALL_MARKER, "1");
  },
  removeItem: async (name) => {
    try {
      await SecureStore.deleteItemAsync(name, options);
    } catch (error) {
      warnOnce(error);
    }
    await safeAsyncStorage.removeItem(name);
  }
};
