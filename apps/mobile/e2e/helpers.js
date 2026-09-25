/* global element, by, waitFor, device */
const { execSync } = require('node:child_process');
const path = require('node:path');

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

// İlk açılışta ana sayfada sırayla: tur (Modal, ~600 ms sonra) → "Hoş geldin"
// Esma sayfası (Modal). İkisi de tap'ları yutar.
async function skipTourIfShown(ms = 3000) {
  await dismissIfShown(IDS.tourSkip, ms);
  await dismissIfShown(IDS.welcomeLater, ms);
}

// Temiz kurulum (artık misafir olarak açılır) + onboarding modallarını kapat +
// profilden mock Google girişi.
async function freshSignIn() {
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
async function scrollTo(id, scrollId, { dy = 250, direction = 'down', startY = 0.5 } = {}) {
  // Varsayılan (NaN) başlangıç noktası container'ın en alt kenarına çok yakın seçiliyor;
  // bu cihaz/derlemede o kenar kesirli-pt (sub-pixel) genişlikte olduğundan Detox'un jest
  // için istediği TAM (%100) görünürlük eşiğini hep başarısız kılıyor ("not visible (100)").
  // Ortadan (0.5) başlamak aynı sonucu (hedef görünene kadar kaydırma) o kenara değmeden verir.
  await visible(scrollId, 10000);
  await waitFor(element(by.id(id)))
    .toBeVisible()
    .whileElement(by.id(scrollId))
    .scroll(dy, direction, NaN, startY);
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
  E2E_USER,
  visible,
  exists,
  waitForHome,
  goToAuthScreen,
  signInWithGoogle,
  continueAsGuest,
  skipTourIfShown,
  freshSignIn,
  openTab,
  tapWhenHittable,
  dismissNativeReviewPromptIfShown,
  relaunch,
  scrollTo,
  readText,
  waitForTextContaining,
  apiSignIn,
  apiGet,
  seed,
};
