import { describe, expect, it } from "vitest";
import { formatInteger, formatPercent } from "./locale-format";

describe("locale-format numbers", () => {
  it("groups thousands per locale", () => {
    expect(formatInteger(7328, "en")).toBe("7,328");
    expect(formatInteger(7328, "tr")).toBe("7.328");
  });

  it("puts the percent sign per locale", () => {
    expect(formatPercent(94, "en")).toBe("94%");
    expect(formatPercent(94, "tr")).toBe("%94");
  });
});
