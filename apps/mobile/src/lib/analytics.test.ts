import { beforeEach, describe, expect, it, vi, type Mock } from "vitest";

let appStateListeners: Array<(state: string) => void> = [];

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  },
  AppState: {
    addEventListener: vi.fn((_event: string, listener: (state: string) => void) => {
      appStateListeners.push(listener);
      return {
        remove: vi.fn(() => {
          appStateListeners = appStateListeners.filter((entry) => entry !== listener);
        })
      };
    })
  }
}));

const storage = new Map<string, string>();

vi.mock("@react-native-async-storage/async-storage", () => ({
  default: {
    getItem: vi.fn((key: string) => Promise.resolve(storage.get(key) ?? null)),
    setItem: vi.fn((key: string, value: string) => {
      storage.set(key, value);
      return Promise.resolve();
    }),
    removeItem: vi.fn((key: string) => {
      storage.delete(key);
      return Promise.resolve();
    })
  }
}));

const getOrCreateDeviceId = vi.fn();

vi.mock("../features/notifications/services/push-device-registration", () => ({
  getOrCreateDeviceId: (...args: unknown[]) => getOrCreateDeviceId(...args)
}));

let mockAccessToken: string | undefined;

vi.mock("../store/auth-store", () => ({
  useAuthStore: {
    getState: () => ({
      session: mockAccessToken ? { accessToken: mockAccessToken } : undefined
    })
  }
}));

function parseQueue(): Array<{ name: string; props?: Record<string, unknown>; ts: string }> {
  const raw = storage.get("analytics-queue-v1");
  return raw ? JSON.parse(raw) : [];
}

function waitForMicrotasks(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 0));
}

describe("analytics", () => {
  let fetchMock: Mock;

  beforeEach(() => {
    storage.clear();
    appStateListeners = [];
    mockAccessToken = undefined;
    vi.resetModules();

    getOrCreateDeviceId.mockReset();
    getOrCreateDeviceId.mockResolvedValue("device-abc");

    fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
  });

  it("queues an event in memory and persists it to AsyncStorage", async () => {
    const { trackEvent } = await import("./analytics");

    await trackEvent("dhikr_completed", { count: 33 });

    const queue = parseQueue();
    expect(queue).toHaveLength(1);
    expect(queue[0]).toMatchObject({ name: "dhikr_completed", props: { count: 33 } });
    expect(typeof queue[0]!.ts).toBe("string");
  });

  it("drops the oldest events once the queue exceeds 200 entries", async () => {
    // Bu testte flush'ın kuyruğu boşaltmaması gerekiyor ki saf kapasite
    // sınırlama davranışı gözlemlenebilsin.
    fetchMock.mockResolvedValue({ ok: false });

    const { trackEvent } = await import("./analytics");
    for (let i = 0; i < 205; i += 1) {
      await trackEvent("app_opened", { i });
    }

    const queue = parseQueue();
    expect(queue).toHaveLength(200);
    expect(queue[0]!.props?.i).toBe(5);
    expect(queue[queue.length - 1]!.props?.i).toBe(204);
  });

  it("sends the queue and empties it on a successful flush", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("dhikr_completed", { count: 33 });
    await trackEvent("app_opened");

    await flushEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(String(url)).toContain("/v1/events");
    const body = JSON.parse(init.body);
    expect(body.deviceId).toBe("device-abc");
    expect(body.events).toHaveLength(2);

    expect(parseQueue()).toHaveLength(0);
  });

  it("keeps the queue intact when the flush response is not ok", async () => {
    fetchMock.mockResolvedValue({ ok: false, status: 500 });

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("dhikr_completed", { count: 33 });

    await flushEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(parseQueue()).toHaveLength(1);
  });

  it("keeps the queue intact when the network request throws", async () => {
    fetchMock.mockRejectedValue(new Error("network down"));

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("dhikr_completed");

    await flushEvents();

    expect(parseQueue()).toHaveLength(1);
  });

  it("does not attempt another flush within 30s of the previous attempt", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("dhikr_completed");
    await flushEvents();

    await trackEvent("app_opened");
    await flushEvents();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("sends the queue in batches of at most 50 events", async () => {
    const seeded = Array.from({ length: 60 }, (_, i) => ({
      name: "app_opened",
      ts: new Date().toISOString(),
      props: { i }
    }));
    storage.set("analytics-queue-v1", JSON.stringify(seeded));
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { flushEvents } = await import("./analytics");
    await flushEvents();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    const firstBody = JSON.parse(fetchMock.mock.calls[0]![1].body);
    const secondBody = JSON.parse(fetchMock.mock.calls[1]![1].body);
    expect(firstBody.events).toHaveLength(50);
    expect(secondBody.events).toHaveLength(10);
    expect(parseQueue()).toHaveLength(0);
  });

  it("sends the bearer token when a session is present, and omits it for guests", async () => {
    mockAccessToken = "token-123";
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("app_opened");
    await flushEvents();

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers.authorization).toBe("Bearer token-123");
  });

  it("omits the authorization header for guests (no session)", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent, flushEvents } = await import("./analytics");
    await trackEvent("app_opened");
    await flushEvents();

    const [, init] = fetchMock.mock.calls[0]!;
    expect(init.headers.authorization).toBeUndefined();
  });

  it("auto-flushes once the queue reaches 20 events", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent } = await import("./analytics");
    for (let i = 0; i < 20; i += 1) {
      await trackEvent("app_opened");
    }

    await waitForMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(parseQueue()).toHaveLength(0);
  });

  it("registers a single AppState listener and flushes when the app backgrounds", async () => {
    fetchMock.mockResolvedValue({ ok: true, text: () => Promise.resolve("{}") });

    const { trackEvent, initAnalytics } = await import("./analytics");
    initAnalytics();
    await trackEvent("app_opened");

    expect(appStateListeners).toHaveLength(1);
    appStateListeners[0]!("background");
    await waitForMicrotasks();

    expect(fetchMock).toHaveBeenCalledTimes(1);
  });
});
