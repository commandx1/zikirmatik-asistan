/**
 * Pure geometry/counting helpers for the tesbih (prayer bead strand) visual.
 * Kept free of Skia/Reanimated imports on purpose so they're unit-testable —
 * the Skia canvas itself (tesbih-strand.tsx) is not (native-only).
 */

/** The strand always renders 33 physical beads, regardless of lap size. */
export const PHYSICAL_BEAD_COUNT = 33;

export type BeadLayout = {
  cx: number;
  cy: number;
  ringRadius: number;
  beadRadius: number;
};

/** Derives the ring/bead geometry from the overall (square) canvas size. */
export function computeBeadLayout(size: number): BeadLayout {
  const cx = size / 2;
  const cy = size / 2;

  return {
    cx,
    cy,
    ringRadius: size * 0.38,
    beadRadius: size * 0.052
  };
}

/**
 * Center of bead `index` (0-based), evenly spaced around the ring starting
 * at the top (12 o'clock) and proceeding clockwise.
 */
export function computeBeadCenter(
  index: number,
  beadCount: number,
  layout: Pick<BeadLayout, "cx" | "cy" | "ringRadius">
): { x: number; y: number } {
  const angle = -Math.PI / 2 + (index / beadCount) * Math.PI * 2;

  return {
    x: layout.cx + Math.cos(angle) * layout.ringRadius,
    y: layout.cy + Math.sin(angle) * layout.ringRadius
  };
}

/**
 * How many of the 33 physical beads should read as "filled" for a given
 * running `count`. Wraps every 33 taps — but an exact multiple (a
 * just-completed physical ring) reads as a full 33 rather than snapping
 * back to empty; the ring only resets to empty on the *next* tap.
 */
export function resolveBeadFill(count: number, physicalBeadCount: number = PHYSICAL_BEAD_COUNT): number {
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) {
    return 0;
  }

  const remainder = safeCount % physicalBeadCount;
  return remainder === 0 ? physicalBeadCount : remainder;
}

export type SubLapLabel = { index: number; total: number };

/**
 * For a lap size larger than the physical strand (e.g. 99 = 3 × 33), reports
 * which pass around the physical ring the count is currently on within the
 * current lap (1-based) — e.g. `{ index: 2, total: 3 }` renders as "2/3".
 * Returns null when the lap fits inside a single physical ring (nothing to
 * show — this is the 33-lap case).
 */
export function resolveSubLapLabel(
  count: number,
  lapSize: number,
  physicalBeadCount: number = PHYSICAL_BEAD_COUNT
): SubLapLabel | null {
  if (!Number.isFinite(lapSize) || lapSize <= physicalBeadCount) {
    return null;
  }

  const total = Math.ceil(lapSize / physicalBeadCount);
  const safeCount = Math.max(0, Math.floor(count));
  if (safeCount === 0) {
    return { index: 1, total };
  }

  const positionInLap = ((safeCount - 1) % lapSize) + 1;
  const index = Math.min(total, Math.ceil(positionInLap / physicalBeadCount));
  return { index, total };
}
