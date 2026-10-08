/* global device, element, by, waitFor */
const assert = require('node:assert/strict');
const {
  freshSignIn,
  relaunch,
  waitForHome,
  skipTourIfShown,
  settleOverlays,
  visible,
  exists,
  existsText,
  openTab,
  scrollTo,
  sleep,
  seed,
  mongo,
  ymd,
  apiSignIn,
  apiGet,
  apiPost,
} = require('./helpers');

const UNLOCK_STATS = /^(Premium ile aç|Unlock with premium)$/;
const gone = (id, ms = 15000) => waitFor(element(by.id(id))).not.toExist().withTimeout(ms);
let me;
let programA;

const programs = () => apiGet('/v1/vird/programs', me.accessToken);
const reopen = async () => {
  await relaunch();
  await waitForHome(60000);
  await skipTourIfShown();
  await settleOverlays();
};
const openHub = async () => {
  await device.openURL({ url: 'zikirmatik://vird' });
  await visible('e2e-vird-hub', 20000);
};
const closePremiumSheet = async () => {
  await exists('e2e-premium-sheet', 15000);
  await scrollTo('e2e-premium-close', 'e2e-premium-scroll');
  await element(by.id('e2e-premium-close')).tap();
  await gone('e2e-premium-sheet', 10000);
};
const openThemeSelector = async () => {
  await openTab('profile');
  await scrollTo('e2e-settings-theme', 'e2e-profile-scroll');
  await element(by.id('e2e-settings-theme')).tap();
};
const pickSwatch = async (id) => {
  const swatch = `e2e-theme-option-${id}`;
  await scrollTo(swatch, 'e2e-theme-scroll');
  await element(by.id(swatch)).tap();
};
const userTheme = () => mongo('print(db.users.findOne({}).theme)');

describe('20 yolculuk 4: ücretsiz -> premium -> premium biter', () => {
  beforeAll(async () => {
    await freshSignIn();
    me = await apiSignIn();
    const d = await apiGet('/v1/dhikrs', me.accessToken);
    const dhikrId = (Array.isArray(d) ? d : d.items)[0]._id;
    const make = (title) =>
      apiPost('/v1/vird/programs', me.accessToken, {
        title: { tr: title, en: title },
        kind: 'routine',
        startDate: ymd(),
        phases: [{ fromDay: 1, toDay: null, slots: { morning: [{ dhikrId, target: 3 }] } }],
      });
    programA = await make('Program A');
    await make('Program B');
    await apiPost(`/v1/vird/programs/${programA._id}/activate`, me.accessToken);
  });

  it('ücretsiz: ikinci aktif program sınırı "Premium\'a geç" ile paywall açar; hatırlatma ve istatistik kilitli', async () => {
    await reopen();
    await openHub();
    await exists('e2e-vird-program-toggle', 20000);
    await expect(element(by.id('e2e-vird-reminder-settings'))).not.toExist();
    await element(by.id('e2e-vird-program-toggle')).atIndex(0).tap();
    await visible('e2e-vird-swap-pause-and-start', 10000);
    await element(by.text(/^(Premium'a geç|Go premium)$/)).atIndex(0).tap();
    await closePremiumSheet();
    await sleep(1000);
    const list = await programs();
    assert.equal(list.filter((p) => p.status === 'active').length, 1);
    assert.equal(list.find((p) => p._id === programA._id).status, 'active');

    await reopen();
    await openTab('stats');
    await existsText(UNLOCK_STATS, 30000);
    assert.equal((await apiGet('/v1/stats/summary', me.accessToken)).locked, true);
  });

  it('premium (seed): ikinci program modalsız aktifleşir; hatırlatma kartı ve premium istatistik açık; premium tema kaydedilir', async () => {
    seed('--premium e2e-user');
    await reopen();
    await openHub();
    await exists('e2e-vird-program-toggle', 20000);
    await element(by.id('e2e-vird-program-toggle')).atIndex(0).tap();
    await sleep(2500);
    await expect(element(by.id('e2e-vird-swap-pause-and-start'))).not.toExist();
    assert.equal((await programs()).filter((p) => p.status === 'active').length, 2);
    await exists('e2e-vird-reminder-settings', 15000);

    await reopen();
    await openTab('stats');
    await existsText(/^(Aktivite takvimi|Activity calendar)$/, 30000);
    await expect(element(by.text(UNLOCK_STATS))).not.toExist();
    assert.equal((await apiGet('/v1/stats/summary', me.accessToken)).locked, false);

    await openThemeSelector();
    await pickSwatch('gece-lacivert');
    await exists('e2e-theme-save', 10000);
    await element(by.id('e2e-theme-save')).tap();
    await gone('e2e-theme-save');
    await sleep(1500);
    assert.equal(userTheme(), 'gece-lacivert');
  });

  it('premium biter: programlar korunur, tema varsayılana döner, hatırlatma kartı kilitlenir', async () => {
    mongo(
      `db.users.updateMany({}, {$set: {isPremium: false}}); db.subscriptions.updateMany({}, {$set: {status: 'expired', endDate: new Date(Date.now() - 86400000)}})`,
    );
    await reopen();
    // Tema ücretsiz varsayılana döner (sunucuya da yazılır).
    const deadline = Date.now() + 20000;
    while (Date.now() < deadline && userTheme() !== 'gece-koyu') await sleep(1000);
    assert.equal(userTheme(), 'gece-koyu');

    await openHub();
    await exists('e2e-vird-program-toggle', 20000);
    await expect(element(by.id('e2e-vird-reminder-settings'))).not.toExist();
    await existsText(/^(Premium ile aç|Unlock with Premium)$/, 10000);
    // A-07: mevcut programlar korunur (otomatik duraklatılmaz).
    assert.equal((await programs()).filter((p) => p.status === 'active').length, 2);

    await reopen();
    await openTab('stats');
    await existsText(UNLOCK_STATS, 30000);
    assert.equal((await apiGet('/v1/stats/summary', me.accessToken)).locked, true);
  });
});
