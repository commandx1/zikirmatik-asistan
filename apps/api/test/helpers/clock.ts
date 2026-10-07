/**
 * Yalnız `Date`'i dondurur (Mongo sürücüsünün zamanlayıcıları gerçek kalır) ve
 * `fn` bitince gerçek zamana döner.
 */
export async function atInstant<T>(when: Date, fn: () => Promise<T>) {
  jest.useFakeTimers({
    now: when,
    doNotFake: [
      'hrtime',
      'nextTick',
      'performance',
      'queueMicrotask',
      'requestAnimationFrame',
      'cancelAnimationFrame',
      'requestIdleCallback',
      'cancelIdleCallback',
      'setImmediate',
      'clearImmediate',
      'setInterval',
      'clearInterval',
      'setTimeout',
      'clearTimeout',
    ],
  });
  try {
    return await fn();
  } finally {
    jest.useRealTimers();
  }
}
