import { beforeEach, describe, expect, it, vi } from "vitest";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { readAiGuideCache, writeAiGuideCache, type LastAiGuideResult } from "./ai-guide-cache";

const getItem = vi.mocked(AsyncStorage.getItem);
const setItem = vi.mocked(AsyncStorage.setItem);

const result: LastAiGuideResult = {
  prompt: "huzur",
  assistantNote: "not",
  recommendationId: "r1",
  recommendations: [{ id: "d1", arabic: "x", transliteration: "t", meaning: { tr: "a", en: "b" } }]
};

beforeEach(() => {
  getItem.mockReset();
  setItem.mockReset();
});

describe("ai-guide-cache", () => {
  it("roundtrips a written result under the user key", async () => {
    setItem.mockResolvedValue(undefined);
    await writeAiGuideCache("u1", result);
    expect(setItem).toHaveBeenCalledWith("ai-guide:last:u1", expect.any(String));
    getItem.mockResolvedValue(setItem.mock.calls[0]![1]);
    await expect(readAiGuideCache("u1")).resolves.toEqual(result);
  });

  it("returns null on version mismatch (v1 cache)", async () => {
    getItem.mockResolvedValue(JSON.stringify({ ...result, version: 1 }));
    await expect(readAiGuideCache("u1")).resolves.toBeNull();
  });

  it("returns null on missing or unparsable data", async () => {
    getItem.mockResolvedValue(null);
    await expect(readAiGuideCache("u1")).resolves.toBeNull();
    getItem.mockResolvedValue("{not json");
    await expect(readAiGuideCache("u1")).resolves.toBeNull();
  });

  it("swallows write errors", async () => {
    setItem.mockRejectedValue(new Error("disk full"));
    await expect(writeAiGuideCache("u1", result)).resolves.toBeUndefined();
  });
});
