import { useEffect, useMemo, useState } from "react";
import type { StatsBadge } from "@zikirmatik/shared";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useAuthStore } from "../../../store/auth-store";
import { useBadgeCelebrationStore } from "../../../store/badge-celebration-store";
import { computeLocalBadges, deriveLocalActivityStats } from "../services/local-badges";
import { evaluateBadgeCelebration } from "../services/badge-celebration";

// Root-mounted (see app/_layout.tsx), mirroring useStreakReminderSync:
// reacting to dhikr-store gives badge celebration for free wherever the user
// is in the app, for both guest and authenticated sessions (dhikr-store is
// the single local source of truth either way).
export function useBadgeCelebration() {
  const items = useDhikrStore((state) => state.items);
  const freeModeCount = useDhikrStore((state) => state.freeModeCount);
  const isDhikrHydratedFromBackend = useDhikrStore((state) => state.isHydratedFromBackend);
  const authStatus = useAuthStore((state) => state.status);
  const hasHydrated = useBadgeCelebrationStore((state) => state.hasHydrated);
  const hasSeeded = useBadgeCelebrationStore((state) => state.hasSeeded);
  const celebratedBadgeKeys = useBadgeCelebrationStore((state) => state.celebratedBadgeKeys);
  const markCelebrated = useBadgeCelebrationStore((state) => state.markCelebrated);
  const markSeeded = useBadgeCelebrationStore((state) => state.markSeeded);

  const [queue, setQueue] = useState<StatsBadge[]>([]);

  const badges = useMemo(() => {
    const stats = deriveLocalActivityStats(items, freeModeCount);
    return computeLocalBadges(stats);
  }, [items, freeModeCount]);

  // For authenticated sessions, dhikr counts get re-hydrated from the
  // backend after mount (see dhikr-store's isHydratedFromBackend); until
  // that lands, `badges` can understate what the user has actually earned.
  // Guests have no backend fetch to wait for, so their local data is ready
  // as soon as the stores themselves are.
  const isDhikrDataSettled =
    authStatus === "authenticated" ? isDhikrHydratedFromBackend : authStatus !== "authenticating";

  useEffect(() => {
    const evaluation = evaluateBadgeCelebration({
      badges,
      celebratedBadgeKeys,
      hasHydrated,
      hasSeeded,
      isDhikrDataSettled
    });

    if (evaluation.action === "wait") {
      // Celebration store still rehydrating, or (for authenticated
      // sessions) dhikr counts haven't come back from the backend yet —
      // evaluating now would risk reading stale/empty data as "not
      // achieved" and re-queuing a popup once the real data lands.
      return;
    }

    if (evaluation.action === "seed") {
      // One-time silent seed for a fresh celebration store: this happens
      // both for brand-new installs and after the user clears app data,
      // where dhikr counts are re-hydrated from the backend while
      // celebratedBadgeKeys was wiped locally. Without this, already-earned
      // badges would be misread as newly achieved and pop the modal
      // unprompted. A genuine new user has no achieved badges yet at this
      // point, so their real first celebration still fires normally once
      // they reach a threshold in-session.
      for (const key of evaluation.keysToMarkCelebrated) {
        markCelebrated(key);
      }
      markSeeded();
      return;
    }

    if (evaluation.badges.length === 0) {
      return;
    }

    // Mark celebrated immediately so re-renders (or an app restart before the
    // modal is dismissed) never re-queue the same badge.
    for (const badge of evaluation.badges) {
      markCelebrated(badge.key);
    }
    setQueue((prev) => [...prev, ...evaluation.badges]);
  }, [badges, hasHydrated, hasSeeded, isDhikrDataSettled, celebratedBadgeKeys, markCelebrated, markSeeded]);

  const current = queue[0] ?? null;

  const dismiss = () => {
    setQueue((prev) => prev.slice(1));
  };

  return { current, dismiss };
}
