// dhikr-store'un kalıcı `lastActivityLabel` metinlerini ve slug küçültmesini
// i18n/profile-store import etmeden üretmesi için köprü (bkz. lib/http/auth-bridge).
// Uygulama gerçek uygulamayı register-dhikr-store-text.ts ile kaydeder
// (app/_layout.tsx). Kayıt yoksa varsayılan, i18n anahtarlarını döner —
// global test mock'unun (`t: key => key`) ürettiğiyle aynı.
export type DhikrStoreText = {
  saved(): string;
  notStarted(): string;
  todayAt(now: Date): string;
  lowercase(value: string): string;
};

let text: DhikrStoreText = {
  saved: () => "focus:relativeDate.saved",
  notStarted: () => "focus:relativeDate.notStarted",
  todayAt: () => "focus:relativeDate.todayAt",
  lowercase: (value) => value.toLowerCase()
};

export function registerDhikrStoreText(next: DhikrStoreText) {
  text = next;
}

export function getDhikrStoreText() {
  return text;
}
