/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  IDS,
  visible,
  exists,
  existsText,
  waitForHome,
  skipTourIfShown,
  settleOverlays,
  dismissBadgeIfShown,
  signInWithGoogle,
  openTab,
  scrollTo,
  waitForTextContaining,
  tapN,
  sleep,
  adb,
  resetUserData,
  notifPermissionGranted,
  apiSignIn,
  apiGet,
  mongo,
} = require('./helpers');

const isAndroid = device.getPlatform() === 'android';
const PKG = 'com.zikirmatik_asistan.app';
const count = (re) =>
  waitForTextContaining('e2e-home-count-label', new RegExp(`^${re.source.replace(/^\^|\$$/g, '')}(/\\d+)?$`), 10000);
const toCounter = () => scrollTo('e2e-home-counter', 'e2e-home-scroll', { direction: 'up' });

// Poll: göç (misafir -> üye) sunucuya yazıp bitirene kadar.
async function waitFor_(predicate, ms, what) {
  const deadline = Date.now() + ms;
  let last;
  while (Date.now() < deadline) {
    last = await predicate();
    if (last) return last;
    await sleep(1000);
  }
  throw new Error(`zaman aşımı: ${what}`);
}

describe('20 yolculuk 1: yeni misafir -> üye', () => {
  beforeAll(async () => {
    resetUserData();
    // OS izni verilmemiş temiz kurulum: iOS "unset"; Android'de kurulum sonrası izni geri al.
    await device.launchApp({ newInstance: true, delete: true, permissions: { notifications: isAndroid ? 'YES' : 'unset' } });
    if (isAndroid) {
      adb(`pm revoke ${PKG} android.permission.POST_NOTIFICATIONS`);
      await sleep(1500);
      await device.launchApp({ newInstance: true });
    }
  });

  it('@smoke ilk açılış: tur çıkar, OS bildirim izni penceresi açılmaz; misafir sayar ve kaydeder', async () => {
    await waitForHome(60000);
    // Tur: ilk açılışta gelir; ileri ile bir adım gez, sonra atla.
    await exists(IDS.tourSkip, 30000);
    await element(by.id('e2e-tour-next')).tap();
    await element(by.id(IDS.tourSkip)).tap();
    // Turdan sonra uygulama içi açıklama kartı çıkar (OS penceresi değil), ardından "Hoş geldin".
    await settleOverlays();
    await visible('e2e-home-counter', 20000);
    if (isAndroid) assert.equal(notifPermissionGranted(), false, 'ilk açılışta OS izni istenmemeli');

    // Misafir 3 sayar ve Kaydet: yerel zikir adlandırılır, ardından giriş istemi (ilerleme cihazda kalır).
    await tapN('e2e-home-counter', 3);
    await count(/^3$/);
    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Misafir Zikir');
    await element(by.id('e2e-home-save-target-input')).replaceText('3');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await visible('e2e-auth-prompt-confirm', 10000);
    await element(by.id('e2e-auth-prompt-cancel')).tap();
    await waitFor(element(by.id('e2e-auth-prompt-confirm'))).not.toExist().withTimeout(5000);
    await count(/^3$/);

    // Serbest modda 2 sayım daha (kaydedilmemiş): girişte "Serbest" olarak taşınır (M-19).
    await scrollTo('e2e-home-free-mode', 'e2e-home-scroll', { direction: 'up' });
    await element(by.id('e2e-home-free-mode')).tap();
    await toCounter();
    await tapN('e2e-home-counter', 2);
    await count(/^2$/);
    // Misafir hiçbir şeyi sunucuya yazmadı.
    assert.equal(Number(mongo('print(db.dhikr_logs.countDocuments({}))')), 0);
  });

  it('giriş yapınca misafir ilerlemesi ve serbest sayım taşınır; seri 1; ilk kayıttan sonra hatırlatma kartı "Şimdi değil"', async () => {
    await signInWithGoogle();
    await skipTourIfShown();
    await openTab('home');
    await skipTourIfShown();

    const { userId, accessToken } = await apiSignIn();
    const logs = await waitFor_(
      async () => {
        const all = await apiGet('/v1/dhikr-logs', accessToken);
        return all.some((l) => l.count === 3) && all.some((l) => l.count === 2) ? all : null;
      },
      60000,
      'göç logları (3 ve 2)',
    );
    assert.ok(logs.length >= 2);
    const personals = await apiGet('/v1/user-dhikrs', accessToken);
    const names = personals.map((p) => p.name);
    assert.ok(names.includes('Misafir Zikir'), JSON.stringify(names));
    assert.ok(names.some((n) => /^(Serbest|Free)$/.test(n)), `"Serbest" kişisel zikri yok: ${JSON.stringify(names)}`);

    // Zikirlerim'de iki öğe de görünür.
    await openTab('focus');
    await existsText(/^Misafir Zikir$/, 30000);
    await existsText(/^(Serbest|Free)$/, 30000);

    // Seri: göç edilen sayımlar bugünü aktif yaptı (M-21: sayım > 0 yeter) -> seri 1.
    await openTab('home');
    await skipTourIfShown();
    await waitForTextContaining('e2e-home-streak', /(Seri|Streak) 1\b/, 30000);
    assert.equal((await apiGet(`/v1/streaks/${userId}`, accessToken)).currentStreak, 1);

    // Sayaç artık yerel serbest sayımı taşımıyor (çift sayım yok).
    await toCounter();
    await count(/^0$/);

    // Üyenin ilk kaydı (serbest kayıt formu) -> B-11 hatırlatma kartı; "Şimdi değil" izin istemez.
    await tapN('e2e-home-counter', 1);
    await element(by.id('e2e-home-save')).tap();
    await visible('e2e-home-save-name-input', 10000);
    await element(by.id('e2e-home-save-name-input')).replaceText('Ilk Uye Kaydi');
    await element(by.id('e2e-home-save-target-input')).replaceText('1');
    await element(by.id('e2e-home-save-name-submit')).tap();
    await dismissBadgeIfShown(8000);
    await exists('e2e-notif-offer-dismiss', 30000);
    await element(by.id('e2e-notif-offer-dismiss')).tap();
    await waitFor(element(by.id('e2e-notif-offer-dismiss'))).not.toExist().withTimeout(10000);
    if (isAndroid) assert.equal(notifPermissionGranted(), false, '"Şimdi değil" OS izni istememeli');

    const after = await apiGet('/v1/dhikr-logs', accessToken);
    assert.ok(after.some((l) => l.count === 1), 'üye ilk kaydı sunucuda yok');
    // Aynı gün üçüncü kayıt: seri hâlâ 1.
    assert.equal((await apiGet(`/v1/streaks/${userId}`, accessToken)).currentStreak, 1);
  });
});
