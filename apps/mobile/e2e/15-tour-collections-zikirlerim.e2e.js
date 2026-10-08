/* global device, element, by, waitFor */
const {
  visible,
  exists,
  existsText,
  skipTourIfShown,
  dismissIfShown,
  waitForHome,
  waitForTextContaining,
  scrollTo,
  openTab,
  relaunch,
  tapN,
  sleep,
  resetUserData,
  setAirplane,
} = require('./helpers');

const gone = (id, ms = 8000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);
const freshInstall = async () => {
  resetUserData();
  await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
  await waitForHome(60000);
};
const toProfile = async () => {
  await openTab('profile');
  await visible('e2e-profile-scroll', 20000);
};

describe('15a tur (onboarding turu)', () => {
  beforeAll(freshInstall);

  it('TUR-01 tamamlanmamış turda ana sekme açılınca tur gelir; TUR-02 İleri×8 + Bitir turu kapatır ve yeniden açılışta gelmez', async () => {
    await exists('e2e-tour-skip', 20000);
    for (let i = 0; i < 8; i += 1) {
      await exists('e2e-tour-next', 10000);
      await element(by.id('e2e-tour-next')).tap();
      await sleep(400);
    }
    // 9. adım: aynı düğme "Bitir".
    await existsText(/^(Bitir|Finish)$/, 10000);
    await element(by.id('e2e-tour-next')).tap();
    await gone('e2e-tour-skip', 10000);

    await dismissIfShown('e2e-notif-offer-dismiss', 3000);
    await dismissIfShown('e2e-home-welcome-later', 3000);
    await relaunch();
    await waitForHome(60000);
    await sleep(2500);
    await expect(element(by.id('e2e-tour-skip'))).not.toExist();
  });

  it('TUR-05 Profil → "Uygulamayı Tanıt" ana sayfaya gider ve turu yeniden başlatır; TUR-03 Atla turu tamamlanmış sayar', async () => {
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-settings-tour-replay', 'e2e-profile-scroll');
    await element(by.id('e2e-settings-tour-replay')).tap();
    await exists('e2e-tour-skip', 20000);
    await element(by.id('e2e-tour-skip')).tap();
    await gone('e2e-tour-skip');
    await dismissIfShown('e2e-notif-offer-dismiss', 3000);
    await dismissIfShown('e2e-home-welcome-later', 3000);
    await relaunch();
    await waitForHome(60000);
    await sleep(2500);
    await expect(element(by.id('e2e-tour-skip'))).not.toExist();
  });

  it('TUR-03 Android geri tuşu turu atlar ve tamamlanmış sayar', async () => {
    if (device.getPlatform() !== 'android') return;
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-settings-tour-replay', 'e2e-profile-scroll');
    await element(by.id('e2e-settings-tour-replay')).tap();
    await exists('e2e-tour-skip', 20000);
    await device.pressBack();
    await gone('e2e-tour-skip');
    await dismissIfShown('e2e-notif-offer-dismiss', 3000);
    await dismissIfShown('e2e-home-welcome-later', 3000);
    await relaunch();
    await waitForHome(60000);
    await sleep(2500);
    await expect(element(by.id('e2e-tour-skip'))).not.toExist();
  });
});

describe('15b koleksiyonlar', () => {
  beforeAll(async () => {
    await freshInstall();
    await skipTourIfShown();
  });

  it('KOL-01 kartlar + kategori çipleri; KOL-02 çip yalnız o kategoriyi gösterir', async () => {
    await openTab('collections');
    await exists('e2e-collection-card', 30000);
    for (const re of [/^(Tümü|All)$/, /^(Günlük|Daily)$/, /^(Namaz|Prayer)$/, /^(Dua)$/, /^(Koruma|Protection)$/, /^(Hayat|Life)$/, /^(İbadet|Worship)$/]) {
      await existsText(re, 10000);
    }
    await element(by.text(/^(Namaz|Prayer)$/)).atIndex(0).tap();
    await existsText(/Namazdan Sonra Yapılan Zikirler|Dhikrs Recited After Prayer/, 10000);
    await expect(element(by.text(/Recep Ayı 2025|Month of Rajab 2025/))).not.toExist();
    await element(by.text(/^(Tümü|All)$/)).atIndex(0).tap();
    await exists('e2e-collection-card', 10000);
  });

  it('KOL-03 misafir "Sayaca Ekle" → ana sayfada zikir seçili, sayım 0, hedef önerilen; KOL-05 kilit yok', async () => {
    await openTab('collections');
    await element(by.text(/^(Günlük|Daily)$/)).atIndex(0).tap();
    await existsText(/Günlük Tesbih ve Zikir|Daily Tasbih and Dhikr/, 10000);
    await element(by.text(/Günlük Tesbih ve Zikir|Daily Tasbih and Dhikr/)).atIndex(0).tap();
    await exists('e2e-collection-add-to-counter', 20000);
    await element(by.id('e2e-collection-add-to-counter')).atIndex(0).tap();
    await visible('e2e-home-counter', 20000);
    await waitForTextContaining('e2e-home-count-label', /^0\/\d+$/, 10000);
    // Premium sayfası açılmadı (koleksiyon ücretsiz).
    await expect(element(by.id('e2e-premium-sheet'))).not.toExist();
  });

  it('KAY-20 koleksiyondan aynı zikir tekrar eklenince devam/sıfırdan modalı çıkar', async () => {
    await tapN('e2e-home-counter', 2);
    await waitForTextContaining('e2e-home-count-label', /^2\/\d+$/, 10000);
    await openTab('collections');
    await element(by.text(/^(Günlük|Daily)$/)).atIndex(0).tap();
    await existsText(/Günlük Tesbih ve Zikir|Daily Tasbih and Dhikr/, 10000);
    await element(by.text(/Günlük Tesbih ve Zikir|Daily Tasbih and Dhikr/)).atIndex(0).tap();
    await exists('e2e-collection-add-to-counter', 20000);
    await element(by.id('e2e-collection-add-to-counter')).atIndex(0).tap();
    await exists('e2e-home-resume-continue', 10000);
    await element(by.id('e2e-home-resume-continue')).tap();
    await visible('e2e-home-counter', 20000);
    await waitForTextContaining('e2e-home-count-label', /^2\/\d+$/, 10000);
  });

  it('KOL-06 ağ yokken Koleksiyonlar "yüklenemedi" hatası gösterir', async () => {
    if (device.getPlatform() !== 'android') return;
    await setAirplane(true);
    try {
      await relaunch();
      await waitForHome(60000);
      await skipTourIfShown();
      await openTab('collections');
      await existsText(/^(Koleksiyonlar yüklenemedi|Failed to load collections|Sunucuya ulaşılamıyor|Cannot reach the server).*$/, 60000);
      // VRD-28: şablon rafı da hata gösterir ("tekrar dene" düğmesi yok → ürün sorusu).
      await existsText(/^(Şablonlar yüklenemedi|Couldn't load templates).*$/, 20000);
    } finally {
      await setAirplane(false);
    }
  });
});
