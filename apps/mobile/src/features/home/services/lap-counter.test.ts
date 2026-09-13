import { describe, expect, it } from "vitest";
import {
  computeCurrentLap,
  computeLapProgress,
  didCompleteLap,
  lapNumberCompletedAt,
  resolveLapSize
} from "./lap-counter";

describe("resolveLapSize", () => {
  it("defaults to 33 when missing, invalid, zero, or negative", () => {
    expect(resolveLapSize(undefined)).toBe(33);
    expect(resolveLapSize(null)).toBe(33);
    expect(resolveLapSize(Number.NaN)).toBe(33);
    expect(resolveLapSize(0)).toBe(33);
    expect(resolveLapSize(-5)).toBe(33);
  });

  it("floors a valid positive lap size", () => {
    expect(resolveLapSize(99)).toBe(99);
    expect(resolveLapSize(100.7)).toBe(100);
    expect(resolveLapSize(1)).toBe(1);
  });
});

describe("computeCurrentLap / computeLapProgress", () => {
  it("computes lap index and progress for the default 33 lap size", () => {
    expect(computeCurrentLap(0, 33)).toBe(0);
    expect(computeLapProgress(0, 33)).toBe(0);

    expect(computeCurrentLap(32, 33)).toBe(0);
    expect(computeLapProgress(32, 33)).toBe(32);

    expect(computeCurrentLap(33, 33)).toBe(1);
    expect(computeLapProgress(33, 33)).toBe(0);

    expect(computeCurrentLap(40, 33)).toBe(1);
    expect(computeLapProgress(40, 33)).toBe(7);
  });

  it("works with a custom lap size (99)", () => {
    expect(computeCurrentLap(98, 99)).toBe(0);
    expect(computeCurrentLap(99, 99)).toBe(1);
    expect(computeCurrentLap(198, 99)).toBe(2);
    expect(computeLapProgress(150, 99)).toBe(51);
  });

  it("falls back to the default lap size when given an invalid one", () => {
    expect(computeCurrentLap(33, undefined)).toBe(1);
    expect(computeLapProgress(33, 0)).toBe(0);
  });

  it("never goes negative for a negative count", () => {
    expect(computeCurrentLap(-10, 33)).toBe(0);
    expect(computeLapProgress(-10, 33)).toBe(0);
  });
});

describe("didCompleteLap", () => {
  it("is true when crossing a lap boundary going up", () => {
    expect(didCompleteLap(32, 33, 33)).toBe(true);
    expect(didCompleteLap(98, 99, 99)).toBe(true);
  });

  it("is false mid-lap", () => {
    expect(didCompleteLap(30, 31, 33)).toBe(false);
  });

  it("is false when the count did not change (capped at target)", () => {
    expect(didCompleteLap(33, 33, 33)).toBe(false);
  });

  it("is false on reset/decrement even if the new count is a multiple", () => {
    expect(didCompleteLap(40, 33, 33)).toBe(false);
    expect(didCompleteLap(33, 0, 33)).toBe(false);
  });

  it("is false at zero", () => {
    expect(didCompleteLap(0, 0, 33)).toBe(false);
  });

  it("supports a custom lap size", () => {
    expect(didCompleteLap(1, 100, 100)).toBe(true);
    expect(didCompleteLap(1, 50, 100)).toBe(false);
  });
});

describe("lapNumberCompletedAt", () => {
  it("reports which lap was just completed", () => {
    expect(lapNumberCompletedAt(33, 33)).toBe(1);
    expect(lapNumberCompletedAt(66, 33)).toBe(2);
    expect(lapNumberCompletedAt(99, 99)).toBe(1);
  });
});
