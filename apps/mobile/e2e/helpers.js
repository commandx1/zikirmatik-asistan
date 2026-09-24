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

async function signInWithGoogle() {
  await visible(IDS.authGoogle, 60000);
  await element(by.id(IDS.authGoogle)).tap();
  await waitForHome();
}

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

// İlk açılışta ana sayfada sırayla: tur (Modal, ~600 ms sonra) → "Hoş geldin"
// Esma sayfası (Modal). İkisi de tap'ları yutar.
async function skipTourIfShown(ms = 3000) {
  await dismissIfShown(IDS.tourSkip, ms);
  await dismissIfShown(IDS.welcomeLater, ms);
}

// Temiz kurulum + mock Google girişi + onboarding modallarını kapat.
async function freshSignIn() {
  await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  await signInWithGoogle();
  await skipTourIfShown();
  await visible(TAB_IDS.home);
}

async function openTab(name) {
  if (TAB_IDS[name]) {
    await element(by.id(TAB_IDS[name])).tap();
    return;
  }
  if (!MORE_IDS[name]) throw new Error(`Bilinmeyen sekme: ${name}`);
  await element(by.id(IDS.tabMore)).tap();
  await visible(MORE_IDS[name], 5000);
  await element(by.id(MORE_IDS[name])).tap();
}

function relaunch(opts = {}) {
  return device.launchApp({ newInstance: true, ...opts });
}

// Görünene kadar verilen ScrollView'u kaydır.
// startY: kaydırma başlangıcı (0-1); ScrollView'un bir kısmı örtülüyse (klavye) aşağıdan başla.
async function scrollTo(id, scrollId, { dy = 250, direction = 'down', startY = NaN } = {}) {
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
  signInWithGoogle,
  continueAsGuest,
  skipTourIfShown,
  freshSignIn,
  openTab,
  relaunch,
  scrollTo,
  readText,
  waitForTextContaining,
  apiSignIn,
  apiGet,
  seed,
};
