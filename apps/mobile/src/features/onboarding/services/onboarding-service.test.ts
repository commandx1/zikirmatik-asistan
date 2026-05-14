import { describe, expect, it } from "vitest";
import { nextStep, previousStep } from "./onboarding-service";

describe("onboarding-service", () => {
  it("keeps step in range 1..4", () => {
    expect(nextStep(4)).toBe(4);
    expect(previousStep(1)).toBe(1);
  });

  it("moves one step between bounds", () => {
    expect(nextStep(2)).toBe(3);
    expect(previousStep(4)).toBe(3);
  });
});
