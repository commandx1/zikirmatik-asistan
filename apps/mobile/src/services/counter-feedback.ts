import { fireLapHaptic, fireTapHaptic, type HapticsPattern } from "./haptics";
import { playClickSound } from "./click-sound";
import type { CounterSoundPack } from "../store/counter-style-store";
import { didCompleteLap } from "../features/home/services/lap-counter";

/**
 * Common tap/lap feedback for a dhikr counter increment — shared by the home
 * counter, the vird session screen (lapSize = item target) and a circle
 * session (lapSize = the fixed circle LAP_SIZE). Fires the per-tap haptic +
 * click sound, then the lap haptic when `next` crosses a `lapSize` boundary
 * relative to `prev` (see `didCompleteLap`). No-op if `next === prev`.
 * Returns whether the lap haptic fired, so the caller can run its own
 * lap-completion side effects (notices, flush, etc.).
 */
export function fireCounterFeedback({
  prev,
  next,
  lapSize,
  pattern,
  soundPack
}: {
  prev: number;
  next: number;
  lapSize: number;
  pattern: HapticsPattern;
  soundPack: CounterSoundPack;
}): boolean {
  if (next === prev) {
    return false;
  }

  fireTapHaptic(pattern);
  playClickSound(soundPack);

  const lapCompleted = didCompleteLap(prev, next, lapSize);
  if (lapCompleted) {
    fireLapHaptic(pattern);
  }

  return lapCompleted;
}
