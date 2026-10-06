import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("../../../lib/env", () => ({ API_BASE_URL: "http://api.test" }));

type Handler = (arg?: unknown) => void;
const fake = vi.hoisted(() => ({
  handlers: {} as Record<string, Handler>,
  disconnect: vi.fn(),
  id: "sock-1"
}));
vi.mock("socket.io-client", () => ({
  io: () => ({
    id: fake.id,
    once: (event: string, cb: Handler) => {
      fake.handlers[event] = cb;
    },
    on: vi.fn(),
    disconnect: fake.disconnect
  })
}));

const { createAiProgressSocket } = await import("./ai-progress-socket");

beforeEach(() => {
  fake.handlers = {};
  fake.disconnect.mockReset();
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe("createAiProgressSocket.connect", () => {
  it("rejects and disconnects when the connect is never acknowledged within 6s", async () => {
    const socket = createAiProgressSocket();
    const pending = socket.connect().then(
      () => "resolved",
      (error: Error) => error.message
    );

    await vi.advanceTimersByTimeAsync(5_999);
    expect(fake.disconnect).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(1);

    await expect(pending).resolves.toBe("ai-progress connect timeout");
    expect(fake.disconnect).toHaveBeenCalledTimes(1);
  });

  it("resolves with the socket id and does not time out afterwards", async () => {
    const socket = createAiProgressSocket();
    const pending = socket.connect();
    fake.handlers.connect!();

    await expect(pending).resolves.toBe("sock-1");
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fake.disconnect).not.toHaveBeenCalled();
  });

  it("rejects with the connect_error and clears the timer", async () => {
    const socket = createAiProgressSocket();
    const pending = socket.connect();
    fake.handlers.connect_error!(new Error("boom"));

    await expect(pending).rejects.toThrow("boom");
    await vi.advanceTimersByTimeAsync(10_000);
    expect(fake.disconnect).not.toHaveBeenCalled();
  });
});
