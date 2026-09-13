import { describe, expect, it } from "vitest";
import { computeBeadCenter, computeBeadLayout, resolveBeadFill, resolveSubLapLabel } from "./tesbih-strand.math";

describe("tesbih-strand.math", () => {
  describe("computeBeadLayout", () => {
    it("centers the ring in a square canvas and scales radii with size", () => {
      const layout = computeBeadLayout(200);

      expect(layout.cx).toBe(100);
      expect(layout.cy).toBe(100);
      expect(layout.ringRadius).toBeCloseTo(76);
      expect(layout.beadRadius).toBeCloseTo(10.4);
    });
  });

  describe("computeBeadCenter", () => {
    const layout = { cx: 100, cy: 100, ringRadius: 50 };

    it("places bead 0 at the top", () => {
      const { x, y } = computeBeadCenter(0, 4, layout);

      expect(x).toBeCloseTo(100);
      expect(y).toBeCloseTo(50);
    });

    it("proceeds clockwise around the ring", () => {
      const right = computeBeadCenter(1, 4, layout);
      expect(right.x).toBeCloseTo(150);
      expect(right.y).toBeCloseTo(100);

      const bottom = computeBeadCenter(2, 4, layout);
      expect(bottom.x).toBeCloseTo(100);
      expect(bottom.y).toBeCloseTo(150);

      const left = computeBeadCenter(3, 4, layout);
      expect(left.x).toBeCloseTo(50);
      expect(left.y).toBeCloseTo(100);
    });
  });

  describe("resolveBeadFill", () => {
    it("tracks the running count up to a full physical ring", () => {
      expect(resolveBeadFill(0)).toBe(0);
      expect(resolveBeadFill(1)).toBe(1);
      expect(resolveBeadFill(32)).toBe(32);
    });

    it("reads as a full ring exactly on a multiple of 33, not empty", () => {
      expect(resolveBeadFill(33)).toBe(33);
      expect(resolveBeadFill(66)).toBe(33);
      expect(resolveBeadFill(99)).toBe(33);
    });

    it("wraps to 1 on the tap right after a full ring", () => {
      expect(resolveBeadFill(34)).toBe(1);
      expect(resolveBeadFill(67)).toBe(1);
    });

    it("never goes negative for an invalid count", () => {
      expect(resolveBeadFill(-5)).toBe(0);
    });
  });

  describe("resolveSubLapLabel", () => {
    it("returns null when the lap fits in a single physical ring", () => {
      expect(resolveSubLapLabel(10, 33)).toBeNull();
      expect(resolveSubLapLabel(33, 33)).toBeNull();
    });

    it("reports which pass around the ring the count is on for a 99 lap", () => {
      expect(resolveSubLapLabel(1, 99)).toEqual({ index: 1, total: 3 });
      expect(resolveSubLapLabel(33, 99)).toEqual({ index: 1, total: 3 });
      expect(resolveSubLapLabel(34, 99)).toEqual({ index: 2, total: 3 });
      expect(resolveSubLapLabel(66, 99)).toEqual({ index: 2, total: 3 });
      expect(resolveSubLapLabel(67, 99)).toEqual({ index: 3, total: 3 });
      expect(resolveSubLapLabel(99, 99)).toEqual({ index: 3, total: 3 });
    });

    it("wraps back to the first ring at the start of the next lap", () => {
      expect(resolveSubLapLabel(100, 99)).toEqual({ index: 1, total: 3 });
    });

    it("shows the first ring before any taps", () => {
      expect(resolveSubLapLabel(0, 99)).toEqual({ index: 1, total: 3 });
    });
  });
});
