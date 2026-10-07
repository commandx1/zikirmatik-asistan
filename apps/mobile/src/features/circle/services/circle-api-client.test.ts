import { describe, expect, it, vi } from "vitest";

const { resolveCircleErrorMessage, resolveCircleActionError, CircleApiError, CIRCLE_ERROR_CODE, fetchCircle } = await import("./circle-api-client");

describe("fetchCircle", () => {
  it("appends ?date= to the URL when a date is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCircle("c1", "2026-09-19");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/v1/circles/c1?date=2026-09-19"), expect.anything());
    vi.unstubAllGlobals();
  });

  it("omits the query string when no date is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCircle("c1");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/v1/circles/c1"), expect.anything());
    expect(fetchMock.mock.calls[0]![0]).not.toContain("?date=");
    vi.unstubAllGlobals();
  });
});

describe("resolveCircleErrorMessage", () => {
  it("resolves a known CIRCLE_ERROR_CODE to its translation key", () => {
    expect(resolveCircleErrorMessage(CIRCLE_ERROR_CODE.NOT_FOUND, "fallback")).toBe("circle:errors.notFound");
    expect(resolveCircleErrorMessage(CIRCLE_ERROR_CODE.PREMIUM_REQUIRED, "fallback")).toBe(
      "circle:errors.premiumRequired"
    );
    expect(resolveCircleErrorMessage(CIRCLE_ERROR_CODE.CREATOR_ONLY, "fallback")).toBe(
      "circle:errors.creatorOnly"
    );
  });

  it("returns the fallback for an unknown code", () => {
    expect(resolveCircleErrorMessage("SOME_UNKNOWN_CODE", "fallback")).toBe("fallback");
  });

  it("returns the fallback when no code is given", () => {
    expect(resolveCircleErrorMessage(undefined, "fallback")).toBe("fallback");
  });
});

describe("resolveCircleActionError (B-35/B-36)", () => {
  it("maps a CircleApiError code, falls back for anything else", () => {
    const apiError = new CircleApiError("terminal", "x", 404, CIRCLE_ERROR_CODE.NOT_FOUND);
    expect(resolveCircleActionError(apiError, "fallback")).toBe("circle:errors.notFound");
    expect(resolveCircleActionError(new Error("boom"), "fallback")).toBe("fallback");
    expect(resolveCircleActionError(undefined, "fallback")).toBe("fallback");
  });
});
