import { useCallback, useLayoutEffect, useRef } from 'react'

/**
 * Stable-identity handler that still runs the latest committed render's
 * closure (the "useEvent" pattern). Lets a memoized context value keep its
 * identity while its handlers read per-tap state. Never call it during render.
 */
export function useStableCallback<A extends unknown[], R>(fn: (...args: A) => R): (...args: A) => R {
  const ref = useRef(fn)
  useLayoutEffect(() => {
    ref.current = fn
  })
  return useCallback((...args: A) => ref.current(...args), [])
}
