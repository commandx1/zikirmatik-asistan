import * as SecureStore from "expo-secure-store";
import type { StateStorage } from "zustand/middleware";
import { safeAsyncStorage } from "./zustand-storage";

// Persist adapter for the auth store only: tokens live in Keychain/Keystore.
// Legacy plaintext AsyncStorage values are moved over on first read. If
// SecureStore fails (native module missing, keychain error) we fall back to
// AsyncStorage for that call so the session is never lost.
// Persisted JSON is ~0.3-0.8 KB, under the iOS 2048-byte SecureStore warning.

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

export const secureSessionStorage: StateStorage = {
  getItem: async (name) => {
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
    } catch (error) {
      warnOnce(error);
      await safeAsyncStorage.setItem(name, value);
      return;
    }
    // Drop any plaintext copy left by an earlier fallback write.
    await safeAsyncStorage.removeItem(name);
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
