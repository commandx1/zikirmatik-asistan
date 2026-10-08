import { describe, expect, it } from "vitest";
import { aiLimitMessageKey } from "./ai-error-codes";

describe("aiLimitMessageKey", () => {
  it("maps the two server 429 limit codes to their common:aiLimits keys", () => {
    expect(aiLimitMessageKey("AI_REQUEST_IN_FLIGHT")).toBe("common:aiLimits.inFlight");
    expect(aiLimitMessageKey("AI_DAILY_FREE_LIMIT")).toBe("common:aiLimits.dailyFreeLimit");
  });

  it("ignores every other code (credit, 503, unknown, missing)", () => {
    for (const code of ["AI_CREDIT_INSUFFICIENT", "AI_UNAVAILABLE", "DAILY_LIMIT_REACHED", "X", undefined]) {
      expect(aiLimitMessageKey(code)).toBeUndefined();
    }
  });
});
