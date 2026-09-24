// Lets the HTTP client read the session token and trigger a refresh without
// importing auth-store (auth-store -> auth-api-client -> client would cycle).
// auth-store registers itself at module init; tests can register fakes.
export type AuthBridge = {
  getAccessToken(): string | undefined;
  refresh(): Promise<void>;
};

let bridge: AuthBridge = {
  getAccessToken: () => undefined,
  refresh: async () => {}
};

export function registerAuthBridge(next: AuthBridge) {
  bridge = next;
}

export function getAuthBridge() {
  return bridge;
}
