// B-18: a cold-start notification tap can resolve before the root navigator
// exists; router.push then throws (swallowed) and the tap is lost. The route
// is held until the navigator is ready, then flushed exactly once.
export function createDeferredRoute(push: (route: string) => void) {
  let ready = false;
  let pending: string | null = null;

  return {
    go(route: string) {
      if (ready) {
        push(route);
      } else {
        pending = route;
      }
    },
    setReady(value: boolean) {
      ready = value;
      if (ready && pending) {
        const route = pending;
        pending = null;
        push(route);
      }
    }
  };
}
