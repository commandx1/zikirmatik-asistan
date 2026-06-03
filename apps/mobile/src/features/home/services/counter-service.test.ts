import { describe, expect, it } from "vitest";
import { incrementCounter } from "./counter-service";

describe("counter-service", () => {
  it("increments until target", () => {
    const session = { count: 99, target: 100 };
    expect(incrementCounter(session)).toEqual({ count: 100, target: 100 });
    expect(incrementCounter({ count: 100, target: 100 })).toEqual({ count: 100, target: 100 });
  });

  it("increments without an upper bound when target is zero", () => {
    expect(incrementCounter({ count: 100, target: 0 })).toEqual({ count: 101, target: 0 });
  });
});
