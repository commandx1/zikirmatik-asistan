/* global device, element, by, waitFor */
const { execSync, spawn } = require('node:child_process');
const {
  visible,
  exists,
  existsText,
  tapBack,
  waitForHome,
  skipTourIfShown,
  dismissIfShown,
  dismissBadgeIfShown,
  signInWithGoogle,
  openTab,
  relaunch,
  tapN,
  sleep,
  mongo,
  adb,
  resetUserData,
} = require('./helpers');

const isAndroid = device.getPlatform() === 'android';
const PKG = 'com.zikirmatik_asistan.app';
const ymd = (offsetDays) => {
  const d = new Date(Date.now() + offsetDays * 86400000);
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
};

// Turu geçince sırayla: tur, "Hoş geldin" Esma modalı, bildirim yumuşak sorusu (kart).
const dismissOverlays = async () => {
  for (let round = 0; round < 1; round += 1) {
    await dismissIfShown('e2e-tour-skip', 2500);
    await dismissIfShown('e2e-home-welcome-later', 2500);
    await dismissIfShown('e2e-notif-offer-dismiss', 2500);
  }
};

// Sekme çubuğu görünene (üstte modal kalmayana) dek kapatmayı dener; Android'de modal ayrı pencere.
const settle = async () => {
  for (let i = 0; i < 6; i += 1) {
    try {
      await expect(element(by.id('e2e-tab-more'))).toBeVisible();
      return;
    } catch {
      await dismissOverlays();
    }
  }
};

describe('12 bildirim, özel günler, yönlendirme, zorunlu güncelleme', () => {
  beforeAll(() => {
    resetUserData();
  });

  it('@smoke B-11 bildirim kartı: OS izin penceresi açılmaz, "Şimdi değil" izin istemez, kayıtlardan sonra kart tekrar çıkmaz', async () => {
    // OS izni verilmemiş temiz kurulum: iOS "unset", Android kurulum sonrası izni geri al.
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: isAndroid ? 'YES' : 'unset' } });
    if (isAndroid) {
      adb(`pm revoke ${PKG} android.permission.POST_NOTIFICATIONS`);
      await sleep(1500);
      await device.launchApp({ newInstance: true });
    }
    await waitForHome(60000);
    await settle();
    await signInWithGoogle();
    await settle();
    await openTab('home');
    await settle();
    await visible('e2e-home-counter', 20000);

    await tapN('e2e-home-counter', 1);
    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Bildirim Zikri');
    await element(by.id('e2e-home-save-target-input')).replaceText('1');
    await element(by.id('e2e-home-save-name-submit')).tap();
    // Serbest-kayıt formu yolu kartı tetiklemiyor (rapor: B-11); düzenli Kaydet yolu tetikler.
    await dismissBadgeIfShown(8000);
    await sleep(2500);
    await tapN('e2e-home-counter', 1);
    await element(by.id('e2e-home-save')).tap();
    await dismissBadgeIfShown(5000);
    await exists('e2e-notif-offer-dismiss', 30000);
    // "Şimdi değil": OS izin penceresi açılmaz, kart kapanır.
    await element(by.id('e2e-notif-offer-dismiss')).tap();
    await waitFor(element(by.id('e2e-notif-offer-dismiss'))).not.toExist().withTimeout(10000);

    // Sonraki kayıtta kart tekrar çıkmaz.
    await tapN('e2e-home-counter', 1);
    await element(by.id('e2e-home-save')).tap();
    await sleep(4000);
    await expect(element(by.id('e2e-notif-offer-dismiss'))).not.toExist();
  });

  it('özel günler: misafir liste + detay', async () => {
    mongo(`db.special_days.deleteMany({eventKey: /^e2e-/}); db.special_days.insertMany([
      {name: {tr: 'E2E Test Kandili', en: 'E2E Test Kandil'}, type: 'kandil', date: '${ymd(12)}', hijriDate: '1 Test 1448', eventKey: 'e2e-kandil', priority: 1, isActive: true, practices: [], createdAt: new Date(), updatedAt: new Date()},
      {name: {tr: 'E2E Test Bayramı', en: 'E2E Test Eid'}, type: 'bayram', date: '${ymd(40)}', hijriDate: '1 Test 1449', eventKey: 'e2e-bayram', priority: 1, isActive: true, practices: [], createdAt: new Date(), updatedAt: new Date()}
    ])`);
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome(60000);
    await skipTourIfShown();
    await openTab('specialDays');
    await existsText(/.*E2E Test (Kandili|Kandil).*/, 30000);
    await element(by.text(/.*E2E Test (Kandili|Kandil).*/)).atIndex(0).tap();
    await existsText(/.*E2E Test (Kandili|Kandil).*/, 20000);
    await tapBack();
    await existsText(/.*E2E Test (Bayramı|Eid).*/, 20000);
  });

  it('B-18 soğuk açılışta derin bağlantı rotayı açar, çökmez', async () => {
    await device.launchApp({ newInstance: true, url: 'zikirmatik://vird' });
    await exists('e2e-vird-hub', 60000);
  });

  (process.env.E2E_API_RESTART_CMD ? it : it.skip)('zorunlu güncelleme modalı: APP_MIN_VERSION yüksekken çıkar, normale dönünce kalkar', async () => {
    const restart = (minVersion) => {
      try {
        execSync('pkill -f "node dist/main"');
      } catch {
        // süreç yoksa geç
      }
      spawn('bash', [process.env.E2E_API_RESTART_CMD], {
        env: { ...process.env, APP_MIN_VERSION: String(minVersion) },
        detached: true,
        stdio: 'ignore',
      }).unref();
    };
    const waitApi = async () => {
      for (let i = 0; i < 40; i += 1) {
        try {
          const r = await fetch(`${process.env.E2E_API_URL || 'http://127.0.0.1:3000'}/app-config`);
          if (r.ok) return;
        } catch {
          // henüz kalkmadı
        }
        await sleep(1000);
      }
      throw new Error('API yeniden başlamadı');
    };
    try {
      restart(99999);
      await waitApi();
      await relaunch();
      await existsText(/^(Update Required|Güncelleme Gerekli)$/, 60000);
    } finally {
      restart(0);
      await waitApi();
    }
    await relaunch();
    await waitForHome(60000);
    await expect(element(by.text(/^(Update Required|Güncelleme Gerekli)$/))).not.toExist();
  });
});
