import type { CounterSession } from "../types";

export function incrementCounter(session: CounterSession): CounterSession {
  return {
    ...session,
    count: session.target > 0 ? Math.min(session.target, session.count + 1) : session.count + 1
  };
}
