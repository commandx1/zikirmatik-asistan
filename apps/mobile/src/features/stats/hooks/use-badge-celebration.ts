import { useEffect, useMemo, useState } from "react";
import type { StatsBadge } from "@zikirmatik/shared";
import { useDhikrStore } from "../../../store/dhikr-store";
import { useBadgeCelebrationStore } from "../../../store/badge-celebration-store";
import { computeLocalBadges, deriveLocalActivityStats } from "../services/local-badges";
import { selectNewlyAchievedBadges } from "../services/badge-celebration";

// Root-mounted (see app/_layout.tsx), mirroring useStreakReminderSync:
// reacting to dhikr-store gives badge celebration for free wherever the user
// is in the app, for both guest and authenticated sessions (dhikr-store is
// the single local source of truth either way).
export function useBadgeCelebration() {
  const items = useDhikrStore((state) => state.items);
  const freeModeCount = useDhikrStore((state) => state.freeModeCount);
  const celebratedBadgeKeys = useBadgeCelebrationStore((state) => state.celebratedBadgeKeys);
  const markCelebrated = useBadgeCelebrationStore((state) => state.markCelebrated);

  const [queue, setQueue] = useState<StatsBadge[]>([]);

  const badges = useMemo(() => {
    const stats = deriveLocalActivityStats(items, freeModeCount);
    return computeLocalBadges(stats);
  }, [items, freeModeCount]);

  useEffect(() => {
    const newlyAchieved = selectNewlyAchievedBadges(badges, celebratedBadgeKeys);
    if (newlyAchieved.length === 0) {
      return;
    }

    // Mark celebrated immediately so re-renders (or an app restart before the
    // modal is dismissed) never re-queue the same badge.
    for (const badge of newlyAchieved) {
      markCelebrated(badge.key);
    }
    setQueue((prev) => [...prev, ...newlyAchieved]);
  }, [badges, celebratedBadgeKeys, markCelebrated]);

  const current = queue[0] ?? null;

  const dismiss = () => {
    setQueue((prev) => prev.slice(1));
  };

  return { current, dismiss };
}
