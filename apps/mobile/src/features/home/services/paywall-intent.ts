// MOB-PRM-13: widget derin bağlantısı (?paywall=1) soğuk açılışta isPremium
// tazelenmeden karar verirse premium kullanıcıya da paywall açıyordu.
export type PaywallDecision = "wait" | "show" | "drop";

/** Premium durumu TAZE (sunucu senkronu) olana kadar bekler; premiumsa asla göstermez. */
export function decidePaywallIntent(state: {
  authStatus: "signed_out" | "authenticating" | "authenticated";
  guestMode: boolean;
  premiumFresh: boolean;
  isPremium: boolean;
}): PaywallDecision {
  if (state.authStatus === "authenticated") {
    if (!state.premiumFresh) return "wait";
    return state.isPremium ? "drop" : "show";
  }
  // Misafir premium olamaz; oturum geri yükleniyor/giriş sürüyorsa bekle.
  return state.authStatus === "signed_out" && state.guestMode ? "show" : "wait";
}
