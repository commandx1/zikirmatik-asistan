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
    'android.emu.release': { device: 'emulator', app: 'android.release' },
  },
};
