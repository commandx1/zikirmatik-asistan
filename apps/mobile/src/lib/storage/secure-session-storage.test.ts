import { beforeEach, describe, expect, it, vi } from "vitest";

const secure = new Map<string, string>();
const plain = new Map<string, string>();
let secureBroken = false;

const guard = () => {
  if (secureBroken) throw new Error("SecureStore unavailable");
};

vi.mock("expo-secure-store", () => ({
  AFTER_FIRST_UNLOCK: 0,
  getItemAsync: vi.fn(async (k: string) => (guard(), secure.get(k) ?? null)),
  setItemAsync: vi.fn(async (k: string, v: string) => (guard(), void secure.set(k, v))),
  deleteItemAsync: vi.fn(async (k: string) => (guard(), void secure.delete(k)))
}));
vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn(async (k: string) => plain.get(k) ?? null),
    setItem: vi.fn(async (k: string, v: string) => void plain.set(k, v)),
    removeItem: vi.fn(async (k: string) => void plain.delete(k))
  }
}));

const KEY = "auth-store-v2";
const MARKER = "secure-session-install-v1";

// The install-check flag lives at module scope (once per process by design),
// so each test gets a fresh module instance to avoid leaking state between
// fresh-install/upgrade/normal-launch scenarios.
async function loadStorage() {
  vi.resetModules();
  return (await import("./secure-session-storage")).secureSessionStorage;
}

describe("secureSessionStorage", () => {
  beforeEach(() => {
    secure.clear();
    plain.clear();
    secureBroken = false;
    vi.clearAllMocks();
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("reads from SecureStore when present", async () => {
    plain.set(MARKER, "1"); // simulate an already-initialized install
    secure.set(KEY, "s");
    plain.set(KEY, "stale");
    const storage = await loadStorage();
    expect(await storage.getItem(KEY)).toBe("s");
  });

  it("migrates a legacy AsyncStorage value once", async () => {
    plain.set(MARKER, "1");
    plain.set(KEY, "legacy");
    const storage = await loadStorage();
    expect(await storage.getItem(KEY)).toBe("legacy");
    expect(secure.get(KEY)).toBe("legacy");
    expect(plain.has(KEY)).toBe(false);
    expect(await storage.getItem(KEY)).toBe("legacy");
  });

  it("returns null when neither store has the key", async () => {
    plain.set(MARKER, "1");
    const storage = await loadStorage();
    expect(await storage.getItem(KEY)).toBeNull();
  });

  it("writes and removes via SecureStore, clearing any plaintext copy", async () => {
    plain.set(MARKER, "1");
    plain.set(KEY, "old");
    const storage = await loadStorage();
    await storage.setItem(KEY, "v");
    expect(secure.get(KEY)).toBe("v");
    expect(plain.has(KEY)).toBe(false);
    await storage.removeItem(KEY);
    expect(secure.has(KEY)).toBe(false);
  });

  it("falls back to AsyncStorage when SecureStore throws", async () => {
    plain.set(MARKER, "1");
    secureBroken = true;
    const storage = await loadStorage();
    await storage.setItem(KEY, "v");
    expect(plain.get(KEY)).toBe("v");
    expect(await storage.getItem(KEY)).toBe("v");
    await storage.removeItem(KEY);
    expect(plain.has(KEY)).toBe(false);
  });

  it("keeps the legacy value when the migration write fails", async () => {
    plain.set(MARKER, "1");
    plain.set(KEY, "legacy");
    const storage = await loadStorage();
    const { setItemAsync } = await import("expo-secure-store");
    vi.mocked(setItemAsync).mockRejectedValueOnce(new Error("too big"));
    expect(await storage.getItem(KEY)).toBe("legacy");
    expect(plain.get(KEY)).toBe("legacy");
  });

  it("fresh install: discards a stale Keychain session and sets the marker", async () => {
    // No marker in AsyncStorage (wiped by uninstall) but Keychain kept the old session.
    secure.set(KEY, "stale-session");
    const storage = await loadStorage();
    const { deleteItemAsync } = await import("expo-secure-store");
    expect(await storage.getItem(KEY)).toBeNull();
    expect(deleteItemAsync).toHaveBeenCalledWith(KEY, expect.anything());
    expect(secure.has(KEY)).toBe(false);
    expect(plain.get(MARKER)).toBe("1");
  });

  it("upgrade from a build without the marker: legacy AsyncStorage value still migrates", async () => {
    // No marker, and no Keychain entry either (this build never wrote one).
    plain.set(KEY, "legacy");
    const storage = await loadStorage();
    expect(await storage.getItem(KEY)).toBe("legacy");
    expect(secure.get(KEY)).toBe("legacy");
    expect(plain.has(KEY)).toBe(false);
    expect(plain.get(MARKER)).toBe("1");
  });

  it("normal launch: marker present, SecureStore value returned untouched", async () => {
    plain.set(MARKER, "1");
    secure.set(KEY, "s");
    const storage = await loadStorage();
    const { deleteItemAsync } = await import("expo-secure-store");
    expect(await storage.getItem(KEY)).toBe("s");
    expect(deleteItemAsync).not.toHaveBeenCalled();
  });

  it("setItem sets the install marker", async () => {
    const storage = await loadStorage();
    expect(plain.has(MARKER)).toBe(false);
    await storage.setItem(KEY, "v");
    expect(plain.get(MARKER)).toBe("1");
  });
});
