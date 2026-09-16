# Login ekranı: kalan manuel işler (2026-09-16)

Login ekranı yeniden tasarlandı; kod tarafı hazır. Aşağıdaki adımlar Google Cloud / Apple hesabı gerektirdiği için manuel yapılmalı. Bunlar yapılmadan iOS'ta Google butonu "Google iOS client id bulunamadı" hatası verir; Apple girişi ve Android Google girişi etkilenmez.

## 1. Google Cloud Console'da iOS OAuth client oluştur

1. https://console.cloud.google.com/apis/credentials → aynı projede (Android/Web client'ların olduğu proje).
2. **Create Credentials → OAuth client ID → iOS**.
3. Bundle ID: `com.zikirmatik_asistan.app` (app.json `ios.bundleIdentifier`).
4. Oluşan client ID'yi not al. Biçimi: `123456789-abc...xyz.apps.googleusercontent.com`.

Backend tarafında ek iş yok: mobil `webClientId` ile id_token istediği için token'ın `aud` değeri web client ID kalır; `apps/api/.env` içindeki `GOOGLE_CLIENT_IDS` zaten onu içeriyor.

## 2. Mobil `.env`'e ekle

`apps/mobile/.env`:

```
EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID=<1. adımdaki iOS client ID>
```

## 3. `app.json` plugin ayarı + prebuild

`@react-native-google-signin/google-signin` plugin'i `iosUrlScheme` verilmezse iOS URL şemasını eklemiyor (Firebase plist modunu bekliyor). `apps/mobile/app.json` içinde plugin satırını şu hale getir:

```json
[
  "@react-native-google-signin/google-signin",
  { "iosUrlScheme": "com.googleusercontent.apps.<CLIENT_ID_ÖNEKİ>" }
]
```

`<CLIENT_ID_ÖNEKİ>` = iOS client ID'nin `.apps.googleusercontent.com` öncesi kısmı (ters çevrilmiş client ID). Google Console'da "iOS URL scheme" olarak da gösterilir.

Sonra:

```
cd apps/mobile
npx expo prebuild --platform ios
cd ios && pod install
```

Kontrol: `ios/ZikirmatikRehber/Info.plist` içinde `CFBundleURLSchemes` altında `com.googleusercontent.apps.…` görünmeli.

## 4. Cihazda doğrula

- iOS build: `npx expo run:ios --device`
- Login ekranında Google'a bas → Google hesap seçici açılmalı → uygulamaya dönünce oturum açılmalı.
- Profil → Çıkış → tekrar Google ile giriş (revoke/signOut yolu).
- Not: `__DEV__` build'de Google butonu gerçek Google akışını çalıştırmaz, sahte dev token kullanır (`mock-provider-auth.ts` → `buildDevGoogleIdentityToken`). Gerçek akış için release/TestFlight build gerekir.

## 5. iOS App Icon placeholder

`apps/mobile/ios/ZikirmatikRehber/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png` hâlâ boş beyaz kare. Store'a çıkmadan önce `store-assets/applogo.webp` kaynağından 1024×1024 PNG üretilip buraya konmalı (ya da `app.json` `ios.icon` alanı tanımlanıp prebuild ile üretilmeli).

## Bu turda kodda değişenler (referans)

- `apps/mobile/src/features/auth/screen.tsx` — yeni login ekranı
- `apps/mobile/src/assets/app-logo.png` — şeffaf arka planlı logo (rozet çıkarıldı)
- `apps/mobile/src/store/auth-store.ts` — `signInWithProvider(provider)`
- `apps/mobile/src/features/auth/services/mock-provider-auth.ts` — Google iOS desteği
- `apps/mobile/src/i18n/locales/{tr,en}/auth.json`
- `apps/api/src/modules/auth/auth.service.ts` (+ spec) — iOS'ta Apple veya Google kabul
