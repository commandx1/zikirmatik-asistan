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
import { ProviderAuthError, requestProviderIdToken } from "../features/auth/services/mock-provider-auth";

type AuthStatus = "signed_out" | "authenticating" | "authenticated";

type AuthStore = {
  status: AuthStatus;
  hasHydrated: boolean;
  session?: AuthSession;
  authError?: string;
  isSessionRefreshing: boolean;
  lastSessionRefreshAt?: string;
  signInWithRequiredProvider: () => Promise<void>;
  refreshAuthenticatedSession: () => Promise<void>;
  signOut: () => void;
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
      hasHydrated: false,
      isSessionRefreshing: false,
      signInWithRequiredProvider: async () => {
        const provider = resolveRequiredProvider();
        const platform = resolveClientPlatform();

        set({
          status: "authenticating",
          authError: undefined
        });

        try {
          const idToken = await requestProviderIdToken(provider);

          const session = await verifyProvider({
            provider,
            platform,
            deviceId: buildDeviceId(platform),
            idToken
          });

          set({
            status: "authenticated",
            session,
            authError: undefined,
            isSessionRefreshing: false,
            lastSessionRefreshAt: new Date().toISOString()
          });
        } catch (error) {
          const message = toUserFacingAuthMessage(error);

          set({
            status: "signed_out",
            authError: message,
            isSessionRefreshing: false
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
              lastSessionRefreshAt: new Date().toISOString()
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
      signOut: () => {
        set({
          status: "signed_out",
          session: undefined,
          authError: undefined,
          isSessionRefreshing: false,
          lastSessionRefreshAt: undefined
        });
      },
      markHydrated: () => set({ hasHydrated: true })
    }),
    {
      name: "auth-store-v2",
      storage: createJSONStorage(() => safeAsyncStorage),
      partialize: (state) => ({
        status: state.status,
        session: state.session,
        lastSessionRefreshAt: state.lastSessionRefreshAt
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

function buildDeviceId(platform: ClientPlatform) {
  return `${platform}-device-local`;
}

function toUserFacingAuthMessage(error: unknown) {
  if (error instanceof AuthApiError || error instanceof ProviderAuthError) {
    return error.message;
  }

  return "Giriş sırasında beklenmeyen bir hata oluştu. Lütfen tekrar deneyin.";
}
