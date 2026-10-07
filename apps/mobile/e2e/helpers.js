/* global element, by, waitFor, device */
const { execSync, execFileSync } = require('node:child_process');
const path = require('node:path');

// Başka bir adb cihazı (fiziksel telefon) takılıysa komutlar yalnız emülatöre gitsin.
const ADB_SERIAL = process.env.ANDROID_SERIAL || 'emulator-5554';

// testID değerleri src/test-ids.ts ile aynı olmalı.
const IDS = {
  authGoogle: 'e2e-auth-google',
  authGuest: 'e2e-auth-guest',
  tourSkip: 'e2e-tour-skip',
  welcomeLater: 'e2e-home-welcome-later',
  tabMore: 'e2e-tab-more',
  profileSignIn: 'e2e-profile-sign-in',
  profileScroll: 'e2e-profile-scroll',
};

const TAB_IDS = {
  home: 'e2e-tab-home',
  focus: 'e2e-tab-focus',
  aiGuide: 'e2e-tab-ai-guide',
  specialDays: 'e2e-tab-special-days',
};
// "Daha fazla" menüsünden açılan sekmeler.
const MORE_IDS = {
  stats: 'e2e-tab-stats',
  collections: 'e2e-tab-collections',
  profile: 'e2e-tab-profile',
};

// Build'e gömülü mock kimlik (.detoxrc.js) — API tarafı aynı JSON claims'i kabul eder.
const E2E_USER = { sub: 'e2e-user', email: 'e2e@example.com', name: 'E2E Kullanıcı' };
const API_URL = process.env.E2E_API_URL || 'http://127.0.0.1:3000';
const MONGODB_URI =
  process.env.E2E_MONGODB_URI || 'mongodb://127.0.0.1:27018/zikir_e2e_mobile?directConnection=true';

const visible = (id, ms = 20000) => waitFor(element(by.id(id))).toBeVisible().withTimeout(ms);
// Tur Modal'ı ekranı karartır → Detox görünürlük eşiği (%75) altında kalır; varlık yeter.
// atIndex(0): Android (Espresso) çoklu eşleşmede (liste satırları) hata verir.
const exists = (id, ms = 20000) => waitFor(element(by.id(id)).atIndex(0)).toExist().withTimeout(ms);
// testID'siz metin düğümleri için: Detox by.text RegExp destekler (iOS+Android) → dilden bağımsız.
const existsText = (regex, ms = 20000) => waitFor(element(by.text(regex)).atIndex(0)).toExist().withTimeout(ms);

// PageHeader'ın geri okunun testID'si yok; accessibilityLabel'i components:a11y.pageHeaderBack
// (tr: "Geri", en: "Back") — dilden bağımsız regex ile dokun (üst/nested (stack) ekranlarda
// tab bar yoktur, bu yüzden openTab kullanılamaz).
async function tapBack() {
  await element(by.label(/^(Geri|Back)$/)).atIndex(0).tap();
}

// Ana sayfa açıldı mı: sekme ya da üstündeki onboarding Modal'ı. Android'de RN Modal ayrı
// pencere; Espresso yalnız odaklı pencerede arar → Modal açıkken sekme "yok" görünür.
async function waitForHome(ms = 30000) {
  const ids = [TAB_IDS.home, IDS.tourSkip, IDS.welcomeLater];
  const deadline = Date.now() + ms;
  for (;;) {
    for (const id of ids) {
      try {
        await expect(element(by.id(id))).toExist();
        return;
      } catch {
        // sıradaki
      }
    }
    if (Date.now() > deadline) throw new Error(`Ana sayfa ${ms} ms içinde açılmadı`);
    await new Promise((r) => setTimeout(r, 500));
  }
}

// Auth ekranı artık açılışta gösterilmiyor (uygulama misafir olarak başlar);
// giriş akışı profildeki "Giriş yap" satırından tetiklenir.
async function goToAuthScreen() {
  await openTab('profile');
  await scrollTo(IDS.profileSignIn, IDS.profileScroll);
  await element(by.id(IDS.profileSignIn)).tap();
  await visible(IDS.authGoogle, 20000);
}

async function signInWithGoogle() {
  await goToAuthScreen();
  await element(by.id(IDS.authGoogle)).tap();
  await waitForHome();
}

// Auth ekranında kalırken (örn. profilden açıldıktan sonra) misafire dönmek için.
async function continueAsGuest() {
  await visible(IDS.authGuest, 60000);
  await element(by.id(IDS.authGuest)).tap();
  await waitForHome();
}

async function dismissIfShown(id, ms) {
  try {
    await exists(id, ms);
  } catch {
    return;
  }
  await element(by.id(id)).tap();
  await waitFor(element(by.id(id))).not.toExist().withTimeout(10000);
}

// Yeni: ilk vird günü/7 gün seri/halka hedefi gibi başarı anlarında native
// SKStoreReviewController (expo-store-review) tetiklenebilir — RN ağacı dışında bir
// sistem sayfası, testID yok. Görünüyorsa dile göre kapat; görünmüyorsa sessizce geç.
async function dismissNativeReviewPromptIfShown(ms = 4000) {
  for (const label of ['Şimdi Değil', 'Not Now']) {
    try {
      await waitFor(element(by.label(label))).toBeVisible().withTimeout(ms);
      await element(by.label(label)).tap();
      return;
    } catch {
      // bu dilde gösterilmedi; sıradakini dene
    }
  }
}

// Rozet kutlaması (ilk kayıt/seri) native Modal; sonraki modalları ve dokunuşları bekletir.
async function dismissBadgeIfShown(ms = 3000) {
  await dismissIfShown('e2e-stats-badge-close', ms);
}

// İlk açılışta ana sayfada sırayla: tur (Modal, ~600 ms sonra) → "Hoş geldin"
// Esma sayfası (Modal). İkisi de tap'ları yutar.
async function skipTourIfShown(ms = 3000) {
  await dismissIfShown(IDS.tourSkip, ms);
  await dismissIfShown(IDS.welcomeLater, ms);
}

// Temiz kurulum (artık misafir olarak açılır) + onboarding modallarını kapat +
// profilden mock Google girişi.
async function freshSignIn() {
  resetUserData();
  await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  await waitForHome();
  await skipTourIfShown();
  await signInWithGoogle();
  // signInWithGoogle profilden açılır; başarılı girişte ekran router.back() ile Profil'e
  // döner (Home'a değil) — testler Home ekranında başladığını varsayıyor, açıkça geç.
  await openTab('home');
  await skipTourIfShown();
  await visible(TAB_IDS.home);
}

// Sekmeye dokun; ekran geçişi (örn. girişten sonra router.back()) hâlâ animasyondaysa
// tüm ekranı kaplayan geçiş katmanı dokunuşu yutar ("not hittable") → kısa aralıklarla dene.
async function tapWhenHittable(id, { retries = 6, delayMs = 300 } = {}) {
  for (let attempt = 0; ; attempt += 1) {
    try {
      await element(by.id(id)).tap();
      return;
    } catch (err) {
      if (attempt >= retries) throw err;
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
}

async function openTab(name) {
  if (TAB_IDS[name]) {
    await tapWhenHittable(TAB_IDS[name]);
    return;
  }
  if (!MORE_IDS[name]) throw new Error(`Bilinmeyen sekme: ${name}`);
  await tapWhenHittable(IDS.tabMore);
  await visible(MORE_IDS[name], 5000);
  await tapWhenHittable(MORE_IDS[name]);
}

function relaunch(opts = {}) {
  return device.launchApp({ newInstance: true, ...opts });
}

// Görünene kadar verilen ScrollView'u kaydır.
// startY: kaydırma başlangıcı (0-1); ScrollView'un bir kısmı örtülüyse (klavye) aşağıdan başla.
async function scrollTo(id, scrollId, { dy = 250, direction = 'down', startY = 0.5, atIndex } = {}) {
  // Varsayılan (NaN) başlangıç noktası container'ın en alt kenarına çok yakın seçiliyor;
  // bu cihaz/derlemede o kenar kesirli-pt (sub-pixel) genişlikte olduğundan Detox'un jest
  // için istediği TAM (%100) görünürlük eşiğini hep başarısız kılıyor ("not visible (100)").
  // Ortadan (0.5) başlamak aynı sonucu (hedef görünene kadar kaydırma) o kenara değmeden verir.
  await visible(scrollId, 10000);
  const target = atIndex === undefined ? element(by.id(id)) : element(by.id(id)).atIndex(atIndex);
  await waitFor(target)
    .toBeVisible()
    .whileElement(by.id(scrollId))
    .scroll(dy, direction, NaN, startY);
}

// scrollTo hedefi ekranın alt kenarında bırakabilir; yüzen sekme çubuğu orada dokunuşu yutar
// (özel günler sekmesine düşer). Hedefi ekran ortasına çek.
async function scrollToCentered(id, scrollId, opts = {}) {
  await scrollTo(id, scrollId, opts);
  await element(by.id(scrollId)).scroll(300, opts.direction ?? 'down', NaN, 0.5);
}

async function readText(id) {
  const attrs = await element(by.id(id)).getAttributes();
  return attrs.text ?? attrs.label ?? '';
}

// Detox toHaveText tam eşleşir; alt dize (ya da RegExp) için yokla.
async function waitForTextContaining(id, fragment, ms = 20000) {
  const matches = (text) => (fragment instanceof RegExp ? fragment.test(text) : text.includes(fragment));
  const deadline = Date.now() + ms;
  let last = '';
  while (Date.now() < deadline) {
    try {
      last = await readText(id);
      if (matches(last)) return last;
    } catch {
      // henüz yok
    }
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`${id} metni "${fragment}" içermedi; son: "${last}"`);
}

async function apiRequest(method, urlPath, { token, body } = {}) {
  const res = await fetch(`${API_URL}${urlPath}`, {
    method,
    headers: {
      'content-type': 'application/json',
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${method} ${urlPath} → ${res.status}: ${JSON.stringify(json)}`);
  return json.data ?? json;
}

// Uygulamanın kullandığı mock kimlikle API'ye ayrı bir cihazdan giriş.
function apiSignIn() {
  return apiRequest('POST', '/v1/auth/provider/verify', {
    body: {
      provider: 'google',
      platform: 'ios',
      idToken: JSON.stringify(E2E_USER),
      deviceId: 'e2e-detox-node',
    },
  });
}

const apiGet = (urlPath, token) => apiRequest('GET', urlPath, { token });
const apiPost = (urlPath, token, body) => apiRequest('POST', urlPath, { token, body });

// Belirli bir kullanıcı olarak API'ye giriş (ikinci/altıncı hesap, halka katılımı için).
// Uygulamanın E2E_USER'ından farklı sub → ayrı kullanıcı kaydı.
function apiSignInAs(sub, name = 'Ikinci Kullanici') {
  return apiRequest('POST', '/v1/auth/provider/verify', {
    body: {
      provider: 'google',
      platform: 'ios',
      idToken: JSON.stringify({ sub, email: `${sub}@example.com`, name }),
      deviceId: `e2e-detox-${sub}`,
    },
  });
}

const MONGO_CONTAINER = process.env.E2E_MONGO_CONTAINER || 'zikirmatik-asistan-mongo-test-1';
// Test DB'sinde doğrudan mongosh (durum hazırlama: süresi dolmuş halka, kredi 0 vb.).
// Yalnız zikir_e2e* DB'sine bağlanır; kapsayıcı yoksa hata verir.
function mongo(js) {
  const dbName = new URL(MONGODB_URI).pathname.slice(1);
  if (!dbName.startsWith('zikir_e2e')) throw new Error(`Güvenlik: ${dbName} zikir_e2e değil`);
  return execFileSync('docker', ['exec', MONGO_CONTAINER, 'mongosh', '--quiet', dbName, '--eval', js], {
    encoding: 'utf8',
  }).trim();
}

// Kullanıcıya ait tüm verileri siler (katalog: zikir/koleksiyon/şablon/özel gün kalır):
// dosyalar arası sızıntıyı (premium, kredi, program, halka) önler. Her dosya yeni kullanıcıyla başlar.
function resetUserData() {
  const names = [
    'users', 'auth_identities', 'auth_refresh_tokens', 'subscriptions', 'ai_credit_wallets', 'ai_credit_ledger',
    'ai_usage_log', 'ai_conversations', 'ai_messages', 'ai_recommendations', 'dhikr_logs', 'user_dhikrs', 'streaks',
    'vird_programs', 'vird_day_progress', 'circles', 'devices', 'app_events', 'push_dispatches',
  ];
  mongo(`${JSON.stringify(names)}.forEach(n => db.getCollection(n).deleteMany({}))`);
}

// Emülatör komutları (yalnız Android; iOS'ta çağrılmaz).
function adb(args) {
  return execSync(`adb -s ${ADB_SERIAL} shell ${args}`, { encoding: 'utf8' }).trim();
}
function adbRoot() {
  execSync(`adb -s ${ADB_SERIAL} root`, { encoding: 'utf8' });
}
async function setAirplane(on) {
  adb(`cmd connectivity airplane-mode ${on ? 'enable' : 'disable'}`);
  await new Promise((r) => setTimeout(r, 2500));
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function tapN(id, n) {
  for (let i = 0; i < n; i += 1) await element(by.id(id)).tap();
}

// apps/api/scripts/e2e-seed.mjs'i test DB'sine karşı çalıştır.
function seed(args) {
  execSync(`node scripts/e2e-seed.mjs ${args}`, {
    cwd: path.resolve(__dirname, '../../api'),
    env: { ...process.env, MONGODB_URI },
    stdio: 'inherit',
  });
}

module.exports = {
  IDS,
  TAB_IDS,
  dismissIfShown,
  E2E_USER,
  visible,
  exists,
  existsText,
  tapBack,
  waitForHome,
  goToAuthScreen,
  signInWithGoogle,
  continueAsGuest,
  skipTourIfShown,
  dismissBadgeIfShown,
  freshSignIn,
  openTab,
  tapWhenHittable,
  dismissNativeReviewPromptIfShown,
  relaunch,
  scrollTo,
  scrollToCentered,
  readText,
  waitForTextContaining,
  apiSignIn,
  apiSignInAs,
  apiGet,
  apiPost,
  seed,
  mongo,
  resetUserData,
  adb,
  adbRoot,
  setAirplane,
  sleep,
  tapN,
  apiRequest,
};
