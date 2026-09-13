/**
 * Pure "tur" (lap) counting helpers shared by the counter's free mode and
 * selected-dhikr mode. Kept independent of any store/UI so both home-context
 * and tests can reason about lap boundaries without mocking React state.
 */

export const DEFAULT_LAP_SIZE = 33;

/** Normalizes a possibly missing/invalid lap size to a positive integer, defaulting to 33. */
export function resolveLapSize(lapSize: number | undefined | null): number {
  if (typeof lapSize !== "number" || !Number.isFinite(lapSize) || lapSize <= 0) {
    return DEFAULT_LAP_SIZE;
  }

  return Math.floor(lapSize);
}

/** How many full laps have been completed at `count` (0-based lap index). */
export function computeCurrentLap(count: number, lapSize: number | undefined | null): number {
  const safeLapSize = resolveLapSize(lapSize);
  const safeCount = Math.max(0, Math.floor(count));
  return Math.floor(safeCount / safeLapSize);
}

/** Progress within the current, not-yet-completed lap (0 at an exact lap boundary). */
export function computeLapProgress(count: number, lapSize: number | undefined | null): number {
  const safeLapSize = resolveLapSize(lapSize);
  const safeCount = Math.max(0, Math.floor(count));
  return safeCount % safeLapSize;
}

/**
 * True exactly when advancing from `prevCount` to `nextCount` crosses a lap
 * boundary — i.e. `nextCount` is a positive multiple of `lapSize` strictly
 * greater than `prevCount`. Returns false for no-op taps (count capped at an
 * already-reached target) and for resets/decrements, so a lap notice never
 * re-fires for the same boundary.
 */
export function didCompleteLap(
  prevCount: number,
  nextCount: number,
  lapSize: number | undefined | null
): boolean {
  if (nextCount <= prevCount || nextCount <= 0) {
    return false;
  }

  const safeLapSize = resolveLapSize(lapSize);
  return nextCount % safeLapSize === 0;
}

/** The (1-based) lap number completed by reaching `nextCount`. */
export function lapNumberCompletedAt(nextCount: number, lapSize: number | undefined | null): number {
  const safeLapSize = resolveLapSize(lapSize);
  return Math.floor(Math.max(0, Math.floor(nextCount)) / safeLapSize);
}
