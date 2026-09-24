import { describe, expect, it } from "vitest";
import { appendMessage, appendStreamToken, finalizeStream, removeTransientMessages } from "./chat-messages";
import type { ChatMessageRaw } from "../types";
import type { ChatStreamDonePayload } from "./ai-chat-api-client";

const msg = (id: string, role: ChatMessageRaw["role"], content = ""): ChatMessageRaw => ({
  id,
  conversationId: "c1",
  role,
  content,
  createdAt: "2026-09-25T00:00:00.000Z"
});

const base = [msg("m0", "assistant", "önceki")];

describe("chat-messages", () => {
  it("appends an optimistic message without mutating the input", () => {
    const next = appendMessage(base, msg("optimistic-1", "user", "selam"));
    expect(next.map((m) => m.id)).toEqual(["m0", "optimistic-1"]);
    expect(base).toHaveLength(1);
  });

  it("appends a token only to the streaming message", () => {
    const list = [...base, msg("streaming-1", "assistant", "Mer")];
    const next = appendStreamToken(list, "streaming-1", "haba");
    expect(next[1]?.content).toBe("Merhaba");
    expect(next[0]).toBe(list[0]);
  });

  it("finalizes on done with server ids, authoritative content and metadata", () => {
    const list = [...base, msg("optimistic-1", "user", "selam"), msg("streaming-1", "assistant", "kısmi")];
    const payload: ChatStreamDonePayload = {
      messageId: "srv-a",
      content: "nihai",
      conversationId: "c1",
      userMessage: msg("srv-u", "user", "selam"),
      mode: "bilgi",
      coverage: "full"
    };
    const next = finalizeStream(list, "optimistic-1", "streaming-1", payload);
    expect(next.map((m) => m.id)).toEqual(["m0", "srv-u", "srv-a"]);
    expect(next[2]).toMatchObject({ content: "nihai", sourceCitations: [], mode: "bilgi", coverage: "full" });
  });

  it("keeps streamed content when done carries empty content", () => {
    const list = [msg("streaming-1", "assistant", "akış")];
    const payload = { messageId: "srv-a", content: "", conversationId: "c1", userMessage: msg("u", "user") };
    expect(finalizeStream(list, "optimistic-1", "streaming-1", payload)[0]?.content).toBe("akış");
  });

  it("removes optimistic and streaming messages on error", () => {
    const list = [...base, msg("optimistic-1", "user"), msg("streaming-1", "assistant")];
    expect(removeTransientMessages(list, "optimistic-1", "streaming-1").map((m) => m.id)).toEqual(["m0"]);
  });
});
