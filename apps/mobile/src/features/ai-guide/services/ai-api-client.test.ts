import { beforeEach, describe, expect, it, vi } from "vitest";

const requestMock = vi.hoisted(() => vi.fn());
vi.mock("../../../lib/http/client", () => ({
  ApiError: class ApiError extends Error {},
  request: requestMock
}));

const { createAiRecommendation, createAiVirdProgram, getAiCredits } = await import("./ai-api-client");

beforeEach(() => {
  requestMock.mockReset();
  requestMock.mockResolvedValue({});
});

describe("ai-api-client timeouts", () => {
  it("createAiRecommendation passes a 120s timeout", async () => {
    await createAiRecommendation({ userId: "u", flowId: "f" });
    expect(requestMock).toHaveBeenCalledWith(
      "/v1/ai/recommendations",
      expect.objectContaining({ method: "POST", timeoutMs: 120_000 })
    );
  });

  it("other AI calls built on options() share the same timeout", async () => {
    await createAiVirdProgram({ flowId: "f", durationDays: 7, slots: [] });
    await getAiCredits();
    for (const call of requestMock.mock.calls) {
      expect(call[1]).toMatchObject({ timeoutMs: 120_000 });
    }
  });
});
