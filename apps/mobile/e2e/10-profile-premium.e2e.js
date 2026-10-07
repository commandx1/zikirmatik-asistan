/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  visible,
  exists,
  existsText,
  scrollTo,
  openTab,
  goToAuthScreen,
  sleep,
  setAirplane,
  seed,
  resetUserData,
  mongo,
  waitForTextContaining,
} = require('./helpers');

const toProfile = async () => {
  await openTab('profile');
  await visible('e2e-profile-scroll', 20000);
};
const families = () => Number(mongo("print(db.auth_refresh_tokens.distinct('familyId').length)"));

describe('10 profil, premium, ayarlar', () => {
  beforeAll(() => {
    resetUserData();
  });

  it('@smoke AYR-01 dil TR↔EN değişir ve yeniden başlatmada kalıcıdır', async () => {
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome();
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-language', 'e2e-profile-scroll');
    // Cihaz diline göre mevcut etiket: "English" ise hedef Türkçe, değilse İngilizce.
    let toTurkish = true;
    try {
      await waitFor(element(by.text('English'))).toExist().withTimeout(3000);
    } catch {
      toTurkish = false;
    }
    await element(by.id('e2e-profile-language')).tap();
    const nextLabel = toTurkish ? 'Türkçe' : 'English';
    await existsText(new RegExp(`^${nextLabel}$`), 10000);

    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-language', 'e2e-profile-scroll');
    await existsText(new RegExp(`^${nextLabel}$`), 10000);
    // Geri al: sonraki testler cihaz dilinde başlar.
    await element(by.id('e2e-profile-language')).tap();
    await existsText(new RegExp(`^${toTurkish ? 'English' : 'Türkçe'}$`), 10000);
  });

  it('B-15 Google girişine çift dokunuş tek oturum açar; M-14 misafirde "Hesabı sil" yok', async () => {
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: 'YES' } });
    await waitForHome();
    await skipTourIfShown();
    await toProfile();
    await expect(element(by.id('e2e-profile-delete-account'))).not.toExist();
    const before = families();
    await goToAuthScreen();
    await element(by.id('e2e-auth-google')).multiTap(2);
    await waitForHome(60000);
    await sleep(2500);
    assert.equal(families(), before + 1);
  });

  it('M-15 çıkış onay ister; çıkış sonrası misafir', async () => {
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-logout', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-logout')).tap();
    await visible('e2e-profile-logout-confirm', 10000);
    await element(by.id('e2e-profile-logout-confirm')).tap();
    // Çıkış sonrası ana sayfaya düşer (misafir); profilde "Giriş yap" görünür.
    await waitForHome(30000);
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-sign-in', 'e2e-profile-scroll');
    await expect(element(by.id('e2e-profile-logout'))).not.toExist();
    await expect(element(by.id('e2e-profile-delete-account'))).not.toExist();
  });

  it('M-10 + M-07 premium sayfası "10 halka, 200 üye" der; premium hesapta gerçek kredi bakiyesi', async () => {
    await freshSignIn();
    await toProfile();
    await scrollTo('e2e-profile-premium-features', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-premium-features')).tap();
    await exists('e2e-premium-sheet', 15000);
    await existsText(/^10 (halka|circles), 200 (üye|members)$/, 10000);
    await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
    await element(by.id('e2e-premium-close')).tap();

    seed('--premium e2e-user');
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();

    await openTab('aiGuide');
    await scrollTo('e2e-ai-chat-entry', 'e2e-ai-guide-scroll', { direction: 'up', startY: 0.9 });
    await element(by.id('e2e-ai-chat-entry')).tap();
    const label = await waitForTextContaining('e2e-ai-chat-credits', /\d/, 20000);
    const n = Number.parseInt(label.replace(/\D+/g, ''), 10);
    assert.ok(n > 0 && n <= 50, `premium kredi bakiyesi gerçek olmalı (<=50): ${label}`);
  });

  it('B-6 hesap silme hatasında hata gösterilir ve oturum korunur (yalnız Android: uçak modu)', async () => {
    if (device.getPlatform() !== 'android') return;
    await relaunch();
    await waitForHome(60000);
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-delete-account', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-delete-account')).tap();
    await visible('e2e-profile-delete-confirm', 10000);
    await setAirplane(true);
    try {
      await element(by.id('e2e-profile-delete-confirm')).tap();
      await exists('e2e-profile-delete-error', 120000);
    } finally {
      await setAirplane(false);
    }
    // Oturum korundu: modalı kapatınca hâlâ üye.
    await element(by.text(/^(Cancel|Vazgeç)$/)).atIndex(0).tap();
    await expect(element(by.id('e2e-profile-delete-account'))).toExist();
  });

  it('hesap silme başarısı: misafire döner, kullanıcı verisi silinir', async () => {
    await sleep(2000);
    await scrollTo('e2e-profile-delete-account', 'e2e-profile-scroll');
    await element(by.id('e2e-profile-delete-account')).tap();
    await visible('e2e-profile-delete-confirm', 10000);
    await element(by.id('e2e-profile-delete-confirm')).tap();
    await waitForHome(30000);
    await skipTourIfShown();
    await toProfile();
    await scrollTo('e2e-profile-sign-in', 'e2e-profile-scroll');
    assert.equal(Number(mongo("print(db.users.countDocuments({}))")), 0);
  });
});
