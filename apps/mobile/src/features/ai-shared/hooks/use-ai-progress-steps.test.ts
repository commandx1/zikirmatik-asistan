import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("react", () => ({
  useState: (initial: unknown) => [initial, vi.fn()],
  useCallback: (fn: unknown) => fn
}));

const socket = vi.hoisted(() => ({
  connect: vi.fn(),
  onStep: vi.fn(),
  onChatStep: vi.fn(),
  disconnect: vi.fn()
}));
vi.mock("../../ai-guide/services/ai-progress-socket", () => ({ createAiProgressSocket: () => socket }));

const { useAiProgressSteps } = await import("./use-ai-progress-steps");

beforeEach(() => {
  Object.values(socket).forEach((fn) => fn.mockReset());
});

describe("useAiProgressSteps.withProgress", () => {
  it("still runs the request (without socketId) when the socket connect rejects", async () => {
    socket.connect.mockRejectedValue(new Error("ai-progress connect timeout"));
    const run = vi.fn(async (socketId?: string) => `ran:${socketId}`);

    const { withProgress } = useAiProgressSteps("guide");
    await expect(withProgress((key) => key, run)).resolves.toBe("ran:undefined");

    expect(run).toHaveBeenCalledWith(undefined);
    expect(socket.disconnect).toHaveBeenCalledTimes(1);
  });

  it("passes the socketId to the request when connected", async () => {
    socket.connect.mockResolvedValue("sock-1");
    const run = vi.fn(async (socketId?: string) => socketId);

    const { withProgress } = useAiProgressSteps("guide");
    await expect(withProgress((key) => key, run)).resolves.toBe("sock-1");
  });
});
