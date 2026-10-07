import { describe, expect, it } from "vitest";
import { createInFlightGuard } from "./in-flight-guard";

describe("createInFlightGuard (B-23 double submit)", () => {
  it("second acquire fails until released", () => {
    const g = createInFlightGuard();
    expect(g.acquire()).toBe(true);
    expect(g.acquire()).toBe(false);
    g.release();
    expect(g.acquire()).toBe(true);
  });
});
