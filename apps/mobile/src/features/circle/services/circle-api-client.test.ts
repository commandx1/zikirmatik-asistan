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

const { resolveCircleErrorMessage, CIRCLE_ERROR_CODE } = await import("./circle-api-client");

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
