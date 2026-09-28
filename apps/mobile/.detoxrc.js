/** @type {Detox.DetoxConfig} */
module.exports = {
  testRunner: {
    args: { $0: 'jest', config: 'e2e/jest.config.js' },
    jest: { setupTimeout: 300000 },
  },
  artifacts: {
    rootDir: 'e2e/artifacts',
    plugins: { screenshot: 'failing', log: 'failing' },
  },
  apps: {
    'ios.release': {
      type: 'ios.app',
      binaryPath: 'ios/build/Build/Products/Release-iphonesimulator/ZikirmatikRehber.app',
      // EXPO_PUBLIC_* değerleri JS bundle'a bu komut sırasında gömülür; süreç env'i
      // .env'i ezer. Boş RevenueCat anahtarı: .env'deki test_ anahtarı Release'te
      // "Wrong API Key" alert'i gösterip uygulamayı kapatır.
      build:
        'EXPO_PUBLIC_E2E_MOCK_AUTH=1 EXPO_PUBLIC_DEV_GOOGLE_SUB=e2e-user EXPO_PUBLIC_DEV_GOOGLE_EMAIL=e2e@example.com ' +
        'EXPO_PUBLIC_DEV_GOOGLE_NAME="E2E Kullanıcı" EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 EXPO_PUBLIC_REVENUECAT_API_KEY_IOS= ' +
        'xcodebuild -workspace ios/ZikirmatikRehber.xcworkspace -scheme ZikirmatikRehber -configuration Release -sdk iphonesimulator -derivedDataPath ios/build -quiet',
    },
    // Promo-video kayıtları için (apps/promo-video/scripts/record.mjs, flows
    // story-vird / story-circle): ios.release'in AYNISI, tek fark mock-Google
    // görünen adı/e-postası — üstbilgide "E2E Kullanıcı" görünmemesi gerekiyor
    // (bkz. apps/promo-video/README-short.md "Sesli sürüm"). Ayrı derivedDataPath
    // ile normal e2e-release binary'sini ezmez, ikisi yan yana kalabilir.
    'ios.record': {
      type: 'ios.app',
      binaryPath: 'ios/build-record/Build/Products/Release-iphonesimulator/ZikirmatikRehber.app',
      build:
        'EXPO_PUBLIC_E2E_MOCK_AUTH=1 EXPO_PUBLIC_DEV_GOOGLE_SUB=e2e-user EXPO_PUBLIC_DEV_GOOGLE_EMAIL=ahmet@example.com ' +
        'EXPO_PUBLIC_DEV_GOOGLE_NAME="Ahmet" EXPO_PUBLIC_API_BASE_URL=http://127.0.0.1:3000 EXPO_PUBLIC_REVENUECAT_API_KEY_IOS= ' +
        'xcodebuild -workspace ios/ZikirmatikRehber.xcworkspace -scheme ZikirmatikRehber -configuration Release -sdk iphonesimulator -derivedDataPath ios/build-record -quiet',
    },
    // AI Rehber promo kaydı: PROD API + gerçek giriş (Apple ile giriş simülatörde
    // çalışır; Google iOS istemcisi henüz yok). Mock auth KAPALI, RevenueCat anahtarı
    // boş (Release'te test_ anahtarı alert veriyor; AI Rehber ücretsiz günlük hakla çalışır).
    'ios.prod': {
      type: 'ios.app',
      binaryPath: 'ios/build-prod/Build/Products/Release-iphonesimulator/ZikirmatikRehber.app',
      build:
        'EXPO_PUBLIC_E2E_MOCK_AUTH= EXPO_PUBLIC_API_BASE_URL=https://zikirmatik-asistan.onrender.com EXPO_PUBLIC_REVENUECAT_API_KEY_IOS= ' +
        'xcodebuild -workspace ios/ZikirmatikRehber.xcworkspace -scheme ZikirmatikRehber -configuration Release -sdk iphonesimulator -derivedDataPath ios/build-prod -quiet',
    },
    'android.release': {
      type: 'android.apk',
      binaryPath: 'android/app/build/outputs/apk/release/app-release.apk',
      testBinaryPath: 'android/app/build/outputs/apk/androidTest/release/app-release-androidTest.apk',
      // keystore.properties yerelde yok → debug keystore enjekte edilir (yalnız bu komut).
      // detoxE2E: release'te cleartext açar (10.0.2.2 API + Detox soketi). R8 kapalı: Detox
      // proguard kuralları gerekmesin; tek ABI: emülatör arm64, build süresi kısalır.
      // EXPO_PUBLIC_* Gradle görev girdisi değil → eski bundle UP-TO-DATE sayılmasın diye silinir.
      build:
        'EXPO_PUBLIC_E2E_MOCK_AUTH=1 EXPO_PUBLIC_DEV_GOOGLE_SUB=e2e-user EXPO_PUBLIC_DEV_GOOGLE_EMAIL=e2e@example.com ' +
        'EXPO_PUBLIC_DEV_GOOGLE_NAME="E2E Kullanıcı" EXPO_PUBLIC_API_BASE_URL=http://10.0.2.2:3000 EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID= ' +
        'bash -c \'cd android && rm -rf app/build/generated/assets/createBundleReleaseJsAndAssets && ./gradlew assembleRelease assembleAndroidTest -DtestBuildType=release -PdetoxE2E ' +
        '-PreactNativeArchitectures=arm64-v8a -Pandroid.enableMinifyInReleaseBuilds=false -Pandroid.enableShrinkResourcesInReleaseBuilds=false ' +
        '-Pandroid.injected.signing.store.file=$PWD/app/debug.keystore -Pandroid.injected.signing.store.password=android ' +
        '-Pandroid.injected.signing.key.alias=androiddebugkey -Pandroid.injected.signing.key.password=android\'',
    },
  },
  devices: {
    simulator: { type: 'ios.simulator', device: { type: 'iPhone 17' } },
    emulator: { type: 'android.emulator', device: { avdName: 'QA_Phone' } },
  },
  configurations: {
    'ios.sim.release': { device: 'simulator', app: 'ios.release' },
    'ios.sim.record': { device: 'simulator', app: 'ios.record' },
    'ios.sim.prod': { device: 'simulator', app: 'ios.prod' },
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
