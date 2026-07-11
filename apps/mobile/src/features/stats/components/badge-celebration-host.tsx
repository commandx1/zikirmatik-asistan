import { useBadgeCelebration } from "../hooks/use-badge-celebration";
import { BadgeCelebrationModal } from "./badge-celebration-modal";

// Root-mounted (see app/_layout.tsx) — self-contained so _layout.tsx doesn't
// need to know about the badge-celebration queue/dismiss wiring.
export function BadgeCelebrationHost() {
  const { current, dismiss } = useBadgeCelebration();
  return <BadgeCelebrationModal badge={current} onDismiss={dismiss} />;
}
