import { beforeEach, describe, expect, it, vi } from "vitest";

const refreshSession = vi.fn();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: { getItem: vi.fn(async () => null), setItem: vi.fn(), removeItem: vi.fn() }
}));
vi.mock("expo-secure-store", () => ({ AFTER_FIRST_UNLOCK: 0, getItemAsync: vi.fn(async () => null), setItemAsync: vi.fn(), deleteItemAsync: vi.fn() }));
vi.mock("../features/auth/services/auth-api-client", () => ({
  AuthApiError: class AuthApiError extends Error {
    constructor(
      public readonly kind: "transient" | "terminal",
      message: string
    ) {
      super(message);
    }
  },
  refreshSession: (...args: unknown[]) => refreshSession(...args),
  verifyProvider: vi.fn()
}));
vi.mock("../features/auth/services/mock-provider-auth", () => ({
  ProviderAuthError: class ProviderAuthError extends Error {},
  clearProviderSession: vi.fn(),
  requestProviderIdToken: vi.fn()
}));
vi.mock("../features/auth/services/guest-migration", () => ({ captureGuestMigrationSnapshot: vi.fn() }));
vi.mock("../features/notifications/services/push-device-registration", () => ({
  getOrCreateDeviceId: vi.fn(),
  unlinkPushDevice: vi.fn()
}));
vi.mock("./session-boundary", () => ({ resetSessionScopedStores: vi.fn() }));
vi.mock("./guest-migration-store", () => ({ useGuestMigrationStore: { getState: () => ({ queueSnapshot: vi.fn() }) } }));

const { useAuthStore } = await import("./auth-store");
const { getAuthBridge } = await import("../lib/http/auth-bridge");
const { captureGuestMigrationSnapshot } = await import("../features/auth/services/guest-migration");
const { useGuestMigrationStore } = await import("./guest-migration-store");
const { verifyProvider, AuthApiError } = await import("../features/auth/services/auth-api-client");
const { getOrCreateDeviceId } = await import("../features/notifications/services/push-device-registration");
const { requestProviderIdToken } = await import("../features/auth/services/mock-provider-auth");

const session = { userId: "u1", accessToken: "old-access", refreshToken: "refresh-1", isNewUser: false };

describe("auth-store refreshAuthenticatedSession", () => {
  beforeEach(() => {
    refreshSession.mockReset();
    useAuthStore.setState({ status: "authenticated", session: session as never, isSessionRefreshing: false });
  });

  it("shares one in-flight refresh between concurrent callers", async () => {
    let finish!: () => void;
    refreshSession.mockImplementation(
      () =>
        new Promise((resolve) => {
          finish = () => resolve({ ...session, accessToken: "new-access" });
        })
    );

    const order: string[] = [];
    const first = useAuthStore.getState().refreshAuthenticatedSession().then(() => order.push("first"));
    const second = useAuthStore.getState().refreshAuthenticatedSession().then(() => order.push("second"));

    await Promise.resolve();
    expect(order).toEqual([]);
    expect(useAuthStore.getState().isSessionRefreshing).toBe(true);

    finish();
    await Promise.all([first, second]);

    expect(refreshSession).toHaveBeenCalledTimes(1);
    expect(order).toEqual(["first", "second"]);
    expect(useAuthStore.getState().session?.accessToken).toBe("new-access");
    expect(useAuthStore.getState().isSessionRefreshing).toBe(false);
  });

  it("starts a fresh refresh once the previous one settled", async () => {
    refreshSession.mockResolvedValue({ ...session, accessToken: "a2" });
    await useAuthStore.getState().refreshAuthenticatedSession();
    await useAuthStore.getState().refreshAuthenticatedSession();
    expect(refreshSession).toHaveBeenCalledTimes(2);
  });

  it("registers itself as the HTTP auth bridge", async () => {
    refreshSession.mockResolvedValue({ ...session, accessToken: "bridged" });
    expect(getAuthBridge().getAccessToken()).toBe("old-access");
    await getAuthBridge().refresh();
    expect(getAuthBridge().getAccessToken()).toBe("bridged");
  });
});

describe("auth-store lapsed session → becomeGuest", () => {
  beforeEach(() => {
    refreshSession.mockReset();
    (captureGuestMigrationSnapshot as ReturnType<typeof vi.fn>).mockReset();
    (verifyProvider as ReturnType<typeof vi.fn>).mockReset();
    (getOrCreateDeviceId as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue("device-1");
    (requestProviderIdToken as ReturnType<typeof vi.fn>).mockReset().mockResolvedValue("id-token");
    useAuthStore.setState({
      status: "authenticated",
      session: session as never,
      guestMode: false,
      authError: undefined,
      lastAuthenticatedUserId: session.userId,
      isSessionRefreshing: false
    });
  });

  it("keeps authError and lastAuthenticatedUserId on a terminal refresh error, and becomeGuest does not clear them", async () => {
    refreshSession.mockRejectedValue(new AuthApiError("terminal", "session expired"));

    await useAuthStore.getState().refreshAuthenticatedSession();

    expect(useAuthStore.getState().status).toBe("signed_out");
    expect(useAuthStore.getState().session).toBeUndefined();
    expect(useAuthStore.getState().authError).toBe("session expired");
    expect(useAuthStore.getState().lastAuthenticatedUserId).toBe(session.userId);
    expect(useAuthStore.getState().guestMode).toBe(false);

    // Root effect calls becomeGuest, not continueAsGuest, for this transition.
    useAuthStore.getState().becomeGuest();
    expect(useAuthStore.getState().guestMode).toBe(true);
    expect(useAuthStore.getState().authError).toBe("session expired");
    expect(useAuthStore.getState().lastAuthenticatedUserId).toBe(session.userId);
  });

  it("a subsequent sign-in as a different user does not queue a guest-migration snapshot for the lapsed user's data", async () => {
    refreshSession.mockRejectedValue(new AuthApiError("terminal", "session expired"));
    await useAuthStore.getState().refreshAuthenticatedSession();
    useAuthStore.getState().becomeGuest();
    expect(useAuthStore.getState().guestMode).toBe(true);
    expect(useAuthStore.getState().lastAuthenticatedUserId).toBe(session.userId);

    (verifyProvider as ReturnType<typeof vi.fn>).mockResolvedValue({
      userId: "u2",
      accessToken: "new-access",
      refreshToken: "new-refresh",
      isNewUser: false
    });
    const queueSnapshot = useGuestMigrationStore.getState().queueSnapshot as ReturnType<typeof vi.fn>;
    queueSnapshot.mockClear();

    await useAuthStore.getState().signInWithProvider("google");

    expect(captureGuestMigrationSnapshot).not.toHaveBeenCalled();
    expect(queueSnapshot).not.toHaveBeenCalled();
    expect(useAuthStore.getState().status).toBe("authenticated");
    expect(useAuthStore.getState().lastAuthenticatedUserId).toBe("u2");
  });
});

describe("auth-store persisted state", () => {
  it("never persists a mid-flight authenticating status", () => {
    const partialize = useAuthStore.persist.getOptions().partialize!;
    const persisted = partialize({ ...useAuthStore.getState(), status: "authenticating" }) as { status: string };
    expect(persisted.status).toBe("signed_out");
  });
});
