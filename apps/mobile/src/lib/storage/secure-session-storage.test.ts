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

const { secureSessionStorage: storage } = await import("./secure-session-storage");
const KEY = "auth-store-v2";

describe("secureSessionStorage", () => {
  beforeEach(() => {
    secure.clear();
    plain.clear();
    secureBroken = false;
    vi.spyOn(console, "warn").mockImplementation(() => {});
  });

  it("reads from SecureStore when present", async () => {
    secure.set(KEY, "s");
    plain.set(KEY, "stale");
    expect(await storage.getItem(KEY)).toBe("s");
  });

  it("migrates a legacy AsyncStorage value once", async () => {
    plain.set(KEY, "legacy");
    expect(await storage.getItem(KEY)).toBe("legacy");
    expect(secure.get(KEY)).toBe("legacy");
    expect(plain.has(KEY)).toBe(false);
    expect(await storage.getItem(KEY)).toBe("legacy");
  });

  it("returns null when neither store has the key", async () => {
    expect(await storage.getItem(KEY)).toBeNull();
  });

  it("writes and removes via SecureStore, clearing any plaintext copy", async () => {
    plain.set(KEY, "old");
    await storage.setItem(KEY, "v");
    expect(secure.get(KEY)).toBe("v");
    expect(plain.has(KEY)).toBe(false);
    await storage.removeItem(KEY);
    expect(secure.has(KEY)).toBe(false);
  });

  it("falls back to AsyncStorage when SecureStore throws", async () => {
    secureBroken = true;
    await storage.setItem(KEY, "v");
    expect(plain.get(KEY)).toBe("v");
    expect(await storage.getItem(KEY)).toBe("v");
    await storage.removeItem(KEY);
    expect(plain.has(KEY)).toBe(false);
  });

  it("keeps the legacy value when the migration write fails", async () => {
    plain.set(KEY, "legacy");
    const { setItemAsync } = await import("expo-secure-store");
    vi.mocked(setItemAsync).mockRejectedValueOnce(new Error("too big"));
    expect(await storage.getItem(KEY)).toBe("legacy");
    expect(plain.get(KEY)).toBe("legacy");
  });
});
