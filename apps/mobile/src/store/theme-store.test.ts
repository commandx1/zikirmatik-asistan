import { beforeEach, describe, expect, it, vi } from "vitest";

const saveUserPreferences = vi.fn(async () => ({}));
vi.mock("../lib/storage/zustand-storage", () => ({
  safeAsyncStorage: { getItem: vi.fn(async () => null), setItem: vi.fn(), removeItem: vi.fn() }
}));
vi.mock("../features/users/services/users-api-client", () => ({
  saveUserPreferences: (...a: unknown[]) => saveUserPreferences(...(a as []))
}));
vi.mock("./auth-store", () => ({
  useAuthStore: { getState: () => ({ status: "authenticated", session: { userId: "u1" } }) }
}));

const { useThemeStore } = await import("./theme-store");

describe("theme-store enforceThemeEntitlement (A-07 + M-13)", () => {
  beforeEach(() => {
    saveUserPreferences.mockClear();
    useThemeStore.setState({ themeName: "gece-koyu" });
  });

  it("premium ended → premium theme reverts to the free default and is synced", () => {
    useThemeStore.setState({ themeName: "altin-varak" });
    useThemeStore.getState().enforceThemeEntitlement(false);
    expect(useThemeStore.getState().themeName).toBe("gece-koyu");
    expect(saveUserPreferences).toHaveBeenCalledWith("u1", { theme: "gece-koyu" });
  });

  it("still premium → theme kept", () => {
    useThemeStore.setState({ themeName: "altin-varak" });
    useThemeStore.getState().enforceThemeEntitlement(true);
    expect(useThemeStore.getState().themeName).toBe("altin-varak");
  });

  it("free theme untouched, no sync", () => {
    useThemeStore.setState({ themeName: "karadeniz" });
    useThemeStore.getState().enforceThemeEntitlement(false);
    expect(useThemeStore.getState().themeName).toBe("karadeniz");
    expect(saveUserPreferences).not.toHaveBeenCalled();
  });
});
