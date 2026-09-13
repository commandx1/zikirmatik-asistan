import * as Haptics from "expo-haptics";
import { resolveHapticsPattern, type HapticsPattern } from "./haptics-pattern";

// Re-exported for convenience so call sites that already need the native
// module (e.g. home-context.tsx) can import everything from one place.
// Consumers that must stay dependency-free (stores, network types) should
// import from "./haptics-pattern" directly instead — see that file for why.
export type { HapticsPattern };
export { resolveHapticsPattern };

// Gap between the two pulses of the "tesbih" tap pattern. Short enough to
// read as one tactile "click", long enough for the OS to trigger two
// distinct impacts instead of coalescing them into one.
const TESBIH_SECOND_PULSE_DELAY_MS = 40;

function safeImpact(style: Haptics.ImpactFeedbackStyle): void {
  try {
    void Haptics.impactAsync(style).catch(() => {
      // Native haptics can reject on unsupported devices/simulators; the
      // counter must keep working regardless.
    });
  } catch {
    // Never let a haptics failure interrupt counting.
  }
}

function safeNotification(type: Haptics.NotificationFeedbackType): void {
  try {
    void Haptics.notificationAsync(type).catch(() => {
      // Same rationale as safeImpact — swallow rejections silently.
    });
  } catch {
    // Never let a haptics failure interrupt counting.
  }
}

/** Fires the per-tap haptic for the given pattern. Never throws. */
export function fireTapHaptic(pattern: HapticsPattern): void {
  if (pattern === "off") {
    return;
  }

  if (pattern === "hafif") {
    safeImpact(Haptics.ImpactFeedbackStyle.Light);
    return;
  }

  if (pattern === "tesbih") {
    safeImpact(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(() => {
      safeImpact(Haptics.ImpactFeedbackStyle.Light);
    }, TESBIH_SECOND_PULSE_DELAY_MS);
    return;
  }

  // "orta" (default).
  safeImpact(Haptics.ImpactFeedbackStyle.Medium);
}

/** Fires the "lap completed" haptic for the given pattern. Never throws. */
export function fireLapHaptic(pattern: HapticsPattern): void {
  if (pattern === "off") {
    return;
  }

  safeNotification(Haptics.NotificationFeedbackType.Success);
}
