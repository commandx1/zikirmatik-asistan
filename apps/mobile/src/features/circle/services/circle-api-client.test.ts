import { describe, expect, it, vi } from "vitest";

vi.mock("react-native", () => ({
  Platform: {
    OS: "ios",
    select: (options: Record<string, unknown>) => options?.ios ?? options?.default
  }
}));

vi.mock("../../../i18n", () => ({
  i18n: {
    t: (key: string) => key,
    language: "tr"
  }
}));

const { resolveCircleErrorMessage, CIRCLE_ERROR_CODE, fetchCircle } = await import("./circle-api-client");

describe("fetchCircle", () => {
  it("appends ?date= to the URL when a date is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCircle("c1", "token", "2026-09-19");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/v1/circles/c1?date=2026-09-19"), expect.anything());
    vi.unstubAllGlobals();
  });

  it("omits the query string when no date is given", async () => {
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, text: async () => JSON.stringify({ data: {} }) });
    vi.stubGlobal("fetch", fetchMock);

    await fetchCircle("c1", "token");

    expect(fetchMock).toHaveBeenCalledWith(expect.stringContaining("/v1/circles/c1"), expect.anything());
    expect(fetchMock.mock.calls[0][0]).not.toContain("?date=");
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
