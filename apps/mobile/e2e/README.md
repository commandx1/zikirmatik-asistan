# Detox iOS e2e

Tek seferlik: `brew tap wix/brew && brew install applesimutils`

1. Test DB (kökten): `pnpm db:test` (Docker Mongo, 127.0.0.1:27018)
2. API (apps/api; prod `.env` URI'sini süreç env'i ezer — MONGODB_URI'yi mutlaka ver):
   ```sh
   pnpm build && NODE_ENV=development PORT=3000 \
     MONGODB_URI='mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true' \
     AUTH_ALLOW_INSECURE_TEST_TOKENS=1 AUTH_ACCESS_TOKEN_SECRET=e2e-access AUTH_REFRESH_TOKEN_SECRET=e2e-refresh \
     AI_RUNTIME_MOCK=1 OPENAI_API_KEY=test-key SERVER_PUSH_ENABLED=0 APP_MIN_VERSION=0 \
     LOG_DRAIN_URL= LOG_DRAIN_TOKEN= SLACK_ALERT_WEBHOOK_URL= node dist/main
   ```
3. Build (apps/mobile): `pnpm test:detox:build:ios` — e2e `EXPO_PUBLIC_*` env'i (mock auth, 127.0.0.1:3000, boş RevenueCat anahtarı) `.detoxrc.js` build komutuna gömülü; bundle'a build anında girer.
4. Detox framework cache (pnpm postinstall atlarsa): `npx detox build-framework-cache`
5. Test: `pnpm test:detox:ios` (global-setup DB'yi sıfırlar + dhikr/vird şablonlarını seed eder; `E2E_MONGODB_URI` ile değiştirilebilir)

Akışlar ad sırasıyla koşar (`e2e/sequencer.js`): 01 giriş/onboarding, 02 sayaç+log+seri (API'den de doğrular), 03 vird rehberli seans, 04 halka+premium+AI Rehber/sohbet. Hepsi `freshSignIn()` ile temiz kurulumdan başlar; 04 test içinden `e2e-seed.mjs --premium` çağırır.

Premium kullanıcı (elle): apps/api'de `MONGODB_URI=... pnpm seed:e2e --premium e2e-user` (önce giriş yapılmış olmalı).

## Android (emülatör)

AVD: `QA_Phone` (API 34, arm64). Detox açık değilse kendisi başlatır (`-read-only`). DB + API adımları iOS ile aynı; uygulama API'ye `http://10.0.2.2:3000` ile gider.

1. Build (apps/mobile): `pnpm test:detox:build:android` — ilk ~10 dk, sonra ~1 dk. Komut `.detoxrc.js` içinde:
   - `-PdetoxE2E` → release manifest'te `usesCleartextTraffic=true` (yalnız bu build; normal release `false`).
   - Debug keystore enjekte edilir (`keystore.properties` gerekmez), R8 kapalı, tek ABI (arm64-v8a).
   - `EXPO_PUBLIC_*` Gradle girdisi olmadığından JS bundle çıktısı her build'de silinir.
2. Test: `pnpm test:detox:android`

Android'e özgü:
- RN `Modal` ayrı pencere; Espresso yalnız odaklı pencerede arar → ana sayfa beklemesi `waitForHome()` ile (sekme | tur | hoş geldin).
- `toExist` çoklu eşleşmede hata verir → `exists()` `atIndex(0)` kullanır.
- Emülatör dili EN olabilir; metin kontrolleri dilden bağımsız (RegExp).
- Soğuk açılışta "System UI isn't responding" diyaloğu odağı çalarsa (tüm testler "window focus" hatası): `adb root && adb shell pkill -f com.android.systemui`, sonra tekrar koş.
