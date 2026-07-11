import { create } from "zustand";
import { createJSONStorage, persist, type StateStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Platform } from "react-native";
import type {
  AuthProvider,
  AuthSession,
  ClientPlatform
} from "@zikirmatik/shared";
import { AuthApiError, refreshSession, verifyProvider } from "../features/auth/services/auth-api-client";
import { clearProviderSession, ProviderAuthError, requestProviderIdToken } from "../features/auth/services/mock-provider-auth";
import { captureGuestMigrationSnapshot } from "../features/auth/services/guest-migration";
import { getOrCreateDeviceId, unlinkPushDevice } from "../features/notifications/services/push-device-registration";
import { resetSessionScopedStores } from "./session-boundary";
import { useGuestMigrationStore } from "./guest-migration-store";

type AuthStatus = "signed_out" | "authenticating" | "authenticated";

type AuthStore = {
  status: AuthStatus;
  guestMode: boolean;
  hasHydrated: boolean;
  session?: AuthSession;
  authError?: string;
  isSessionRefreshing: boolean;
  lastSessionRefreshAt?: string;
  lastAuthenticatedUserId?: string;
  signInWithRequiredProvider: () => Promise<void>;
  refreshAuthenticatedSession: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
  markHydrated: () => void;
};

const safeAsyncStorage: StateStorage = {
  getItem: async (name) => {
    try {
      return await AsyncStorage.getItem(name);
    } catch {
      return null;
    }
  },
  setItem: async (name, value) => {
    try {
      await AsyncStorage.setItem(name, value);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  },
  removeItem: async (name) => {
    try {
      await AsyncStorage.removeItem(name);
    } catch {
      // Native module missing in current binary; ignore and keep in-memory state.
    }
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      status: "signed_out",
      guestMode: false,
      hasHydrated: false,
      isSessionRefreshing: false,
      lastAuthenticatedUserId: undefined,
      signInWithRequiredProvider: async () => {
        const currentStatus = get().status;
        if (currentStatus === "authenticating") {
          return;
        }

        const provider = resolveRequiredProvider();
        const platform = resolveClientPlatform();
        const previousUserId = get().lastAuthenticatedUserId;
        // Capture guest-local progress BEFORE any session-scoped reset can wipe
        // it; only queued after the sign-in actually succeeds.
        const guestSnapshot = get().guestMode ? captureGuestMigrationSnapshot() : null;

        set({
          status: "authenticating",
          authError: undefined
        });

        try {
          const idToken = await requestProviderIdToken(provider);
          const deviceId = await getOrCreateDeviceId();

          const session = await verifyProvider({
            provider,
            platform,
            deviceId,
            idToken
          });

          if (guestSnapshot) {
            useGuestMigrationStore.getState().queueSnapshot(guestSnapshot);
          }

          if (previousUserId && previousUserId !== session.userId) {
            resetSessionScopedStores();
          }

          set({
            status: "authenticated",
            guestMode: false,
            session,
            authError: undefined,
            isSessionRefreshing: false,
            lastSessionRefreshAt: new Date().toISOString(),
            lastAuthenticatedUserId: session.userId
          });
        } catch (error) {
          const message = toUserFacingAuthMessage(error);

          set({
            status: "signed_out",
            authError: message,
            isSessionRefreshing: false,
            session: undefined
          });
        }
      },
      refreshAuthenticatedSession: async () => {
        const { status, session, isSessionRefreshing } = get();
        if (status !== "authenticated" || !session || isSessionRefreshing) {
          return;
        }

        set({ isSessionRefreshing: true });
        try {
          const refreshed = await refreshSession({ refreshToken: session.refreshToken });
          set((state) => {
            if (!state.session) {
              return { isSessionRefreshing: false };
            }

            return {
              session: {
                ...state.session,
                ...refreshed,
                isNewUser: state.session.isNewUser
              },
              authError: undefined,
              isSessionRefreshing: false,
              lastSessionRefreshAt: new Date().toISOString(),
              lastAuthenticatedUserId: refreshed.userId
            };
          });
        } catch (error) {
          if (error instanceof AuthApiError && error.kind === "transient") {
            set({ isSessionRefreshing: false });
            return;
          }

          set({
            status: "signed_out",
            session: undefined,
            authError: toUserFacingAuthMessage(error),
            isSessionRefreshing: false,
            lastSessionRefreshAt: undefined
          });
        }
      },
      signOut: async () => {
        const provider = resolveRequiredProvider();
        resetSessionScopedStores();
        set({
          status: "signed_out",
          guestMode: false,
          session: undefined,
          authError: undefined,
          isSessionRefreshing: false,
          lastSessionRefreshAt: undefined
        });

        await clearProviderSession(provider);
        // Best effort: the device must keep receiving guest-relevant pushes
        // even if this call fails (e.g. offline logout).
        await unlinkPushDevice().catch(() => {});
      },
      continueAsGuest: () =>
        set({
          status: "signed_out",
          guestMode: true,
          session: undefined,
          authError: undefined,
          isSessionRefreshing: false,
          lastSessionRefreshAt: undefined
        }),
      exitGuest: () =>
        set({
          guestMode: false
        }),
      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "auth-store-v2",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        status: state.status,
        guestMode: state.guestMode,
        session: state.session,
        lastSessionRefreshAt: state.lastSessionRefreshAt,
        lastAuthenticatedUserId: state.lastAuthenticatedUserId
      }),
      onRehydrateStorage: () => (state) => {
        state?.markHydrated();
      }
    }
  )
);

function resolveRequiredProvider(): AuthProvider {
  return Platform.OS === "ios" ? "apple" : "google";
}

function resolveClientPlatform(): ClientPlatform {
  return Platform.OS === "ios" ? "ios" : "android";
}

function toUserFacingAuthMessage(error: unknown) {
  if (error instanceof AuthApiError || error instanceof ProviderAuthError) {
    return error.message;
  }

  return "Giriş sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
}
