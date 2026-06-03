import { describe, expect, it } from "vitest";
import { resolveVisibleAiGuideHistory } from "./ai-guide-history-service";
import type { AiGuideHistoryItem } from "../types";

const history: AiGuideHistoryItem[] = [
  { id: "1", prompt: "Sabır", createdAt: "2026-06-03T10:00:00.000Z", recommendations: [] },
  { id: "2", prompt: "Huzur", createdAt: "2026-06-02T10:00:00.000Z", recommendations: [] },
  { id: "3", prompt: "Şükür", createdAt: "2026-06-01T10:00:00.000Z", recommendations: [] }
];

describe("ai-guide-history-service", () => {
  it("shows only the latest two history items by default", () => {
    expect(resolveVisibleAiGuideHistory(history, false).map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("shows every history item when expanded", () => {
    expect(resolveVisibleAiGuideHistory(history, true).map((item) => item.id)).toEqual(["1", "2", "3"]);
  });
});
