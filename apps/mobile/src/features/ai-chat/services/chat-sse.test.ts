import { afterEach, describe, expect, it, vi } from "vitest";
import { processSseEvent, readSse, SseStreamError, type SseReader } from "./chat-sse";

const enc = new TextEncoder();
const readerOf = (chunks: string[]): SseReader => {
  let i = 0;
  return { read: async () => (i < chunks.length ? { done: false, value: enc.encode(chunks[i++]) } : { done: true }) };
};
const done = 'event: done\ndata: {"messageId":"m1","content":"x"}\n\n';

afterEach(() => vi.useRealTimers());

describe("processSseEvent", () => {
  it("SSE error event carries code AI_CREDIT_INSUFFICIENT through", () => {
    const onError = vi.fn();
    processSseEvent('event: error\ndata: {"code":"AI_CREDIT_INSUFFICIENT","message":"m"}', { onError }, "fb");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ code: "AI_CREDIT_INSUFFICIENT", message: "m" }));
  });
  it("error without message uses fallback", () => {
    const onError = vi.fn();
    processSseEvent('event: error\ndata: {"code":"X"}', { onError }, "fb");
    expect(onError).toHaveBeenCalledWith(expect.objectContaining({ message: "fb" }));
  });
});

describe("readSse", () => {
  it("delivers tokens and done across split chunks", async () => {
    const onToken = vi.fn();
    const onDone = vi.fn();
    await readSse(readerOf(['event: token\ndata: {"delta":"a"}\n', "\n", done]), { onToken, onDone }, "fb");
    expect(onToken).toHaveBeenCalledWith("a");
    expect(onDone).toHaveBeenCalledTimes(1);
  });

  it("B-29: stream closing without done throws closed_without_done", async () => {
    const p = readSse(readerOf(['event: token\ndata: {"delta":"a"}\n\n']), {}, "fb");
    await expect(p).rejects.toMatchObject({ reason: "closed_without_done" });
  });

  it("B-28: silent stream trips the idle watchdog", async () => {
    vi.useFakeTimers();
    const cancel = vi.fn(async () => {});
    const reader: SseReader = { read: () => new Promise(() => {}), cancel };
    const p = readSse(reader, {}, "fb", 1000);
    const assertion = expect(p).rejects.toBeInstanceOf(SseStreamError);
    await vi.advanceTimersByTimeAsync(1001);
    await assertion;
    expect(cancel).toHaveBeenCalled();
  });

  it("watchdog resets on each chunk", async () => {
    vi.useFakeTimers();
    let n = 0;
    const reader: SseReader = {
      read: () =>
        new Promise((resolve) => {
          setTimeout(() => resolve(n++ === 0 ? { done: false, value: enc.encode(done) } : { done: true }), 800);
        })
    };
    const p = readSse(reader, {}, "fb", 1000);
    await vi.advanceTimersByTimeAsync(1700);
    await expect(p).resolves.toBeUndefined();
  });
});
