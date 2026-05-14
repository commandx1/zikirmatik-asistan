import type { CounterSession } from "../types";

export function incrementCounter(session: CounterSession): CounterSession {
  return {
    ...session,
    count: Math.min(session.target, session.count + 1)
  };
}
