/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  visible,
  exists,
  existsText,
  skipTourIfShown,
  waitForHome,
  waitForTextContaining,
  scrollTo,
  signInWithGoogle,
  openTab,
  relaunch,
  tapN,
  sleep,
  resetUserData,
  mongo,
  apiSignIn,
  apiGet,
  seed,
  setAirplane,
  adb,
  adbRoot,
} = require('./helpers');

const gone = (id, ms = 8000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);
const freshInstall = async () => {
  resetUserData();
  await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  await waitForHome(60000);
  await skipTourIfShown();
};
const toProfile = async () => {
  await openTab('profile');
  await visible('e2e-profile-scroll', 20000);
};
// Zikirlerim formu: ad (+ opsiyonel hedef) gir, Kaydet.
async function createDhikr(name, target) {
  await element(by.id('e2e-zikir-add')).tap();
  await visible('e2e-zikir-form-name', 10000);
  await element(by.id('e2e-zikir-form-name')).replaceText(name);
  if (target !== undefined) await element(by.id('e2e-zikir-form-target')).replaceText(String(target));
  await element(by.id('e2e-zikir-form-submit')).tap();
}
const openMenu = async () => {
  await element(by.id('e2e-zikir-menu')).atIndex(0).tap();
  await sleep(500);
};

describe('16a Zikirlerim (misafir)', () => {
  beforeAll(freshInstall);

  it('ZKR-02 ad boşken Kaydet pasif; ZKR-03 hedef 0 sınırsız; ZKR-01 filtreler', async () => {
    await openTab('focus');
    await visible('e2e-zikir-add', 20000);
    await element(by.id('e2e-zikir-add')).tap();
    await visible('e2e-zikir-form-name', 10000);
    await element(by.id('e2e-zikir-form-submit')).tap();
    await sleep(500);
    await expect(element(by.id('e2e-zikir-form-name'))).toExist();
    await element(by.id('e2e-zikir-form-name')).replaceText('Sınırsız Deneme');
    await element(by.id('e2e-zikir-form-target')).replaceText('0');
    await element(by.id('e2e-zikir-form-submit')).tap();
    await gone('e2e-zikir-form-name');
    await existsText(/^Sınırsız Deneme$/, 10000);
    // hedefi yok → aktif; tamamlanan filtresinde görünmez.
    await existsText(/^0\/∞$/, 5000);
    await element(by.id('e2e-zikir-filter-active')).tap();
    await existsText(/^Sınırsız Deneme$/, 5000);
    await element(by.id('e2e-zikir-filter-completed')).tap();
    await sleep(600);
    await expect(element(by.text('Sınırsız Deneme'))).not.toExist();
    await element(by.id('e2e-zikir-filter-all')).tap();
    await existsText(/^Sınırsız Deneme$/, 5000);
  });

  it('ZKR-10 favoriye ekle → Favoriler filtresinde', async () => {
    await openMenu();
    await element(by.id('e2e-zikir-favorite')).atIndex(0).tap();
    await element(by.id('e2e-zikir-filter-favorites')).tap();
    await existsText(/^Sınırsız Deneme$/, 5000);
    await element(by.id('e2e-zikir-filter-all')).tap();
  });

  it('ZKR-12 Başlat → ana sayfa, zikir seçili', async () => {
    await element(by.id('e2e-zikir-start')).atIndex(0).tap();
    await visible('e2e-home-counter', 20000);
    await waitForTextContaining('e2e-home-count-label', /^0$/, 10000);
  });

  it('ZKR-11 serbest sayım varken Başlat kaydedilmemiş uyarısı çıkarır', async () => {
    await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
    await element(by.id('e2e-home-free-mode')).tap();
    await scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });
    await tapN('e2e-home-counter', 2);
    await openTab('focus');
    await element(by.id('e2e-zikir-start')).atIndex(0).tap();
    await exists('e2e-home-unsaved-cancel', 10000);
    await element(by.id('e2e-home-unsaved-cancel')).tap();
    await gone('e2e-home-unsaved-cancel');
  });

  it('ZKR-06 kaydedilmemiş serbest sayım varken yeni zikir oluşturmak sayacı sessizce değiştirmez', async () => {
    await openTab('focus');
    await createDhikr('Yeni Ek Zikir', 10);
    await gone('e2e-zikir-form-name');
    await openTab('home');
    await waitForTextContaining('e2e-home-count-label', /^2/, 10000);
  });
});

describe('16b ayarlar (ücretsiz misafir)', () => {
  beforeAll(freshInstall);
  const toSelector = async (id) => {
    await toProfile();
    await scrollTo(id, 'e2e-profile-scroll');
    await element(by.id(id)).tap();
  };

  const pickSwatch = async (i) => {
    const id = `e2e-theme-option-${i}`;
    await scrollTo(id, 'e2e-theme-scroll');
    await element(by.id(id)).tap();
  };

  it('AYR-08 ücretsiz tema seçilip kaydedilir (yeniden açılışta kalır); premium tema önizlenir, kaydet → premium sayfası', async () => {
    await toSelector('e2e-settings-theme');
    await pickSwatch('cami-yesili');
    await exists('e2e-theme-save', 10000);
    await element(by.id('e2e-theme-save')).tap();
    await gone('e2e-theme-save', 15000);
    // Kaydedilen tema varsayılandan farklı: ilk temaya dokununca değişiklik var.
    await pickSwatch('gece-koyu');
    await exists('e2e-theme-save', 10000);
    await pickSwatch('cami-yesili');
    await gone('e2e-theme-save', 10000);

    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toSelector('e2e-settings-theme');
    await pickSwatch('gece-koyu');
    await exists('e2e-theme-save', 10000);

    // Premium tema: önizleme (kaydet düğmesi görünür) ama kaydet premium sayfasını açar.
    await pickSwatch('gece-lacivert');
    await exists('e2e-theme-save', 10000);
    await element(by.id('e2e-theme-save')).tap();
    await exists('e2e-premium-sheet', 15000);
    await device.pressBack();
  });

  it('AYR-13 ücretsiz kullanıcı tık sesi "Tık" seçince premium sayfası açılır (SAY-26 kapısı)', async () => {
    await gone('e2e-premium-sheet', 10000).catch(() => {});
    await element(by.id('e2e-theme-scroll')).scroll(2000, 'up', NaN, 0.5);
    await existsText(/^(Tık|Tick)$/, 10000);
    await element(by.text(/^(Tık|Tick)$/)).atIndex(0).tap();
    await exists('e2e-premium-sheet', 15000);
    await device.pressBack();
  });

  it('SAY-20 ücretsiz kullanıcı tesbih görünümü seçince halka sayacı çalışır + kilit şeridi premium sayfasını açar', async () => {
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toSelector('e2e-settings-theme');
    await exists('e2e-theme-scroll', 20000);
    await element(by.id('e2e-theme-scroll')).scroll(2000, 'up', NaN, 0.5);
    await element(by.text(/^(Tesbih|Tasbih)$/)).atIndex(0).tap();
    await device.pressBack();
    await openTab('home');
    await existsText(/^(Tesbih modu Premium ile açılır|Tasbih mode unlocks with Premium).*$/, 15000);
    await tapN('e2e-home-counter', 2);
    await waitForTextContaining('e2e-home-count-label', /^2/, 10000);
    await element(by.text(/^(Tesbih modu Premium ile açılır|Tasbih mode unlocks with Premium).*$/)).atIndex(0).tap();
    await exists('e2e-premium-sheet', 15000);
    await device.pressBack();
  });

  it('AYR-11 yazı tipi seçilince "Değişiklikleri Kaydet" görünür, kaydedince uygulanır ve kalır', async () => {
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toSelector('e2e-settings-font');
    await scrollTo('e2e-font-option-merriweather', 'e2e-font-scroll');
    await element(by.id('e2e-font-option-merriweather')).tap();
    await exists('e2e-font-save', 10000);
    await element(by.id('e2e-font-save')).tap();
    await gone('e2e-font-save', 10000);
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toSelector('e2e-settings-font');
    await scrollTo('e2e-font-option-default', 'e2e-font-scroll', { direction: 'up' });
    await element(by.id('e2e-font-option-default')).tap();
    // Kayıtlı yazı tipi merriweather idi → varsayılana dokunmak değişiklik yaratır.
    await exists('e2e-font-save', 10000);
    await element(by.id('e2e-font-save')).tap();
    await gone('e2e-font-save', 10000);
  });

});

describe('16b2 dil değişimi sayımı korur', () => {
  it('AYR-04 kaydedilmemiş sayım varken dil değişince sayım ve seçili zikir korunur', async () => {
    await freshInstall();
    await openTab('home');
    await tapN('e2e-home-counter', 3);
    await waitForTextContaining('e2e-home-count-label', /^3/, 10000);
    await toProfile();
    await scrollTo('e2e-profile-language', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-language')).tap();
    await sleep(1500);
    await openTab('home');
    await waitForTextContaining('e2e-home-count-label', /^3/, 10000);
    await toProfile();
    await scrollTo('e2e-profile-language', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-language')).tap();
  });
});

describe('16c titreşim deseni üye', () => {
  it('AYR-14 titreşim deseni sunucuya yazılır', async () => {
    resetUserData();
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome(60000);
    await skipTourIfShown();
    await signInWithGoogle();
    await skipTourIfShown();
    await toProfile();
    await existsText(/^(Hafif|Light)$/, 10000);
    await scrollTo('e2e-haptics-hafif', 'e2e-profile-scroll', { direction: 'up' });
    await element(by.id('e2e-haptics-hafif')).tap();
    await sleep(2500);
    const out = mongo("print(JSON.stringify(db.users.find({}).toArray()))");
    assert.match(out, /"hapticsPattern":"hafif"/);
  });
});

describe('16d Zikirlerim (üye)', () => {
  let token;
  beforeAll(async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();
    token = (await apiSignIn()).accessToken;
  });

  it('ZKR-04 hedef 99999: yerel ve sunucu aynı değeri tutar', async () => {
    await openTab('focus');
    await visible('e2e-zikir-add', 20000);
    await createDhikr('Büyük Hedef', 99999);
    await gone('e2e-zikir-form-name', 15000);
    await existsText(/^0\/99999$/, 10000);
    await sleep(1500);
    const list = await apiGet('/v1/user-dhikrs', token);
    assert.equal(list.find((d) => d.name === 'Büyük Hedef')?.target, 99999);
  });

  it('ZKR-07 kişisel zikir güncellenir (ad + hedef sunucuya yazılır)', async () => {
    await openMenu();
    await element(by.id('e2e-zikir-update')).atIndex(0).tap();
    await visible('e2e-zikir-form-name', 10000);
    await element(by.id('e2e-zikir-form-name')).replaceText('Büyük Hedef 2');
    await element(by.id('e2e-zikir-form-target')).replaceText('50');
    await element(by.id('e2e-zikir-form-submit')).tap();
    await gone('e2e-zikir-form-name', 15000);
    await existsText(/^Büyük Hedef 2$/, 10000);
    await sleep(1500);
    const list = await apiGet('/v1/user-dhikrs', token);
    const d = list.find((x) => x.name === 'Büyük Hedef 2');
    assert.equal(d?.target, 50);
  });

  it('ZKR-08 kişisel zikir silinir: listeden kalkar, sunucuda silinir', async () => {
    await openMenu();
    await element(by.id('e2e-zikir-delete')).atIndex(0).tap();
    await exists('e2e-zikir-delete-confirm', 10000);
    await element(by.id('e2e-zikir-delete-confirm')).tap();
    await waitFor(element(by.text('Büyük Hedef 2'))).not.toExist().withTimeout(15000);
    await sleep(1500);
    const list = await apiGet('/v1/user-dhikrs', token);
    assert.equal(list.some((x) => x.name === 'Büyük Hedef 2'), false);
  });
});

describe('16e istatistik: premium kilidi ve hata', () => {
  const UNLOCK = /^(Premium ile aç|Unlock with premium)$/;
  beforeAll(async () => {
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();
  });

  it('IST-02 kilitli bölümdeki "Premium ile aç" premium sayfasını açar', async () => {
    await openTab('stats');
    await existsText(UNLOCK, 30000);
    // Birden çok kilit düğmesi var; ekranda yeterince görünen ilkine dokun, yoksa kaydır.
    let tapped = false;
    for (let round = 0; round < 8 && !tapped; round += 1) {
      for (let i = 0; i < 6 && !tapped; i += 1) {
        try {
          await element(by.id('e2e-stats-unlock')).atIndex(i).tap();
          tapped = true;
        } catch {
          // bu düğüm ekranda yeterince görünmüyor; sıradaki
        }
      }
      if (!tapped) await element(by.id('e2e-stats-scroll')).scroll(250, 'down', NaN, 0.5);
    }
    assert.ok(tapped, 'görünür kilit düğmesi bulunamadı');
    await exists('e2e-premium-sheet', 15000);
    await device.pressBack();
    await gone('e2e-premium-sheet', 10000);
  });

  it('IST-04 premium alındı (seed): ekrana dönünce kilit kalkar; IST-03 tüm bölümler açık', async () => {
    seed('--premium e2e-user');
    await openTab('home');
    await sleep(1000);
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await openTab('stats');
    await existsText(/^(Aktivite takvimi|Activity calendar)$/, 30000);
    await sleep(1500);
    await expect(element(by.text(UNLOCK))).not.toExist();
  });

  it('IST-07 sunucu hatası + veri yok: "Tekrar dene" çalışır (yalnız Android)', async () => {
    if (device.getPlatform() !== 'android') return;
    await setAirplane(true);
    try {
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
      await openTab('stats');
      await existsText(/^(Tekrar dene|Retry)$/, 90000);
    } finally {
      await setAirplane(false);
    }
    await sleep(4000);
    await element(by.text(/^(Tekrar dene|Retry)$/)).atIndex(0).tap();
    await existsText(/^(Aktivite takvimi|Activity calendar)$/, 60000);
  });
});

describe('16f Zikirlerim API hataları (yalnız Android: uçak modu)', () => {
  const online = () => device.getPlatform() === 'android';
  beforeAll(async () => {
    if (!online()) return;
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();
  });

  it('ZKR-05 üye yeni zikir API hatası: geri alınır + hata', async () => {
    if (!online()) return;
    await openTab('focus');
    await visible('e2e-zikir-add', 20000);
    await setAirplane(true);
    try {
      await createDhikr('Hata Zikir', 5);
      await existsText(/^(Zikir kaydedilemedi|Couldn't save the dhikr).*$/, 120000);
    } finally {
      await setAirplane(false);
    }
    await element(by.text(/^(İptal|Cancel)$/)).atIndex(0).tap();
    await gone('e2e-zikir-form-name', 10000);
    await expect(element(by.text('Hata Zikir'))).not.toExist();
  });

  it('ZKR-09 silme API hatası: hata görünür, öğe kalır', async () => {
    if (!online()) return;
    await sleep(5000);
    await createDhikr('Silinemeyen', 5);
    await gone('e2e-zikir-form-name', 20000);
    await existsText(/^Silinemeyen$/, 10000);
    await openMenu();
    await element(by.id('e2e-zikir-delete')).atIndex(0).tap();
    await exists('e2e-zikir-delete-confirm', 10000);
    await setAirplane(true);
    try {
      await element(by.id('e2e-zikir-delete-confirm')).tap();
      await exists('e2e-zikir-delete-error', 120000);
    } finally {
      await setAirplane(false);
    }
    await existsText(/^Silinemeyen$/, 5000);
  });
});

describe('16g çevrimdışı açılış ve saat dilimi (yalnız Android)', () => {
  const android = () => device.getPlatform() === 'android';
  beforeAll(async () => {
    if (!android()) return;
    await freshInstall();
    await signInWithGoogle();
    await skipTourIfShown();
  });

  it('HID-10 uçak modunda açılış çökmez, yerel sayaç çalışır', async () => {
    if (!android()) return;
    await setAirplane(true);
    try {
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
      await visible('e2e-home-counter', 30000);
      await tapN('e2e-home-counter', 3);
      await waitForTextContaining('e2e-home-count-label', /^3/, 10000);
    } finally {
      await setAirplane(false);
    }
  });

  it('HID-12 cihaz saat dilimi New York: kayıt yerel gün anahtarıyla yazılır', async () => {
    if (!android()) return;
    adbRoot();
    const previous = adb('getprop persist.sys.timezone') || 'Europe/Istanbul';
    try {
      adb('setprop persist.sys.timezone America/New_York');
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
      await visible('e2e-home-counter', 30000);
      await tapN('e2e-home-counter', 2);
      await element(by.id('e2e-home-save')).tap();
      await visible('e2e-home-save-name-input', 15000);
      await element(by.id('e2e-home-save-name-input')).replaceText('TZ Zikir');
      await element(by.id('e2e-home-save-name-submit')).tap();
      await sleep(3500);
      const out = mongo("print(JSON.stringify(db.dhikr_logs.find({}).toArray().map(l => l.date)))");
      const nyDay = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/New_York' }).format(new Date());
      assert.ok(JSON.parse(out).includes(nyDay), `log date ${out} yerel gün ${nyDay} içermiyor`);
    } finally {
      adb(`setprop persist.sys.timezone ${previous}`);
    }
  });
});
