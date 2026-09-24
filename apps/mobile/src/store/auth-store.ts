import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { secureSessionStorage } from "../lib/storage/secure-session-storage";
import { AUTH_STORE_KEY } from "../lib/storage/keys";
import { Platform } from "react-native";
import { i18n } from "../i18n";
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
import { registerAuthBridge } from "../lib/http/auth-bridge";

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
  signInWithProvider: (provider: AuthProvider) => Promise<void>;
  refreshAuthenticatedSession: () => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  exitGuest: () => void;
  markHydrated: () => void;
};

// Shared in-flight refresh; `isSessionRefreshing` stays as the UI flag.
let refreshPromise: Promise<void> | null = null;

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      status: "signed_out",
      guestMode: false,
      hasHydrated: false,
      isSessionRefreshing: false,
      lastAuthenticatedUserId: undefined,
      signInWithProvider: async (provider) => {
        const currentStatus = get().status;
        if (currentStatus === "authenticating") {
          return;
        }

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
            resetSessionScopedStores(previousUserId);
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
      refreshAuthenticatedSession: () => {
        // Concurrent callers (e.g. several requests hitting 401 at once) share
        // the in-flight refresh instead of returning before it lands.
        if (refreshPromise) {
          return refreshPromise;
        }

        const { status, session } = get();
        if (status !== "authenticated" || !session) {
          return Promise.resolve();
        }

        refreshPromise = runSessionRefresh(session.refreshToken).finally(() => {
          refreshPromise = null;
        });
        return refreshPromise;
      },
      signOut: async () => {
        resetSessionScopedStores(get().session?.userId);
        set({
          status: "signed_out",
          guestMode: false,
          session: undefined,
          authError: undefined,
          isSessionRefreshing: false,
          lastSessionRefreshAt: undefined
        });

        await clearProviderSession("google");
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
      name: AUTH_STORE_KEY,
      storage: createJSONStorage(() => secureSessionStorage),
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

registerAuthBridge({
  getAccessToken: () => useAuthStore.getState().session?.accessToken,
  refresh: () => useAuthStore.getState().refreshAuthenticatedSession()
});

async function runSessionRefresh(refreshToken: string) {
  const set = useAuthStore.setState;
  set({ isSessionRefreshing: true });
  try {
    const refreshed = await refreshSession({ refreshToken });
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
}

function resolveClientPlatform(): ClientPlatform {
  return Platform.OS === "ios" ? "ios" : "android";
}

function toUserFacingAuthMessage(error: unknown) {
  if (error instanceof AuthApiError || error instanceof ProviderAuthError) {
    return error.message;
  }

  return i18n.t("auth:errors.unexpectedSignIn");
}
