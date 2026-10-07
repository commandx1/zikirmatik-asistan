import { describe, expect, it, vi } from "vitest";
import {
  CLIENT_MESSAGE_ID_CONFLICT,
  CLIENT_MESSAGE_ID_IN_PROGRESS,
  classifyChatError,
  isBlankMessage,
  resolveClientMessageId,
  retryOnInProgress
} from "./chat-send-policy";

describe("isBlankMessage (MOB-AIS whitespace guard)", () => {
  it.each(["", " ", "\n\t  "])("blocks %j", (t) => expect(isBlankMessage(t)).toBe(true));
  it("allows real text", () => expect(isBlankMessage(" a ")).toBe(false));
});

describe("resolveClientMessageId (A-11)", () => {
  it("generates once and reuses for the same text", () => {
    const create = vi.fn().mockReturnValueOnce("id-1").mockReturnValueOnce("id-2");
    const first = resolveClientMessageId(undefined, "merhaba", create);
    const retry = resolveClientMessageId(first, "merhaba", create);
    expect(retry.id).toBe("id-1");
    expect(create).toHaveBeenCalledTimes(1);
  });
  it("new text gets a new id", () => {
    const create = vi.fn().mockReturnValueOnce("id-1").mockReturnValueOnce("id-2");
    const first = resolveClientMessageId(undefined, "a", create);
    expect(resolveClientMessageId(first, "b", create).id).toBe("id-2");
  });
});

describe("classifyChatError", () => {
  it("routes credit + daily limit to the premium sheet (B-30), CONFLICT is a plain error", () => {
    expect(classifyChatError("AI_CREDIT_INSUFFICIENT")).toBe("credit");
    expect(classifyChatError("DAILY_LIMIT_REACHED")).toBe("credit");
    expect(classifyChatError("AI_UNAVAILABLE")).toBe("unavailable");
    expect(classifyChatError(CLIENT_MESSAGE_ID_IN_PROGRESS)).toBe("in_progress");
    expect(classifyChatError(CLIENT_MESSAGE_ID_CONFLICT)).toBe("other");
    expect(classifyChatError(undefined)).toBe("other");
  });
});

describe("retryOnInProgress", () => {
  const inProgress = Object.assign(new Error("x"), { code: CLIENT_MESSAGE_ID_IN_PROGRESS });
  it("retries after a delay then succeeds", async () => {
    const sleep = vi.fn(async () => {});
    const run = vi.fn().mockRejectedValueOnce(inProgress).mockResolvedValueOnce("ok");
    await expect(retryOnInProgress(run, { sleep })).resolves.toBe("ok");
    expect(sleep).toHaveBeenCalledWith(1500);
  });
  it("gives up after the delays are exhausted", async () => {
    const run = vi.fn().mockRejectedValue(inProgress);
    await expect(retryOnInProgress(run, { sleep: async () => {}, delaysMs: [1, 1] })).rejects.toBe(inProgress);
    expect(run).toHaveBeenCalledTimes(3);
  });
  it("CONFLICT and other errors are not retried", async () => {
    const conflict = Object.assign(new Error("c"), { code: CLIENT_MESSAGE_ID_CONFLICT });
    const run = vi.fn().mockRejectedValue(conflict);
    await expect(retryOnInProgress(run, { sleep: async () => {} })).rejects.toBe(conflict);
    expect(run).toHaveBeenCalledTimes(1);
  });
});
