import { useState } from "react";
import type { CounterSession } from "../types";
import { incrementCounter } from "../services/counter-service";

export function useCounterSession(initial: CounterSession = { count: 0, target: 100 }) {
  const [session, setSession] = useState<CounterSession>(initial);

  return {
    ...session,
    increase: () => setSession((prev) => incrementCounter(prev)),
    reset: () => setSession((prev) => ({ ...prev, count: 0 })),
    setCount: (count: number) =>
      setSession((prev) => ({
        ...prev,
        count: Math.max(0, Math.min(prev.target, count))
      })),
    setTarget: (target: number) =>
      setSession((prev) => {
        const safeTarget = Math.max(1, Math.floor(target));
        return {
          ...prev,
          target: safeTarget,
          count: Math.min(prev.count, safeTarget)
        };
      })
  };
}
